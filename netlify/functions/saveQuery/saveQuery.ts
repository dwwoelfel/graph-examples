import { Handler, getSecrets, HandlerEvent } from "@netlify/functions";
import {
  buildClientSchema,
  GraphQLSchema,
  parse,
  visitWithTypeInfo,
  visit,
  validate,
  TypeInfo,
  GraphQLOutputType,
  isLeafType,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  Kind,
} from "graphql";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import { Octokit } from "octokit";
import { fetchServiceInfo } from "./../netlifyGraph";
import prettier from "prettier/standalone";
import prettierGraphql from "prettier/parser-graphql";
import { RequestError, wrapHandler } from "../common";
import { stringify as printYaml } from "yaml";

let schemaMemo: null | [number, GraphQLSchema] = null;

function getMemoizedSchema(buildNumber) {
  if (!schemaMemo) {
    return null;
  }
  const [memoBuildNumber, memoSchema] = schemaMemo;
  if (buildNumber <= memoBuildNumber) {
    return memoSchema;
  }
  return null;
}

function updateSchemaMemo(buildNumber, schema) {
  if (!schemaMemo) {
    schemaMemo = [buildNumber, schema];
  } else {
    const [memoBuildNumber] = schemaMemo;
    if (memoBuildNumber <= buildNumber) {
      schemaMemo = [buildNumber, schema];
    }
  }
}

async function getOneGraphSchema(buildNumber: number) {
  const fromMemo = getMemoizedSchema(buildNumber);
  if (fromMemo) {
    return fromMemo;
  }
  const resp = await fetch(
    "https://serve.onegraph.com/schema?app_id=1f166b60-5396-4a41-b4fb-a99c2570ac8d"
  );
  const json = await resp.json();
  // @ts-ignore
  const schema = buildClientSchema(json.data);
  updateSchemaMemo(buildNumber, schema);
  return schema;
}

function validateBody(event: HandlerEvent) {
  if (!event.headers["content-type"]?.startsWith("application/json")) {
    return new Error("Invalid Content-Type header. Expected application/json.");
  }
  try {
    const json = JSON.parse(event.body);
    const query = json.query;
    const operationName = json.operationName;
    const doc = json.doc;
    if (!query) {
      return new Error(
        "Invalid body. Expected key `query` with a GraphQL query."
      );
    }
    if (doc && typeof doc !== "string") {
      return new Error("Invalid body. Expected key `doc` to be a string.");
    }
    try {
      const parsedQuery = parse(query);
      let validatedOperationName;

      for (const definition of parsedQuery.definitions) {
        if (definition.kind === Kind.OPERATION_DEFINITION) {
          if (!definition.name?.value) {
            return new Error(
              "Can not save query. The query must have an operation name to save it."
            );
          }
          if (operationName && definition.name.value !== operationName) {
            return new Error(
              `Can not save query. Expected ${operationName} to be the only operation in the GraphQL query, found ${definition.name.value}.`
            );
          } else {
            validatedOperationName = definition.name.value;
          }
        }
      }
      if (!validatedOperationName) {
        return new Error(
          `Can not save query. Did not find ${
            operationName ? `${operationName} ` : ""
          }operation.`
        );
      }
      return {
        parsedQuery,
        query,
        operationName: validatedOperationName,
        doc,
      };
    } catch (e) {
      return new Error(e);
    }
  } catch (e) {
    return new Error("Invalid body. Must be valid JSON.");
  }
}

function getUnderlyingTypeName(t: GraphQLOutputType): string {
  if (isLeafType(t)) {
    return t.name;
  }
  if (t instanceof GraphQLObjectType) {
    return t.name;
  }
  if (t instanceof GraphQLUnionType) {
    return t.name;
  }
  if (t instanceof GraphQLInterfaceType) {
    return t.name;
  }
  if (t.ofType) {
    return getUnderlyingTypeName(t.ofType);
  }

  throw new Error("Unexpected type " + t.toString());
}

function makeExampleMarkdown({ query, operationName, services, doc }) {
  const frontmatter = printYaml({ operationName, services, doc });
  const prettyQuery = prettier
    .format(query, {
      parser: "graphql",
      plugins: [prettierGraphql],
    })
    .trim();

  return `---
${frontmatter}
---

\`\`\`graphql
${prettyQuery}
\`\`\`

`;
}

async function getOctokit(event) {
  const secrets = await getSecrets(event);

  const gitHubToken = secrets.gitHub?.bearerToken;

  if (!gitHubToken) {
    throw new RequestError({
      statusCode: 500,
      errors: [{ message: "Internal error. Missing GitHub authentication." }],
    });
  }

  return new Octokit({ auth: gitHubToken });
}

async function saveQuery(event) {
  const bodyOrError = validateBody(event);
  if (bodyOrError instanceof Error) {
    throw new RequestError({
      statusCode: 400,
      errors: [{ message: bodyOrError.message }],
    });
  }

  const { query, parsedQuery, operationName, doc } = bodyOrError;

  const octokitPromise = getOctokit(event);

  const mainBranchPromise = octokitPromise
    .then((octokit) =>
      octokit.rest.repos.getBranch({
        owner: "dwwoelfel",
        repo: "graph-examples",
        branch: "refs/heads/main",
      })
    )
    .catch((e) => {
      return e;
    });

  const existingFilePromise = octokitPromise
    .then(async (octokit) => {
      const content = await octokit.rest.repos.getContent({
        owner: "dwwoelfel",
        repo: "graph-examples",
        path: `examples/${operationName}.md`,
        ref: "refs/heads/main",
      });
      if (content.data) {
        return new RequestError({
          statusCode: 400,
          errors: [
            { message: `An example named ${operationName} already exists.` },
          ],
        });
      }
    })
    .catch((e) => {
      if (e.status === 404) {
        return null;
      } else {
        return null;
        // TODO: throw error if we can't check
      }
      /* throw new RequestError({
        statusCode: 500,
        errors: [
          {
            message: `Internal error. Could not check if an example with ${operationName} already exists.`,
          },
        ],
      }); */
    });

  const serviceInfo = await fetchServiceInfo({});

  const buildNumber = serviceInfo.data.oneGraph.serverInfo.buildNumber;

  const schema = await getOneGraphSchema(buildNumber);

  const services = serviceInfo.data.oneGraph.services;

  const errors = validate(schema, parsedQuery);

  if (errors.length) {
    throw new RequestError({
      statusCode: 400,
      errors: [...errors],
    });
  }

  const allTypeNames = new Set([]);

  const typeInfo = new TypeInfo(schema);

  const visitor = {
    enter(_node) {
      const type = typeInfo.getType();
      if (type) {
        allTypeNames.add(getUnderlyingTypeName(type));
      }
    },
  };

  visit(parsedQuery, visitWithTypeInfo(typeInfo, visitor));

  const usedServices = new Set([]);

  for (const typeName of allTypeNames) {
    const service = services.find((s) => typeName.startsWith(s.typePrefix));
    if (service) {
      usedServices.add(service);
    }
  }

  const mainBranch = await mainBranchPromise;

  const newBranchRef = `refs/heads/save-query-${nanoid(8)}`;
  const octokit = await octokitPromise;

  const existingFileError = await existingFilePromise;
  if (existingFileError) {
    throw existingFileError;
  }

  await octokit.rest.git.createRef({
    owner: "dwwoelfel", // TODO: get from environment
    repo: "graph-examples", // TODO: get from environment
    ref: newBranchRef,
    sha: mainBranch.data.commit.sha,
  });

  const content = makeExampleMarkdown({
    query,
    operationName,
    services: [...usedServices],
    doc,
  });

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: "dwwoelfel",
    repo: "graph-examples",
    path: `examples/${operationName}.md`,
    message: `Add ${operationName} example`,
    content: Buffer.from(content).toString("base64"),
    branch: newBranchRef,
  });

  const pull = await octokit.rest.pulls.create({
    owner: "dwwoelfel",
    repo: "graph-examples",
    head: newBranchRef,
    base: "refs/heads/main",
    title: `Add ${operationName} example`,
  });

  return {
    data: {
      pullRequest: {
        url: pull.data.html_url,
        number: pull.data.number,
      },
    },
  };
}

export const handler: Handler = wrapHandler((event) => {
  return saveQuery(event);
});

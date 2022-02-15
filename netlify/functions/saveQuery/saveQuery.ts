import { Handler, getSecrets } from "@netlify/functions";
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

function validateBody(event) {
  if (!event.headers["content-type"]?.startsWith("application/json")) {
    return new Error("Invalid Content-Type header. Expected application/json.");
  }
  try {
    const json = JSON.parse(event.body);
    const query = json.query;
    const operationName = json.operationName;
    if (!query) {
      return new Error(
        "Invalid body. Expected key `query` with a GraphQL query."
      );
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

function makeExampleMarkdown({ query, operationName, services }) {
  const prettyQuery = prettier
    .format(query, {
      parser: "graphql",
      plugins: [prettierGraphql],
    })
    .trim();
  return `---
operationName: ${operationName}
services:${services.map((s) => `\n  - ${s.service}`).join("")}
---

\`\`\`graphql
${prettyQuery}
\`\`\`

`;
}

async function getOctokit() {
  const secrets = await getSecrets();

  const gitHubToken = secrets.gitHub?.bearerToken;

  if (!gitHubToken) {
    // XXX: Make own error class
    throw new Error("Internal error. Missing GitHub authentication.");
  }

  return new Octokit({ auth: gitHubToken });
}

export const handler: Handler = async (event, context) => {
  const bodyOrError = validateBody(event);
  if (bodyOrError instanceof Error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: bodyOrError.message,
      }),
    };
  }

  const { query, parsedQuery, operationName } = bodyOrError;

  const octokitPromise = getOctokit();

  const mainBranchPromise = octokitPromise.then((octokit) =>
    octokit.rest.repos.getBranch({
      owner: "dwwoelfel",
      repo: "graph-examples",
      branch: "refs/heads/main",
    })
  );

  const serviceInfo = await fetchServiceInfo({});

  const buildNumber = serviceInfo.data.oneGraph.serverInfo.buildNumber;

  const schema = await getOneGraphSchema(buildNumber);

  const services = serviceInfo.data.oneGraph.services;

  const errors = validate(schema, parsedQuery);

  if (errors.length) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        errors: errors,
      }),
    };
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
    statusCode: 200,
    body: JSON.stringify({
      pullRequest: {
        url: pull.data.html_url,
        number: pull.data.number,
      },
    }),
  };
};

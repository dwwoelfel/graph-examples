import { Handler } from "@netlify/functions";
import { buildClientSchema, GraphQLSchema, parse } from "graphql";
import fetch from "node-fetch";
import { fetchServiceInfo } from "./../netlifyGraph";

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
    if (!query) {
      return new Error(
        "Invalid body. Expected key `query` with a GraphQL query."
      );
    }
    try {
      const parsedQuery = parse(query);
      return {
        parsedQuery,
        query,
      };
    } catch (e) {
      return new Error(e);
    }
  } catch (e) {
    return new Error("Invalid body. Must be valid JSON.");
  }
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

  const { query, parsedQuery } = bodyOrError;

  const serviceInfo = await fetchServiceInfo({});

  const buildNumber = serviceInfo.data.oneGraph.serverInfo.buildNumber;

  const schema = await getOneGraphSchema(buildNumber);

  const previxes = new Set(
    serviceInfo.data.oneGraph.services.map((s) => s.typePrefix)
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      schemaLength: Object.keys(schema.getTypeMap()).length,
    }),
  };
};

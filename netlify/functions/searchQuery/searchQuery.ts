import { Handler, HandlerEvent } from "@netlify/functions";
import sqllite, { Database } from "better-sqlite3";
import dbState from "../db.json";
import { RequestError, wrapHandler } from "../common";

const serializedDb = Buffer.from(dbState.db, "base64");
// @ts-expect-error: this is allowed, but the person who wrote the types didn't know that
const db: Database = sqllite(serializedDb);

const byOperation = /* sql */ `
  select query.operationName, query.body, query.services from query 
    where query.operationName = $operationName
`;

const findQueryByOperation = db.prepare(byOperation);

function queryByServices(db: Database, services: string[]) {
  const paramPlaceholders = [...new Array(services.length)]
    .map((_x) => "?")
    .join(", ");

  const statement = /* sql */ `
    select query.operationName, query.body, query.services from query 
      where operationName in (
        select distinct operationName from query_join_service 
          where service in (${paramPlaceholders})
      )
`;

  return db.prepare(statement).all(services);
}

function validateQuery(event: HandlerEvent) {
  const { operationName, services } = event.queryStringParameters;
  if (!operationName && !services) {
    throw new RequestError({
      statusCode: 400,
      errors: [
        { message: "Pass either operationName or services as a query param." },
      ],
    });
  }

  return { operationName, services: services ? services.split(/,/) : null };
}

async function searchQuery(event) {
  const { operationName, services } = validateQuery(event);
  const queries = operationName
    ? findQueryByOperation.all({ operationName })
    : queryByServices(db, services);

  const results = [];

  for (const query of queries) {
    results.push({
      operationName: query.operationName,
      body: query.body,
      services: JSON.parse(query.services),
    });
  }
  return { data: results };
}

export const handler: Handler = wrapHandler((event) => {
  return searchQuery(event);
});

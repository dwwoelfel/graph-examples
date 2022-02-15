import { Handler } from "@netlify/functions";
import { env } from "process";

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      event,
      env: env,
    }),
  };
};

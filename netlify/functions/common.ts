import {
  Handler as FunctionHandler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";
import { GraphQLError } from "graphql";

export type ErrorObject = {
  statusCode: number;
  errors: Array<{ message: string } | GraphQLError>;
};

export class RequestError extends Error {
  readonly error: ErrorObject;
  constructor(error: ErrorObject) {
    super(error.errors[0]?.message || "");
    this.error = error;
  }
}

export type Handler = (
  event: HandlerEvent,
  context: HandlerContext
) => Promise<{ data: any }>;

export function wrapHandler(handler: Handler): FunctionHandler {
  return async (event, context) => {
    try {
      const response = await handler(event, context);
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    } catch (e) {
      if (e instanceof RequestError) {
        return {
          statusCode: e.error.statusCode,
          body: JSON.stringify({ errors: e.error.errors }),
        };
      }
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({
          errors: [{ message: "Unexpected error. Please try again." }],
        }),
      };
    }
  };
}

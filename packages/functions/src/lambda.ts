import { ApiHandler } from "sst/node/api";
import { corsHeaders } from "./utils";

export const handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
    headers: corsHeaders
  };
});

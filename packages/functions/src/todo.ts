import { ApiHandler } from "sst/node/api";
import { Todos } from "@paypals/core/todo";
import {corsHeaders} from "./utils"

export const create = ApiHandler(async (_evt) => {
  await Todos.create();

  return {
    statusCode: 200,
    body: "Todo created",
    headers: corsHeaders,
  };
});

export const list = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: JSON.stringify(Todos.list()),
    headers: corsHeaders,
  };
});

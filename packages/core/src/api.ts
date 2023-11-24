import { initTRPC } from "@trpc/server";
import { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import { APIGatewayProxyEventV2 } from "aws-lambda";

import { Todos } from "./todo";

export const trpc = initTRPC.create();

export const router = trpc.router({
    todos: trpc.router({
        list: trpc.procedure.query(() => {
            return Todos.list();
        }),
    }),
});

export const createContext = ({
    event,
    context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({});

export type Context = Awaited<ReturnType<typeof createContext>>;

export type Router = typeof router;

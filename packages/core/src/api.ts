import { initTRPC } from "@trpc/server";
import { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import { APIGatewayProxyEventV2 } from "aws-lambda";

import { Todos } from "./todo";

import z from "zod"

export const trpc = initTRPC.create();

export const router = trpc.router({
    todos: trpc.router({
        list: trpc.procedure.query(() => {
            return Todos.list();
        }),
        lazy: trpc.procedure.input(
            z.object({
                cursor: z.number().default(0),
                pageSize: z.number().default(20),
            })
        ).output(z.object({
            rows: z.array(z.object({
                id: z.string(),
                title: z.string(),
            })),
            meta: z.object({
                page: z.number(),
                totalRowCount: z.number(),
            })
        })).query(({input}) => {
            const {cursor, pageSize} = input;
            const all = Todos.list();
            const start = cursor * pageSize;
            const end = start + pageSize;
            
            return {
                rows: all.slice(start, end),
                meta: {
                    page: cursor,
                    totalRowCount: all.length,
                }
            }
        })
    }),
});

export const createContext = ({
    event,
    context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({});

export type Context = Awaited<ReturnType<typeof createContext>>;

export type Router = typeof router;

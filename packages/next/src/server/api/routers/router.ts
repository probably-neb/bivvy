import { ApiHandler } from "sst/node/api";
import {
    awsLambdaRequestHandler,
} from "@trpc/server/adapters/aws-lambda";

import { initTRPC } from "@trpc/server";

import { Groups } from "@paypals/core/groups";

import z from "zod";

const createContext = (_: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({});

type Context = Awaited<ReturnType<typeof createContext>>;

const trpc = initTRPC.context<Context>().create();

const router = trpc.router({
    expenses: trpc.router({
        list: trpc.procedure.query(() => {
            // FIXME: id
            return Groups.expenses(0);
        }),
        lazy: trpc.procedure
            .input(
                z.object({
                    cursor: z.number().default(0),
                    pageSize: z.number().default(20),
                }),
            )
            .output(
                z.object({
                    rows: z.array(
                        z.object({
                            id: z.string(),
                            title: z.string(),
                        }),
                    ),
                    meta: z.object({
                        page: z.number(),
                        totalRowCount: z.number(),
                    }),
                }),
            )
            .query(async ({ input }) => {
                const { cursor, pageSize } = input;
                // FIXME: id
                // FIXME: pagination, filters, etc
                const all = await Groups.expenses(0);
                const start = cursor * pageSize;
                const end = start + pageSize;

                return {
                    rows: all.slice(start, end),
                    meta: {
                        page: cursor,
                        totalRowCount: all.length,
                    },
                };
            }),
    }),
});

export type Router = typeof router;

export const handler = ApiHandler(awsLambdaRequestHandler({
    router,
    createContext,
}));


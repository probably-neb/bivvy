import { router, procedure } from "@/server/api/trpc";
import { Groups } from "@paypals/core/groups";

import z from "zod";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
    expenses: router({
        list: procedure.query(async () => Groups.expenses(0)
            // FIXME: id
        ),
        lazy: procedure
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

// export type definition of API
export type AppRouter = typeof appRouter;

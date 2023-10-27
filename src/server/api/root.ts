import { postRouter } from "@/server/api/routers/post";
import { t } from "@/server/api/trpc";
import {z} from "zod"
import {fetchData} from "./mockData"

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = t.router({
    post: postRouter,
    users: t.procedure
    .input(z.object({
        cursor: z.number()
    }))
    .query((opts) => {
        return fetchData(opts.input.cursor, [])
    })
});

// export type definition of API
export type AppRouter = typeof appRouter;

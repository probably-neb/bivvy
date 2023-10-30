import { postRouter } from "@/server/api/routers/post";
import { t } from "@/server/api/trpc";
import {z} from "zod"
import {fetchData} from "./mockData"
import { type SortingState } from "@tanstack/react-table";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = t.router({
    post: postRouter,
    users: t.procedure
    .input(z.object({
        cursor: z.number(),
        sorting: z.custom<SortingState>().default([])
    }))
    .query(({input: {cursor, sorting}}) => {
        return fetchData(cursor, sorting)
    })
});

// export type definition of API
export type AppRouter = typeof appRouter;

export * as Todos from "./todo";
import { z } from "zod";
import crypto from "crypto";

import { event } from "./event";

export type Todo = {
    id: string;
    title: string;
};

export const Events = {
    Created: event("todo.created", {
        id: z.string(),
    }),
};

export async function create() {
    const id = crypto.randomUUID();
    // write to database

    await Events.Created.publish({
        id,
    });
}

export function list() {
    return Array(500)
        .fill(0)
        .map((_, index) => ({
            id: crypto.createHash("sha256").update(String(index)).digest("hex"),
            title: "Todo #" + index,
        }));
}
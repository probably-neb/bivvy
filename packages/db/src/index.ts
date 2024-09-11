import { Resource } from "sst";
import { drizzle } from "drizzle-orm/libsql";
// TODO: determine whether figuring out @libsql/client error (cant find @libsql/linux-x64-gnu)
// is worth it for dedicated db connection instead of https requests for each db call
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export * as schema from "./schema";

export * as DB from "./index";

export * as drizzle from "drizzle-orm"

export { sql, and, or, eq } from "drizzle-orm/sql";
export { alias } from "drizzle-orm/sqlite-core";

console.log("creating connection")
export const connection = createClient({
    // @ts-expect-error DB_URL should be linked
    url: Resource.DB_URL.value,
    // @ts-expect-error DB_TOKEN should be linked
    authToken: Resource.DB_TOKEN.value,
});

console.log('connection established', connection.protocol)

export const db = drizzle(connection, { schema, logger: true });

import {Resource} from "sst"
import {drizzle} from "drizzle-orm/libsql"
// TODO: determine whether figuring out @libsql/client error (cant find @libsql/linux-x64-gnu)
// is worth it for dedicated db connection instead of https requests for each db call
import {createClient} from "@libsql/client"
import * as schema from "./schema";

export * as schema from "./schema"

export * as DB from './index';

export {sql, and, or, eq} from "drizzle-orm/sql"
export {alias} from "drizzle-orm/sqlite-core"

export const connection = createClient({url: Resource.DB_URL.value, authToken: Resource.DB_TOKEN.value})

export const db = drizzle(connection, {schema})

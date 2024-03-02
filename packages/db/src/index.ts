import {Config} from "sst/node/config"
import {drizzle} from "drizzle-orm/planetscale-serverless"
import {connect} from "@planetscale/database"
import * as schema from "./schema";

export * as schema from "./schema"

export * as DB from './index';

export {sql, and, or, eq} from "drizzle-orm/sql"
export {alias} from "drizzle-orm/mysql-core"

export const connection = connect({url: Config.DB_URL!})

export const db = drizzle(connection, {schema})

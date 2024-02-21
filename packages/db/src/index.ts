import {Config} from "sst/node/config"
import {drizzle} from "drizzle-orm/planetscale-serverless"
import {connect} from "@planetscale/database"
import * as schema from "./schema";

export * as schema from "./schema"

export * as DB from './index';

export const connection = connect({url: Config.DB_URL!})

export const db = drizzle(connection, {schema})

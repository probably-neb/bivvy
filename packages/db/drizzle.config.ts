import {Config} from "drizzle-kit"

const DB_URL = process.env.DB_URL!.replace("sslaccept=strict", 'ssl={"rejectUnauthorized":true}')

export default {
    schema: "./src/schema.ts",
    out: "./migrations",
    driver: "mysql2",
    dbCredentials: {
        uri: DB_URL,
    }
} satisfies Config;

import {Config} from "drizzle-kit"

export default {
    schema: "./src/schema.ts",
    out: "./migrations",
    driver: "mysql2"
    // FIXME: connection string
} satisfies Config;

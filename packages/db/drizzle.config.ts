import {Config as DrizzleConfig} from "drizzle-kit"

console.log(process.env)
const DB_TOKEN = process.env.DB_TOKEN!;
let DB_URL = process.env.DB_URL!;
if (DB_URL.startsWith("http")) {
    DB_URL = DB_URL.replace("https", "libsql")
}
console.log({DB_URL, DB_TOKEN})
export default {
    schema: "./src/schema.ts",
    out: "./migrations",
    driver: "turso",
    dbCredentials: {
        url: DB_URL!,
        authToken: DB_TOKEN!
    }
} satisfies DrizzleConfig;

import {Config as DrizzleConfig} from "drizzle-kit"

console.log(process.env)
const DB_TOKEN = process.env.DB_TOKEN!;
let DB_URL = process.env.DB_URL!;
// FIXME: why is DB_URL not being set?
DB_URL = "https://bivvy-probably-neb.turso.io"
if (DB_URL.startsWith("http")) {
    DB_URL = DB_URL.replace("https", "libsql")
}
console.log({DB_URL, DB_TOKEN})
export default {
    schema: "./src/schema.ts",
    out: "./migrations",
    driver: "turso",
    dialect: "sqlite",
    dbCredentials: {
        url: DB_URL!,
        authToken: DB_TOKEN!
    },
    verbose: true,
    strict: true,
    breakpoints: true,
} satisfies DrizzleConfig;

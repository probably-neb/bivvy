import { Config, StackContext } from "sst/constructs";

export function DB({stack}: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL");
    const DB_TOKEN = new Config.Secret(stack, "DB_TOKEN");

    return {
        dbUrl: DB_URL,
        dbToken: DB_TOKEN
    }
}

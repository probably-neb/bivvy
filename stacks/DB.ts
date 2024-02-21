import { Config, StackContext } from "sst/constructs";

export function DB({stack}: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL");

    return {
        dbUrl: DB_URL,
    }
}

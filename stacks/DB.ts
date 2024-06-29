import { Config, StackContext, Cron, Function} from "sst/constructs";

export function DB({stack}: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL");
    const DB_TOKEN = new Config.Secret(stack, "DB_TOKEN");

    const keepAlive = new Cron(stack, "KeepAlive", {
        schedule: "rate(5 days)",
        job: new Function(stack, "KeepAliveLambda", {
            handler: "packages/functions/lambdas/db/keep-alive.handler",
            bind: [DB_URL, DB_TOKEN],
        }),
    })

    return {
        dbUrl: DB_URL,
        dbToken: DB_TOKEN
    }
}

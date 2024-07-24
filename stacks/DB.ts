import { Config, StackContext, Cron, Function} from "sst/constructs";

export function DB({stack}: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL");
    const DB_TOKEN = new Config.Secret(stack, "DB_TOKEN");

    const keepAlive = new Cron(stack, "KeepAlive", {
        schedule: "rate(1 minute)",
        job: new Function(stack, "KeepAliveLambda", {
            handler: "packages/functions/lambdas/db/keep-alive.handler",
            runtime: "nodejs20.x",
            architecture: "x86_64",
            nodejs: {
                install: ["@libsql/client", "@libsql/linux-x64-gnu"],
            },
            enableLiveDev: false,
            bind: [DB_URL, DB_TOKEN],
        }),
    })

    return {
        dbUrl: DB_URL,
        dbToken: DB_TOKEN
    }
}

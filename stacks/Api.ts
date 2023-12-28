import { StackContext, Api, Config, Table } from "sst/constructs";

export function API({ stack }: StackContext) {

    const DB_URL = new Config.Secret(stack, "DB_URL")

    const DSN = new Config.Secret(stack, "DSN")

    const clientTable = new Table(stack, "clientTable", {
        fields: {
            ClientGroupId: "string",
            ClientId: "string",
            LastMutationId: "number"
        },
        primaryIndex: {
            partitionKey: "ClientGroupId",
            sortKey: "ClientId"
        }
    });

    const api = new Api(stack, "api", {
        defaults: {
            function: {
                bind: [DB_URL]
            },
        },
        cors: {
            allowOrigins: ["*"],
            allowMethods: ["ANY"],
        },
        routes: {
            "POST /pull": {
                function: {
                    handler: "packages/functions/lambdas/pull/pull.go",
                    runtime: "go",
                    bind: [clientTable, DSN],
                    permissions: ["ssm"],
                    environment: {
                        CLIENT_TABLE_NAME: clientTable.tableName,
                        SST_REGION: stack.region,
                    },
                }
            },
            "POST /push": {
                function: {
                    handler: "packages/functions/lambdas/push/push.go",
                    runtime: "go",
                    bind: [clientTable],
                    permissions: ["ssm"],
                    environment: {
                        CLIENT_TABLE_NAME: clientTable.tableName
                    }
                }
            },
        },
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
    });
    return { api }
}

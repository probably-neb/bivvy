import { StackContext, Api, Config, Table, Auth } from "sst/constructs";

export default function API({ stack }: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL");

    const DSN = new Config.Secret(stack, "DSN");

    const clientTable = new Table(stack, "clientTable", {
        fields: {
            ClientGroupId: "string",
            ClientId: "string",
            LastMutationId: "number",
            UserId: "string",
            ExpireAt: "number",
        },
        // FIXME: ttl attribute
        primaryIndex: {
            partitionKey: "ClientGroupId",
            sortKey: "ClientId",
        },
        timeToLiveAttribute: "ExpireAt",
    });

    const api = new Api(stack, "api", {
        defaults: {
            function: {
                bind: [DB_URL],
            },
        },
        cors: {
            // TODO: prod url
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
                },
            },
            "POST /push": {
                function: {
                    handler: "packages/functions/lambdas/push/push.go",
                    runtime: "go",
                    bind: [clientTable, DSN],
                    permissions: ["ssm"],
                    environment: {
                        CLIENT_TABLE_NAME: clientTable.tableName,
                        SST_REGION: stack.region,
                    },
                },
            },
            "GET /invite": {
                function: {
                    handler: "packages/functions/auth/invite.createHandler",
                    bind: [],
                },
            },
            "GET /invite/validate": {
                function: {
                    handler: "packages/functions/auth/invite.validateHandler",
                    bind: [],
                },
            },
        },
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
        ApiEndpoints: "\n     " + api.routes.join("\n     "),
    });
    return { api };
}

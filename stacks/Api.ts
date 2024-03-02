import { StackContext, Api, Config, Table, Auth, use } from "sst/constructs";
import DNS from "./DNS";
import { DB } from "./DB";


export default function API({ stack }: StackContext) {
    const {dbUrl: DB_URL} = use(DB);
    const dns = use(DNS);

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
        customDomain: {
            domainName: "api." + dns.domain,
            hostedZone: dns.zone,
        },
        routes: {
            "POST /pull": {
                function: {
                    handler: "packages/functions/lambdas/pull.handler",
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
                    handler: "packages/functions/lambdas/push.handler",
                    bind: [clientTable, DSN],
                    permissions: ["ssm"],
                    environment: {
                        CLIENT_TABLE_NAME: clientTable.tableName,
                        SST_REGION: stack.region,
                    },
                },
            },
            "POST /scan/receipt": {
                function: {
                    handler: "packages/functions/lambdas/scan/receipt/receipt.go",
                    runtime: "go",
                    permissions: ["ssm", "textract:AnalyzeExpense"],
                },
            },
            "POST /scan/spreadsheet": {
                function: {
                    handler: "packages/functions/lambdas/scan/table/table.go",
                    runtime: "go",
                    permissions: ["ssm"],
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

    const apiUrl = api.customDomainUrl || api.url

    stack.addOutputs({
        ApiEndpoint: apiUrl,
        ApiEndpoints: "\n     " + api.routes.join("\n     "),
    });
    return { api, apiUrl };
}

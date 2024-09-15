import { SSTConfig } from "sst";
import Api from "./stacks/Api";
import Site from "./stacks/Site";
import Auth from "./stacks/Auth";
import DNS from "./stacks/DNS";
import { DB } from "./stacks/DB";

export default {
    config(input) {
        return {
            name: "paypals",
            region: "us-west-2",
            profile:
                input.stage == "prod" ? "paypals-prod" : "paypals-dev",
        };
    },
    stacks(app) {
        if (app.stage !== "prod") {
            app.setDefaultRemovalPolicy("destroy")
        }

        $transform(sst.aws.Function, (args, opts) => {
            args.link ??= [...(args.link ?? []), auth];
            return args;
        });

        const DBKeepAlive = new sst.aws.Cron("KeepAlive", {
            schedule: "rate(1 minute)",
            job: {
                handler: "packages/functions/lambdas/db/keep-alive.handler",
                live: false,
                link: [DB_URL, DB_TOKEN],
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            },
        });

        const clientTable = new sst.aws.Dynamo("clientTable", {
            fields: {
                ClientGroupId: "string",
                ClientId: "string",
                // LastMutationId: "number",
                // UserId: "string",
                // ExpireAt: "number",
            },
            // FIXME: ttl attribute
            primaryIndex: {
                hashKey: "ClientGroupId",
                rangeKey: "ClientId",
            },
            ttl: "ExpireAt",
        });

        const api = new sst.aws.ApiGatewayV2("api", {
            cors: {
                // TODO: prod url
                allowOrigins: ["*"],
                allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            },
            domain: {
                name: "api." + domain,
            },
        });
        {
            api.addAuthorizer;
            api.route("POST /pull", {
                handler: "packages/functions/lambdas/pull.handler",
                link: [clientTable, DB_URL, DB_TOKEN, auth],
                environment: {
                    CLIENT_TABLE_NAME: clientTable.name,
                    REGION: $app.providers!.aws.region,
                    // SST_REGION: clientTable.nodes.table.restoreSourceName,
                },
                // live: false,
                memory: "2 GB",
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            });
            api.route("POST /push", {
                handler: "packages/functions/lambdas/push.handler",
                link: [clientTable, DB_URL, DB_TOKEN, auth],
                environment: {
                    CLIENT_TABLE_NAME: clientTable.name,
                    // SST_REGION: stack.region,
                },
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            });
            // api.route("POST /scan/receipt", {
            //     handler: "packages/functions/lambdas/scan/receipt/receipt.go",
            //     // runtime: "go",
            //     permissions: [
            //         {
            //             actions: ["textract:AnalyzeExpense"],
            //             resources: ["*"],
            //         },
            //     ],
            // });
            // api.route("POST /scan/spreadsheet", {
            //     handler: "packages/functions/lambdas/scan/table/table.go",
            //     runtime: "go",
            // });
            api.route("GET /session", {
                handler: "packages/functions/auth/validate-session.handler",
                link: [auth, DB_URL, DB_TOKEN],
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            });
            api.route("GET /invite", {
                handler: "packages/functions/auth/invite.createHandler",
                link: [auth, DB_URL, DB_TOKEN],
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            });
            api.route("GET /invite/validate", {
                handler: "packages/functions/auth/invite.validateHandler",
                link: [auth, DB_URL, DB_TOKEN],
                runtime: "nodejs18.x",
                architecture: "x86_64",
                nodejs: {
                    install: ["@libsql/client", "@libsql/linux-x64-gnu"],
                },
            });
        }

        // stack.addOutputs({
        //     ApiEndpoint: api.url,
        //     ApiEndpoints: "\n     " + api.routes.join("\n     "),
        // });
        //

        const REPLICACHE_LICENSE_KEY = new sst.Secret(
            "REPLICACHE_LICENSE_KEY",
            "lf7fcf72797fa44a3a0b0469a7af59d61"
        );

        const site = new sst.aws.StaticSite("Site", {
            path: "packages/site",
            build: {
                output: "dist",
                command: "pnpm run build",
            },
            environment: {
                VITE_IS_LOCAL: String($dev),
                VITE_API_URL: api.url,
                VITE_AUTH_URL: "https://" + AUTH_DOMAIN,
                VITE_REPLICACHE_LICENSE_KEY: REPLICACHE_LICENSE_KEY.value,
            },
            domain: !$dev
                ? {
                      name: domain,
                  }
                : undefined,
        });

        let SITE_URL = site.url.apply((url) => {
            if ($dev) return "http://localhost:5173";
            if (!url.startsWith("http")) {
                return "https://" + url;
            }
            return url;
        });
    },
} satisfies SSTConfig;

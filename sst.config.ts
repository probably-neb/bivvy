/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
    app(input) {
        return {
            name: "paypals",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            providers: {
                aws: {
                    region: "us-west-2",
                    profile:
                        input.stage === "production"
                            ? "paypals-prod"
                            : "paypals-dev",
                },
            },
        };
    },
    async run() {
        const DB_URL = new sst.Secret("DB_URL");
        const DB_TOKEN = new sst.Secret("DB_TOKEN");

        $transform(sst.aws.Function, (args, opts) => {
            // Set the default if it's not set by the component
            args.runtime ??= "nodejs20.x";
            args.link ??= [...(args.link ?? []), DB_URL, DB_TOKEN];
            args.architecture ??= "x86_64";
            args.nodejs ??= {
                install: [
                    ...(args.nodejs?.install ?? []),
                    "@libsql/client",
                    "@libsql/linux-x64-gnu",
                ],
                ...args.nodejs,
            };
        });

        const DBKeepAlive = new sst.aws.Cron("KeepAlive", {
            schedule: "rate(1 minute)",
            job: {
                handler: "packages/functions/lambdas/db/keep-alive.handler",
                live: false,
                link: [DB_URL, DB_TOKEN],
            },
        });

        const DNS_MAPPING: Record<string, string> = {
            production: "bivvy.cc",
            prod: "bivvy.cc",
            development: "dev.bivvy.cc",
            dev: "dev.bivvy.cc",
        };

        const stage = $app.stage;
        const zone = DNS_MAPPING[stage] || "dev.bivvy.cc";
        const domain = DNS_MAPPING[stage] || `${stage}.dev.bivvy.cc`;

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
                link: [clientTable],
                environment: {
                    CLIENT_TABLE_NAME: clientTable.name,
                    REGION: $app.providers!.aws.region,
                    // SST_REGION: clientTable.nodes.table.restoreSourceName,
                },
            });
            api.route("POST /push", {
                handler: "packages/functions/lambdas/push.handler",
                link: [clientTable],
                environment: {
                    CLIENT_TABLE_NAME: clientTable.name,
                    // SST_REGION: stack.region,
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
            });
            api.route("GET /invite", {
                handler: "packages/functions/auth/invite.createHandler",
            });
            api.route("GET /invite/validate", {
                handler: "packages/functions/auth/invite.validateHandler",
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

        const AUTH_DOMAIN = "auth." + domain

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

        const gcid = new sst.Secret("GOOGLE_CLIENT_ID");
        const gcids = new sst.Secret("GOOGLE_CLIENT_ID_SECRET");

        const auth = new sst.aws.Auth("auth", {
            authenticator: {
                handler: "packages/functions/auth/auth.handler",
                link: [gcid, gcids, site],
                environment: {
                    SITE_URL,
                },
            },
        });

        const authRouter = new sst.aws.Router("AuthRouter", {
            domain: AUTH_DOMAIN,
            routes: {
                "/*": auth.url,
            },
        });

        auth.url.apply(console.log.bind(null, "AUTH URL:"));
    },
});

import { Auth, Config, StackContext, use } from "sst/constructs";
import Api from "./Api";
import Site from "./Site";

export default function AUTH({ stack }: StackContext) {
    const { api } = use(Api);
    const { site, siteUrl} = use(Site);

    const gcid = new Config.Secret(stack, "GOOGLE_CLIENT_ID");
    const gcids = new Config.Secret(stack, "GOOGLE_CLIENT_ID_SECRET");

    let SITE_URL = "http://localhost:5173"
    if (siteUrl) {
        SITE_URL = siteUrl
        if (!SITE_URL.startsWith("http")) {
            SITE_URL = "https://" + SITE_URL
        }
    }

    const auth = new Auth(stack, "auth", {
        authenticator: {
            handler: "packages/functions/auth/auth.handler",
            bind: [gcid, gcids, site],
            environment: {
                SITE_URL,
            },
        },
    });

    auth.attach(stack, { api, prefix: "/auth" });

    stack.addOutputs({
        authRoutes:
            "\n     " +
            api.routes.filter((r) => r.includes("auth")).join("\n     "),
    });
}

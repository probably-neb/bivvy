import { Auth, Config, StackContext, use } from "sst/constructs";
import Api from "./Api";
import Site from "./Site"

export default function AUTH({stack}: StackContext) {
    const {api} = use(Api)
    const {site} = use(Site)

    const gcid = new Config.Secret(stack, "GOOGLE_CLIENT_ID");
    const gcids = new Config.Secret(stack, "GOOGLE_CLIENT_ID_SECRET");

    const auth = new Auth(stack, "auth", {
        authenticator: {
            handler: "packages/functions/src/auth.handler",
            bind: [gcid, gcids, site],
            environment: {
                SITE_URL: site.url!,
            }
        },
    });

    auth.attach(stack, { api });
    stack.addOutputs({
        authRoutes: "\n     " + api.routes.join("\n     "),
    })
}

import {
    Config,
    StackContext,
    StaticSite,
    use,
} from "sst/constructs";
import Api from "./Api";

export default function SITE({ stack, app }: StackContext) {
    const { api } = use(Api);

    const site = new StaticSite(stack, "Site", {
        path: "packages/site",
        buildOutput: "dist",
        buildCommand: "pnpm run build",
        environment: {
            VITE_IS_LOCAL: String(app.local),
            VITE_API_URL: api.url,
            // FIXME: how to store this in secret instead of .env in repo?
            VITE_REPLICACHE_LICENSE_KEY: process.env.REPLICACHE_LICENSE_KEY!,
        },
    });
    stack.addOutputs({
        SiteUrl: site.url,
    });
    return {
        site,
    };
}

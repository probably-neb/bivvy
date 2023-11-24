import {StackContext, StaticSite, use } from "sst/constructs"
import {API} from "./Api"

export function Site({stack, app}: StackContext) {
    const {api} = use(API)
    const site = new StaticSite(stack, "Site", {
        path: "packages/site",
        buildCommand: "pnpm run build",
        buildOutput: "dist",
        environment: {
            VITE_API_URL: api.url,
            VITE_REGION: app.region,
            VITE_IS_LOCAL: String(app.local)
        }
    })
    stack.addOutputs({
        SiteUrl: site.url,
    })
    return {
        site
    }
}

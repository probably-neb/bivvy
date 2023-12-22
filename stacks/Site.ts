import {Config, NextjsSite, StackContext } from "sst/constructs"

export function Site({stack, app}: StackContext) {
    const DB_URL = new Config.Secret(stack, "DB_URL")
    const site = new NextjsSite(stack, "Site", {
        path: "packages/next",
        bind: [DB_URL],
        environment: {
            NEXT_PUBLIC_IS_LOCAL: String(app.local)
        }
    })
    stack.addOutputs({
        SiteUrl: site.url,
    })
    return {
        site
    }
}

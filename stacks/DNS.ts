import { StackContext } from "sst/constructs";

const MAPPING: Record<string, string> = {
    production: "bivvy.cc",
    prod: "bivvy.cc",
    development: "dev.bivvy.cc",
    dev: "dev.bivvy.cc",
}

export default function DNS({ stack, app}: StackContext) {
    const stage = app.stage
    const zone = MAPPING[stage] || "dev.bivvy.cc"
    const domain = MAPPING[stage] || `${stage}.dev.bivvy.cc`

    return {
        zone,
        domain
    }
}

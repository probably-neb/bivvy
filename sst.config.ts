import { SSTConfig } from "sst";
import { API } from "./stacks/Api";
import { Site } from "./stacks/Site";

export default {
    config(input) {
        return {
            name: "paypals",
            region: "us-west-2",
            profile:
                input.stage == "production" ? "paypals-prod" : "paypals-dev",
        };
    },
    stacks(app) {
        app.stack(API).stack(Site);
    },
} satisfies SSTConfig;

import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

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
        app.stack(API);
    },
} satisfies SSTConfig;

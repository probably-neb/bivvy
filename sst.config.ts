import { SSTConfig } from "sst";
import Api from "./stacks/Api";
import Site from "./stacks/Site";
import Auth from "./stacks/Auth";
import DNS from "./stacks/DNS";

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
        if (app.stage !== "production") {
            app.setDefaultRemovalPolicy("destroy")
        }
        app.stack(DNS).stack(Api).stack(Site).stack(Auth);
    },
} satisfies SSTConfig;

import { SSTConfig } from "sst";
import Api from "./stacks/Api";
import Site from "./stacks/Site";
import Auth from "./stacks/Auth";
import DNS from "./stacks/DNS";
import { DB } from "./stacks/DB";

export default {
    config(input) {
        return {
            name: "paypals",
            region: "us-west-2",
            profile:
                input.stage == "prod" ? "paypals-prod" : "paypals-dev",
        };
    },
    stacks(app) {
        if (app.stage !== "prod") {
            app.setDefaultRemovalPolicy("destroy")
        }
        app.stack(DB).stack(DNS).stack(Api).stack(Site).stack(Auth);
    },
} satisfies SSTConfig;

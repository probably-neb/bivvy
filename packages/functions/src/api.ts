import { ApiHandler } from "sst/node/api";
import {
    awsLambdaRequestHandler,
} from "@trpc/server/adapters/aws-lambda";

import {router, createContext} from "@paypals/core/api"

export const handler = ApiHandler(awsLambdaRequestHandler({
    router,
    createContext,
}));


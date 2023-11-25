import { StackContext, Api, EventBus, Config } from "sst/constructs";

export function API({ stack }: StackContext) {
    const bus = new EventBus(stack, "bus", {
        defaults: {
            retries: 10,
        },
    });

    const DB_URL = new Config.Secret(stack, "DB_URL")

    const api = new Api(stack, "api", {
        defaults: {
            function: {
                bind: [bus, DB_URL]
            },
        },
        cors: {
            allowOrigins: ["*"],
            allowMethods: ["ANY"],
        },
        routes: {
            "GET /": "packages/functions/src/lambda.handler",
            "GET /trpc/{proxy+}": "packages/functions/src/api.handler",
            "POST /trpc/{proxy+}": "packages/functions/src/api.handler",
            "GET /todo": "packages/functions/src/todo.list",
            "POST /todo": "packages/functions/src/todo.create",
        },
    });

    bus.subscribe("todo.created", {
        handler: "packages/functions/src/events/todo-created.handler",
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
    });
    return {api, bus}
}

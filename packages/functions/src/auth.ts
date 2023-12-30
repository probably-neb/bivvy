import { useQueryParam } from "sst/node/api"
import {AuthHandler, Session, createAdapter} from "sst/node/auth"

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      userId: string;
    };
  }
}

const localProvider = createAdapter((_config) => async () => {
    const userId = useQueryParam("userId")
    if (!userId) {
        throw new Error("Missing userId")
    }
    console.log("userId", userId)
    const token = Session.create({
        type: "user",
        properties: {
            userId
        },
    })
    return {
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            token
        })
    }
})

export const handler = AuthHandler({
    providers: {
        local: localProvider({})
    }
})

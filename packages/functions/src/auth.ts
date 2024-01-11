import { useQueryParam } from "sst/node/api"
import {AuthHandler, GoogleAdapter, Session, createAdapter} from "sst/node/auth"
import { Config } from "sst/node/config";

const NANOID_ID_LENGTH = 21

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      userId: string;
    };
  }
}

function queryParams(userId: string) {
    const token = Session.create({
        type: "user",
        properties: {
            userId: userId
            }
    })
    const searchParams = new URLSearchParams()
    searchParams.set("userId", userId)
    searchParams.set("token", token)
    Session.parameter
    return {
        statusCode: 302,
        headers: {
            location: `http://localhost:5173/login?${searchParams.toString()}`
        },
    }
}

const localProvider = createAdapter((_config) => async () => {
    const userId = useQueryParam("userId")
    if (!userId) {
        throw new Error("Missing userId")
    }
    return queryParams(userId)
})

export const handler = AuthHandler({
    providers: {
        local: localProvider({}),
        google: GoogleAdapter({
            mode: "oidc",
            clientID: Config.GOOGLE_CLIENT_ID,
            onSuccess: async (tokenset) => {
                const claims = tokenset.claims()
                const userId = normalizeSub(claims.sub)
                // TODO: upsert user (email + profile pic)
                return queryParams(userId)
            }
        })
    }
})


// converts sub from oath claims to 21 char id (matching nanoid)
// TODO: consider returning "changed" bool
function normalizeSub(sub: string) {
    if (sub.length > NANOID_ID_LENGTH) {
        return sub.slice(0, NANOID_ID_LENGTH)
    }
    return sub.padEnd(NANOID_ID_LENGTH, "0")
}

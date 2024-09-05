// import { useQueryParam } from "sst/api";
// import {Resource} from "sst"
// import {
//     AuthHandler,
//     GoogleAdapter,
//     Session,
//     createAdapter,
// } from "sst/auth";
// import {auth} from "sst/aws/auth"
// import {GoogleAdapter} from "sst/auth/adapter"

import { Resource } from "sst";
import { auth } from "sst/aws/auth";
import { GoogleAdapter } from "sst/auth/adapter";
import { session } from "./session";

const NANOID_ID_LENGTH = 21;

// declare module "sst/node/auth" {
//     export interface SessionTypes {
//         user: {
//             userId: string;
//         };
//     }
// }

export const handler = auth.authorizer({
    session,
    providers: {
        // local: createLocalAdapter(),
        google: GoogleAdapter({
            mode: "oauth",
            clientID: Resource.GOOGLE_CLIENT_ID.value,
            clientSecret: Resource.GOOGLE_CLIENT_ID_SECRET.value,
            scope: "openid profile email",
            // onSuccess: async (tokenset) => {
            //     const claims = tokenset.claims();
            //     const userId = await upsertUser(claims);
            //     return queryParams(userId);
            // },
        }),
    },
    callbacks: {
        auth: {
            async allowClient(clientId, redirect: string) {
                return true;
            },
            async success(ctx, input, req) {
                console.dir({input, ctx, req}, {depth: null})
                const claims = input.tokenset.claims();
                const userId = await upsertUser(claims);
                const res = await ctx.session({
                    type: "user",
                    properties: {
                        userId
                    }
                })
                console.dir({res}, {depth: null})
                const redirectLocation = res.headers.get("Location")
                console.log(redirectLocation)
                const redirectURL = new URL(redirectLocation!)

                const accessToken = redirectURL.hash.split('&').at(0)?.trimStart().split('access_token=').at(1)
                console.log({accessToken})
                redirectURL.searchParams.set('token', accessToken!)
                redirectURL.searchParams.set('userId', userId)
                res.headers.set('Location', redirectURL.toString())
                
                return res;
            }

        }

    }
});

// converts sub from oath claims to 21 char id (matching nanoid)
// TODO: consider returning "changed" bool
function normalizeSub(sub: string) {
    if (sub.length > NANOID_ID_LENGTH) {
        return sub.slice(0, NANOID_ID_LENGTH);
    }
    return sub.padEnd(NANOID_ID_LENGTH, "0");
}

function queryParams(userId: string) {
    const token = Session.create({
        type: "user",
        properties: {
            userId: userId,
        },
    });
    const searchParams = new URLSearchParams();
    searchParams.set("userId", userId);
    searchParams.set("token", token);
    const SITE_URL = process.env.SITE_URL;
    if (SITE_URL === undefined) {
        console.log(SITE_URL);
        throw new Error("Missing SITE_URL");
    }
    const location = `${SITE_URL}/login?${searchParams.toString()}`;
    return {
        statusCode: 302,
        headers: {
            location,
        },
    };
}

function createLocalAdapter() {
    const localAdapter = async () => {
        const userId = useQueryParam("userId");
        if (!userId) {
            throw new Error("Missing userId");
        }
        return queryParams(userId);
    };
    return createAdapter(() => localAdapter)();
}

type IdTokenClaims = ReturnType<
    Parameters<
        import("sst/node/auth/adapter/oidc").OidcBasicConfig["onSuccess"]
    >[0]["claims"]
>;

import { db, schema } from "@paypals/db";

async function upsertUser(claims: IdTokenClaims) {
    const id = normalizeSub(claims.sub);
    const email = claims.email ?? null;
    const name =
        claims.name ||
        claims.nickname ||
        claims.preferred_username ||
        claims.given_name ||
        claims.family_name ||
        claims.email ||
        "unknown";
    const profileUrl = claims.picture ?? null;

    console.dir({name, id, email, profileUrl}, {depth: null})

    await db
        .insert(schema.users)
        .values({
            id,
            name,
            profileUrl,
            email,
        })
        .onConflictDoUpdate({
            target: [schema.users.id],
            set: {
                profileUrl,
                name,
                email,
            },
        });
    return id;
}

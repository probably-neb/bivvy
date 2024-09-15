// import { useQueryParam } from "sst/node/api";
// import { useSession } from "sst/node/auth";
import {session as Session} from "auth/session";
import { APIGatewayEvent, Handler } from "aws-lambda";
import {createSigner, createVerifier, SignerOptions} from "fast-jwt"

type Invite = {
    groupId: string;
}

export const createHandler: Handler<APIGatewayEvent> = async (event, ctx) => {
    const groupId = event.queryStringParameters?.['groupId']
    // const groupId = useQueryParam("groupId");
    if (!groupId) {
        throw new Error("Missing groupId");
    }
    const session = Session.verify(event.headers.authorization)
    // FIXME: validate user has permission to invite to group
    if (session.type !== "user") {
        throw new Error("Invalid session type");
    }
    const token = create({
        properties: {
            groupId
        }
    })
    return {
        statusCode: 200,
        body: JSON.stringify({token}),
        headers: {
            "content-type": "application/json"
        }
    }
}

export const validateHandler: Handler<APIGatewayEvent> = async (event) => {
    const token = event.queryStringParameters?.['token'] // useQueryParam("token");
    if (!token) {
        return {
            statusCode: 400,
            body: JSON.stringify({ok: false, error: "No token provided"}),
            headers: {
                "content-type": "application/json"
            }
        }
    }
    const payload = verify(token);
    if (!payload.valid) {
        return {
            statusCode: 400,
            body: JSON.stringify({ok: false, error: payload.error}),
            headers: {
                "content-type": "application/json"
            }
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ok: true}),
        headers: {
            "content-type": "application/json"
        }
    }

}


function create(input: {
    properties: Invite;
    options?: Partial<SignerOptions>;
}): string {
    // FIXME: should encrypt invites?
    const signer = createSigner({
        ...input.options,
        algorithm: "none",
    });
    const token = signer(input.properties);
    return token;
}

function verify(token: string) {
    try {
        const jwt: Invite = createVerifier({
            algorithms: ["none"],
            key: ""
        })(token);
        return {
            valid: true as const,
            invite: jwt
        };
    } catch (e) {
        console.error(e)
        return {
            valid: false as const,
            error: String(e)
        }
    }
}

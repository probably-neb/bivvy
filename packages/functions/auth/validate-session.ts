// import { Response } from "sst/api";
import { session } from "./session";

export const handler = async (event, context) => {
    const token = event.headers.authorization
    const result = await session.verify(token)
    return {
        statusCode: 200,
        body: JSON.stringify({ session: result }),
        headers: {
            "content-type": "application/json",
        }
    }
}

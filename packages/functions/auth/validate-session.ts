import { ApiHandler, Response } from "sst/node/api";
import { useSession } from "sst/node/auth";

export const handler = ApiHandler(async () => {
    const session = useSession();
    return new Response({
        statusCode: 200,
        body: JSON.stringify({ session }),
        headers: {
            "content-type": "application/json",
        }
    }).result
})

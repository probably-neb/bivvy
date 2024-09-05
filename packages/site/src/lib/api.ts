import { untrack } from "solid-js";
import { useToken } from "./session";
import { ZodType, z } from "zod";

export * as Api from "./api";

const url = import.meta.env.VITE_API_URL;
const authURL = import.meta.env.VITE_AUTH_URL

export async function validateSessionToken(token: string) {
    console.log("validateSessionToken", token);
    const response = await fetch("/session", {
        headers: {
            authorization: `Bearer ${token}`
        },
        validator: z.object({
            session: z.discriminatedUnion("type", [
                z.object({type: z.literal("user"), properties: z.object({userId: z.string()})}),
                z.object({type: z.literal("public"), properties: z.object({})})
            ])
        }),
    });
    return response;
}

// FIXME: create ExpireAt field in token and use backend to check expiration
export async function validateInviteToken(token: string) {
    const response = await fetch("/invite/validate", {
        params: { token: token },
        // FIXME: validate
        validator: z.object({
            ok: z.boolean(),
        }),
    });
    return response;
}

const zProviders = z.record(z.string().url());

export async function getAuthProviders() {
    const res = await fetch("/auth/", {
        validator: zProviders,
    });
    return res;
}

export function authUrl(provider: string) {
    return `${authURL}/${provider}/authorize`;
}

export async function scanReceipt(file: File) {
    const res = await fetch("/scan/receipt", {
        method: "POST",
        body: file,
    });
    return res;
}

export async function scanSpreadsheet(file: File) {
    const res = await fetch("/scan/spreadsheet", {
        method: "POST",
        body: file,
        headers: {
            "content-type": file.type,
        },
    });
    return res;
}

type QueryParams = ConstructorParameters<typeof URLSearchParams>[0];

type FetchOpts<T> = RequestInit & {
    params?: QueryParams;
    validator?: ZodType<T>;
};

const raiseForStatus = (response: Response) => {
    if (!response.ok) {
        console.error(response.statusText);
        throw new Error(response.statusText);
    }
    return response;
};

async function fetch<T = any>(path: string, init?: FetchOpts<T>): Promise<T> {
    if (!path.startsWith("/")) {
        path = `/${path}`;
    }
    if (!url || url.length === 0) {
        throw new Error("Missing API URL");
    }
    if (!path.startsWith(url)) {
        path = `${url}${path}`;
    }
    if (init?.params) {
        const params = new URLSearchParams(init.params);
        path = `${path}?${params.toString()}`;
    }
    const token = untrack(() => useToken()());
    if (token) {
        if (!init) {
            init = {};
        }
        init.headers = Object.assign(
            {
                authorization: `Bearer ${token}`,
            },
            init.headers
        );
    }
    const res = await window.fetch(path, init);
    raiseForStatus(res);
    const json = await res.json();
    console.log("fetch", path, json);
    if (init?.validator) {
        return init.validator.parse(json);
    }
    return json;
}

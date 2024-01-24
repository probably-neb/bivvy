import { untrack } from "solid-js";
import { Group } from "./rep";
import { useToken } from "./session";
import { ZodType, z } from "zod";

export * as Api from "./api";

const url = import.meta.env.VITE_API_URL;

type QueryParams = ConstructorParameters<typeof URLSearchParams>[0];

type FetchOpts<T> = RequestInit & {
    params?: QueryParams;
    validator?: ZodType<T>;
};

const raiseForStatus = (response: Response) => {
    if (!response.ok) {
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
            init.headers,
        );
    }
    const res = await window.fetch(path, init);
    raiseForStatus(res);
    const json = await res.json();
    if (init?.validator) {
        return init.validator.parse(json);
    }
    return json;
}

export async function getInviteKey(groupId: Group["id"]) {
    if (!groupId) {
        throw new Error("Missing groupId");
    }
    const response = await fetch("/invite", {
        validator: z.object({
            token: z.string(),
        }),
        params: {
            groupId,
        },
    });
    return response.token;
}

export async function validateInviteKey(key: string) {
    const response = await fetch("/invite/validate", {
        params: { token: key },
        // FIXME: validate
        validator: z.object({}),
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
    return `${url}/auth/${provider}/authorize`;
}

export async function scanReceipt(file: File) {
    const res = await fetch("/scan/receipt", {
        method: "POST",
        body: file
    })
    return res
}

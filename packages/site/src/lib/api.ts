import { untrack } from "solid-js";
import { Group } from "./rep";
import { useToken } from "./session";
import { intoMap } from "./utils";
import { z } from "zod";

export * as Api from "./api";

const url = import.meta.env.VITE_API_URL;

export async function getInviteKey(groupId: Group["id"]) {
    if (!groupId) {
        throw new Error("Missing groupId");
    }
    const query = new URLSearchParams();
    query.set("groupId", groupId);
    const authToken = untrack(() => useToken()())
    if (!authToken) {
        throw new Error("Missing auth token");
    }
    // TODO: raise for status
    const response = await fetch(`${url}/invite?groupId=${groupId}`, {
        headers: {
            authorization: `Bearer ${authToken}`,
        }
    }).then(r => r.json());
    // TODO: validate
    return response.token as string
}

export async function validateInviteKey(key: string) {
    const response = await fetch(`${url}/invite/validate?token=${key}`).then(r => r.json());
    return response;
}


const zProviders = z.record(z.string().url())

export async function getAuthProviders() {
    const res = await fetch(`${url}/auth/`)
    const providers = await res.json();
    return zProviders.parse(providers);
}

export function authUrl(provider: string) {
    return `${url}/auth/${provider}/authorize`;
}

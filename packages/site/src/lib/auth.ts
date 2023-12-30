import { createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

export const USERS = [
    {
        id: "Alice_fjIqVhRO63mS0mu",
        name: "Alice",
    },
    {
        id: "Bob_oTfjIqVhRO63mS0mv",
        name: "Bob",
    },
    {
        id: "Charlie_123456789ABCD",
        name: "Charlie",
    },
    {
        id: "David_123456789ABCDEF",
        name: "David",
    },
];

const DEV_GROUP = "______dev_group______"

export type User = (typeof USERS)[number];

export type Session = {
    valid: boolean;
    token: string | null;
    userId: string | null;
    // TODO: make this a url param / component var not session var
    currentGroupId: string | null;
}

const [session, setSession] = createStore<Session>({
    valid: false,
    token: null,
    userId: null,
    currentGroupId: null,
});

export const hasSession = createMemo(() => {
    console.log("hasSession", session.valid)
    return session.valid
});

export function initSession(userId: string, token: string) {
    const up = {
        valid: true,
        token,
        userId
    }
    console.log("initSession", up)
    setSession(up)
}

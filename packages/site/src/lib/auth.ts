import { createSignal } from "solid-js";
import { z } from "zod";

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


export type User = (typeof USERS)[number];

export type Session = {
    valid: true;
    token: string;
    userId: string;
    // TODO: make this a url param / component var not session var
} | {
    valid: false,
    token?: undefined,
    userId?: undefined,
};

const [session, setSession] = createSignal<Session>({valid: false as const});
export {session}

// TODO: on load check for token cookie in browser, make request to serer to validate and 
// get user id, then init session
//
export const initSessionSchema = z.object({
    userId: z.string(),
    token: z.string(),
})

export type InitSession = z.infer<typeof initSessionSchema>

export function initSession(init: InitSession) {
    const up: Session = Object.assign({}, init, {
        valid: true as const,
    })
    console.log("initSession", up)
    setSession(up)
}

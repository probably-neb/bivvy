import { useNavigate } from "@solidjs/router";
import { ParentProps, createContext, createRenderEffect, createSignal, on, splitProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";
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


// TODO: on load check for token cookie in browser, make request to serer to validate and 
// get user id, then init session
//
export const initSessionSchema = z.object({
    userId: z.string(),
    token: z.string(),
})

export type InitSession = z.infer<typeof initSessionSchema>

type Functions = {
    isValid: () => boolean,
    initSession: (i: InitSession) => void,
    vars: () => Pick<Session, "token" | "userId"> | undefined,
}

const defaultFns: Functions = {
    isValid: () => false,
    initSession: (_: InitSession) => {},
    vars: () => undefined,
}

type Ctx = [Session, Functions]

const SessionContext = createContext<Ctx>([{valid: false}, defaultFns])

export function SessionContextProvider(props: ParentProps) {
    const [session, setSession] = createStore<Session>({valid: false});
    console.log("initial session", session)
    const fns = {
        initSession: (init: InitSession) => {
            const up: Session = Object.assign({}, init, {
                valid: true as const,
            })
            console.log("initSession", up)
            setSession(up)
        },
        isValid: () => session.valid,
        vars: () => {
            const [vars] = splitProps(session, ["token", "userId"]);
            if (session.valid) {
                return vars;
            }
            return undefined;
        }
    }
    return (<SessionContext.Provider value={[session, fns]}>
        {props.children}
    </SessionContext.Provider>)
}

export function useSession() {
    return useContext(SessionContext);
}

export function EnsureLogin(props: ParentProps) {
    const [, session] = useSession()
    const navigate = useNavigate()
    createRenderEffect(on(session.isValid, (valid) => {
        if (!valid) {
            console.log("not logged in")
            navigate("/login")
        }
    }))
    return props.children
}

export function useSessionVars() {
    const [_, fns] = useSession();
    return fns.vars;
}

export function useUserId() {
    const [session] = useSession();
    return () => session.userId;
}

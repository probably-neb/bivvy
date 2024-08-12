import { useNavigate } from "@solidjs/router";
import { ParentProps, Show, batch, createContext, createMemo, createRenderEffect, createResource, on, splitProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { z } from "zod";
import { isDev } from "./utils";
import { Api } from "./api";
import { routes } from "@/routes";
import { closeRep } from "./rep";

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
    validating: boolean;
    // TODO: make this a url param / component var not session var
} | {
    valid: false,
    token?: undefined,
    userId?: undefined,
    validating: boolean;
};


// TODO: on load check for token cookie in browser, make request to serer to validate and 
// get user id, then init session
//
export const initSessionSchema = z.object({
    userId: z.string(),
    token: z.string(),
})

export type InitSession = z.infer<typeof initSessionSchema>

type SessionFunctions = {
    isValid: () => boolean,
    initSession: (i: InitSession) => void,
    vars: () => Pick<Session, "token" | "userId"> | undefined,
    isValidating: () => boolean,
    logout: () => Promise<void>,
}

const defaultFns: SessionFunctions = {
    isValid: () => false,
    initSession: (_: InitSession) => {},
    vars: () => undefined,
    isValidating: () => false,
    logout: async () => {},
}

type Ctx = [Session, SessionFunctions]

const SessionContext = createContext<Ctx>([{valid: false, validating: false}, defaultFns])

export function SessionContextProvider(props: ParentProps) {
    const [session, setSession] = createStore<Session>({valid: false, validating: false});
    console.log("initial session", session)
    const storedToken = getStoredAuthToken()
    const [storedValid] = createResource(() => session.valid ? null : storedToken, Api.validateSessionToken)
    createRenderEffect(() => {
        console.log("begining to validate", session)
        const state = storedValid.state
        if (state === "pending") {
            setSession("validating", true)
            console.log("pending", session)
            return
        }
        if (state !== "ready") {
            // FIXME: how to handle other states?
            setSession("validating", false)
            console.log("not ready", {state})
            return
        }
        const sesh = storedValid().session
        if (storedToken == null) {
            console.error("validated but no token??", {session: {...session}, response: {...sesh}, storedToken})
            return
        }
        if (sesh.type !== "user") {
            console.error("invalid session type")
            // FIXME: how to handle this?
            return
        }
        const up = {
            valid: true as const,
            token: storedToken,
            userId: sesh.properties.userId,
            validating: false,
        }
        console.log("validated", up)
        setSession(up)
    })
    const fns = {
        initSession(init: InitSession) {
            const up: Session = Object.assign({}, init, {
                valid: true as const,
                validating: false
            })
            console.log("initSession", up)
            setSession(up)
        },
        isValid() {
            if (!session.valid) {
                if (session.validating) {
                    return false
                }
                let init = loadInitFromParams()
                if (!init) {
                    return false
                }
                fns.initSession(init)
            }
            return session.valid
        },
        isValidating() {
            return session.validating
        },
        async logout() {
            removeAuthToken()
            await closeRep()
            setSession({valid: false, validating: false})
            // NOTE: expecting that the RequireLogin component will handle the session being reset
        },
        vars() {
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

function loadInitFromParams() {
    const qparams = new URLSearchParams(window.location.search);
    const userId = qparams.get("userId");
    if (!userId) {
        console.log("no userId param")
        return null;
    }
    const token = qparams.get("token");
    if (!token) {
        console.log("no token")
        return null;
    }
    storeAuthToken(token)
    return {userId, token}
}

const AUTH_TOKEN_KEY = "auth-token"

function getStoredAuthToken() {
    if (isDev()) {
        return sessionStorage.getItem(AUTH_TOKEN_KEY)
    }
    return localStorage.getItem(AUTH_TOKEN_KEY)
}
function storeAuthToken(token: string) {
    if (isDev()) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token)
        return
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token)
}
function removeAuthToken() {
    if (isDev()) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY)
        return
    }
    localStorage.removeItem(AUTH_TOKEN_KEY)
}


export function useSession() {
    return useContext(SessionContext);
}

export function EnsureLogin(props: ParentProps) {
    const [, session] = useSession()
    const navigate = useNavigate()
    createRenderEffect(on([session.isValid, session.isValidating], ([valid, validating]) => {
        if (validating) {
            return
        }
        if (!valid) {
            console.log("not logged in")
            navigate("/login")
        }
    }))
    // FIXME: include spinner
    return <Show when={!session.isValidating()}>
        {props.children}
    </Show>
}

export function useSessionVars() {
    const [_, fns] = useSession();
    return fns.vars;
}

export function useUserId() {
    const [session] = useSession();
    return createMemo(() => session.userId)
}

export function useToken() {
    const [session] = useSession();
    return createMemo(() => session.token);
}

/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";

import { ParentProps, lazy } from "solid-js";
import { Route, Router } from "@solidjs/router";
import Layout from "./lib/layout";
import { SessionContextProvider } from "@/lib/session";
import { ReplicacheContextProvider } from "@/lib/rep";
import { DeviceContextProvider } from "@/lib/device";

const Home = lazy(async () => await import("@/home/home"));
const Login = lazy(async () => await import("@/login/login"));
const RequireAuth = lazy(async () => await import("@/components/require-auth"));

export const routes = {
    auth: "/login",
    groups: "/groups",
    group(id: string) {
        return `/groups/${id}`;
    },
};

function ToAuth() {
    return (
        <div>
            <button>
                <a href={routes.auth}>Login</a>
            </button>
        </div>
    );
}

function Providers(props: ParentProps) {
    return (
        <DeviceContextProvider>
            <SessionContextProvider>
                <ReplicacheContextProvider>
                    {props.children}
                </ReplicacheContextProvider>
            </SessionContextProvider>
        </DeviceContextProvider>
    );
}

function Root(props: ParentProps) {
    return (
        <Providers>
            <Layout>{props.children}</Layout>
        </Providers>
    );
}

export function App() {
    console.log("App");
    return (
        <Router root={Root}>
            <Route path="/" component={ToAuth} />
            <Route
                path={routes.group(":id")}
                component={() => <RequireAuth page={Home} />}
            />
            <Route path={routes.auth} component={Login} />
        </Router>
    );
}
const root = document.getElementById("root");

render(() => <App />, root!);

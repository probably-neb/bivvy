/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";

import { routes } from "@/routes";
import { ParentProps, lazy } from "solid-js";
import { Route, Router } from "@solidjs/router";
import Layout from "./lib/layout";
import { SessionContextProvider, EnsureLogin } from "@/lib/session";
import { ReplicacheContextProvider } from "@/lib/rep";
import { DeviceContextProvider } from "@/lib/device";

const Groups = lazy(() => import("@/groups/groups"));
const Group = lazy(() => import("@/group/group"));
const Login = lazy(() => import("@/login/login"));

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
            <Route path={routes.groups} component={EnsureLogin}>
                <Route path="/" component={Groups} />
                <Route path=":id" component={Group} />
            </Route>
            <Route path={routes.auth} component={Login} />
        </Router>
    );
}

const root = document.getElementById("root");

render(() => <App />, root!);

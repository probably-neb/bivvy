/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";

import { routes } from "@/routes";
import { ParentProps, lazy } from "solid-js";
import { Route, Router, Navigate } from "@solidjs/router";
import Layout from "@/layout/layout";
import { SessionContextProvider, EnsureLogin } from "@/lib/session";
import { ReplicacheContextProvider } from "@/lib/rep";
import { DeviceContextProvider } from "@/lib/device";

const Groups = lazy(() => import("@/groups/groups"));
const Group = lazy(() => import("@/group/group"));
const Login = lazy(() => import("@/login/login"));
const Invite = lazy(() => import("@/login/invite"));
const Scan = lazy(() => import("@/scan/scan"));

function ToAuth() {
    return (
        <div>
            <Navigate href={routes.groups} />
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
    return (
        <Router root={Root}>
            {/* TODO: add home page */ }
            <Route path="/" component={ToAuth} />
            <Route path={routes.groups} component={EnsureLogin}>
                <Route path="/" component={Groups} />
                <Route path=":id" component={Group} />
                <Route path=":id/scan" component={Scan} />
            </Route>
            <Route path={routes.auth} component={Login} />
            <Route path="/invite" component={Invite} />
        </Router>
    );
}

const root = document.getElementById("root");

render(() => <App />, root!);

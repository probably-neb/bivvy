import { JSX, Show, lazy } from "solid-js";
import { forcePush } from "@/lib/rep";
import { hasSession } from "@/lib/auth";
import {Route, Navigate, Router} from "@solidjs/router"
import Layout from "./lib/layout";

const Home = lazy(async () => await import("@/home/home"))
const Login = lazy(async () => await import("@/login/login"))

const routes = {
    auth: "/login"
}

function RequireAuth({page}: {page: () => JSX.Element}) {
    console.log("RequireAuth")
    return <Show when={hasSession()} fallback={<Navigate href={routes.auth} />}>
        {page()}
    </Show>;
}

function ToAuth() {
    return <Layout>
        <div>
            <button>
                <a href={routes.auth}>Login</a>
            </button>
        </div>
    </Layout>
}

export function App() {
    console.log("App")
    return (
        <div>
            <Router>
                <Route path="/" component={ToAuth} />
                <Route path={routes.auth} component={Login} />
            </Router>
        </div>
    )
}

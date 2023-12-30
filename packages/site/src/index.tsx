/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'

import { lazy } from "solid-js";
import {Route, Router} from "@solidjs/router"
import Layout from "./lib/layout";

const Home = lazy(async () => await import("@/home/home"))
const Login = lazy(async () => await import("@/login/login"))
const RequireAuth = lazy(async () => await import("@/components/require-auth"))

const routes = {
    auth: "/login"
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
                <Route path="/group/:id" component={() => <RequireAuth page={Home} />} />
                <Route path={routes.auth} component={Login} />
            </Router>
        </div>
    )
}
const root = document.getElementById('root')

render(() => <App />, root!)

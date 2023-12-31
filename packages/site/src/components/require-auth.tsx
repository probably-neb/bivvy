import { session } from "@/lib/auth";
import { Navigate } from "@solidjs/router";
import { JSX } from "solid-js";
import { Show } from "solid-js/web";

export default function RequireAuth(props: { page: () => JSX.Element }) {
    console.log("RequireAuth")
    return <Show when={session().valid} fallback={<Navigate href={"/login"} />}>
        {props.page()}
    </Show>;
}

import { useSession } from "@/lib/session";
import { Navigate } from "@solidjs/router";
import { JSX } from "solid-js";
import { Show } from "solid-js/web";

export default function RequireAuth(props: { page: () => JSX.Element }) {
    const [_, { isValid }] = useSession();
    return <Show when={isValid()} fallback={<Navigate href={"/login"} />}>
        {props.page()}
    </Show>;
}

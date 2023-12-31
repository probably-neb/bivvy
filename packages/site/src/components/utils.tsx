import { Show, JSX } from "solid-js";

export function Try<T>(props: {
    value: T | undefined;
    children: (t: T) => JSX.Element;
}) {
    return <Show when={props.value !== undefined}>{props.children(props.value!)}</Show>;
}

import { Show, JSX } from "solid-js";

export function Try<T>({
    value,
    children,
}: {
    value: T | undefined;
    children: (t: T) => JSX.Element;
}) {
    return <Show when={value !== undefined}>{children(value!)}</Show>;
}

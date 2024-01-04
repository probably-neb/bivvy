import { User } from "@/lib/session";
import { Split, useSplit, useUser } from "@/lib/rep";
import { TiUserOutline } from "solid-icons/ti";
import { JSX, Show, createEffect, createMemo } from "solid-js";
import { Badge } from "./ui/badge";

export function UserRenderer(props: { userId: User["id"] }) {
    const user = useUser(props.userId);

    return (
        <div class="flex gap-2 items-center">
            <TiUserOutline />
            <h3>{user()?.name}</h3>
        </div>
    );
}

type Format = "m/d/y" | "m/y";

type DateProps = {
    format?: Format;
} & (
    | {
          date: Date;
      }
    | {
          dateStr: string;
      }
);

export function DateRenderer(props: DateProps) {
    const format = createMemo(() => {
        const date = "date" in props ? props.date : new Date(props.dateStr);
        const format = props.format ?? "m/d/y";
        switch (format) {
        case "m/d/y":
            return `${date.getMonth() + 1}/${date.getDate()}/${
                date.getFullYear() - 2000
            }`;
        case "m/y":
            return `${date.getMonth() + 1}/${date.getFullYear() - 2000}`;
        }
    })
    return <span>{format()}</span>;
}

export function MoneyRenderer(props: {
    amount: number;
    showPlus?: boolean;
}) {
    const sign = createMemo(() => props.amount < 0 ? "-" : props.showPlus ? "+" : "");
    const amount = createMemo(() => {
        // show amount in dollars instead of cents
        // also convert to float if it ins't already
        const a = Math.abs(props.amount) / 100.0;
        // don't show that many decimal places because who cares
        return a.toFixed(2)
    })
    return (
        <span>
            {sign()}${amount()}
        </span>
    );
}

export function SplitRenderer(props: {splitId: Split["id"]}) {
    const split = useSplit(props.splitId)
    createEffect(() => {
        console.log("split", split())
    })
    return <Show when={split()}>
        <Badge style={`background-color: ${split()?.color}`}>{split()?.name}</Badge>
    </Show>
}

export function Render<T, K extends string, V extends Record<K, T>>(props: {
    value: T | undefined;
    c: (props: V) => JSX.Element;
    key: K;
}) {
    console.log("render", props.key, props.value);
    return <Show when={props.value}>
        <props.c {...{ [props.key]: props.value! } as V} />
    </Show>;
}

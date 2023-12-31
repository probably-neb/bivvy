import { User } from "@/lib/auth";
import { useUser } from "@/lib/rep";
import { TiUserOutline } from "solid-icons/ti";
import { JSX, Show, createMemo } from "solid-js";

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
    return (
        <span>
            {sign()}${(Math.abs(props.amount) * 1.0).toFixed(2)}
        </span>
    );
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

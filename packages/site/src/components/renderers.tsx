import { User } from "@/lib/auth";
import { useUser } from "@/lib/rep";
import { TiUserOutline } from "solid-icons/ti";
import { JSX, Show } from "solid-js";

export function UserRenderer({ userId }: { userId: User["id"] }) {
    const user = useUser(userId);

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
    const date = "date" in props ? props.date : new Date(props.dateStr);
    let format: string;
    props.format ??= "m/d/y";
    switch (props.format) {
        case "m/d/y":
            format = `${date.getMonth() + 1}/${date.getDate()}/${
                date.getFullYear() - 2000
            }`;
            break;
        case "m/y":
            format = `${date.getMonth() + 1}/${date.getFullYear() - 2000}`;
            break;
    }
    return <span>{format}</span>;
}

export function MoneyRenderer({
    amount,
    showPlus,
}: {
    amount: number;
    showPlus?: boolean;
}) {
    const sign = amount < 0 ? "-" : showPlus ? "+" : "";
    return (
        <span>
            {sign}${(Math.abs(amount) * 1.0).toFixed(2)}
        </span>
    );
}

export function Render<T, K extends string, V extends Record<K, T>>({
    value,
    c,
    key,
}: {
    value: T | undefined;
    c: (props: V) => JSX.Element;
    key: K;
}) {
    const Component = c;
    return <Show when={value}>
        <Component {...{ [key]: value! } as V} />
    </Show>;
}

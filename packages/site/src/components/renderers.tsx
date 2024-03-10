import { User } from "@/lib/session";
import { Group, Split, useSplit, useUser } from "@/lib/rep";
import { TiUserOutline } from "solid-icons/ti";
import { Accessor, JSX, Show, createMemo } from "solid-js";
import { Badge } from "./ui/badge";

// TODO: make renderers take a value instead of an id,
// no need to make them use rep queries when they probably don't need to
export function UserRenderer(props: { userId: User["id"], groupId?: Accessor<Group["id"]> }) {
    const user = useUser(() => props.userId, props.groupId);

    return (
        <div class="flex gap-1 items-center">
            <TiUserOutline size="1em" />
            <h3>{user()?.name}</h3>
        </div>
    );
}

type Format = "m/d/y" | "m/y";

type IntoDate = ConstructorParameters<typeof Date>[0]

type DateProps = {
    format?: Format;
    date: IntoDate;
};

function getLocalDateFromUTC(d: IntoDate) {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    const dateUnixMs = new Date(d).getTime();
    const date = new Date(dateUnixMs + tzOffsetMs);
    return date;
}

export function DateRenderer(props: DateProps) {
    const format = createMemo(() => {
        const date = getLocalDateFromUTC(props.date);
        const format = props.format ?? "m/d/y";

        // month is 0 indexed
        const month = date.getMonth() + 1
        const day = date.getDate()
        let year = date.getFullYear()
        if (year > 2000) {
            // shorten years after 2000 to 2 digits
            year -= 2000
        }
        switch (format) {
        case "m/d/y":
            return `${month}/${day}/${year}`;
        case "m/y":
            return `${month}/${year}`;
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

export function SplitRenderer(props: {splitId: Split["id"], class?: string}) {
    const split = useSplit(() => props.splitId)
    return <Show when={split()}>
        <Badge class={props.class} style={`background-color: ${split()?.color}`}>{split()?.name}</Badge>
    </Show>
}

export function Render<T, K extends string, V extends Record<K, T>>(props: {
    value: T | undefined;
    c: (props: V) => JSX.Element;
    key: K;
}) {
    return <Show when={props.value}>
        <props.c {...{ [props.key]: props.value! } as V} />
    </Show>;
}

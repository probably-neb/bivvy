import { Group, Split, User, useSplit, useUser } from "@/lib/rep";
import { TiUserOutline } from "solid-icons/ti";
import { For, Accessor, JSX, Show, createMemo } from "solid-js";
import { Badge } from "./ui/badge";
import { ImageRoot, Image, ImageFallback } from "./ui/image";
import { assert } from "@/lib/utils";
import { usePossibleColors } from "@/lib/patterns";

// TODO: make renderers take a value instead of an id,
// no need to make them use rep queries when they probably don't need to
export function UserRenderer(props: {
    userId: User["id"];
    groupId?: Accessor<Group["id"]>;
}) {
    const user = useUser(() => props.userId, props.groupId);

    return (
        <div class="flex gap-2 items-center">
            <UserProfileRenderer
                userID={props.userId}
                groupID={props.groupId}
            />
            <h3>{user()?.name}</h3>
        </div>
    );
}

function getInitials(name: string) {
    assert(name !== "", "Cannot get user initials: Name empty");
    const parts = name.split(" ");
    const first = parts.at(0)!;
    assert(first !== "", "Cannot get user initials: First name empty");
    const firstInitial = first[0].toUpperCase();
    const last = parts.at(-1);
    let lastInitial = "";
    if (last !== "" && last != null && last !== first) {
        lastInitial = last[0].toUpperCase();
    }
    return firstInitial + lastInitial;
}

function getColorForUser(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const code = name.charCodeAt(i);
        if (isNaN(code)) {
            // lets be honest. this is dumb
            continue;
        }
        // copilot generated hash function ferda!
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = usePossibleColors();
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

function UserInitialsProfile(props: { name?: string }) {
    return (
        <Show
            when={props.name}
            fallback={
                <TiUserOutline
                    color="black"
                    size="1.5em"
                    class="bg-white rounded-full"
                />
            }
            keyed
        >
            {(name) => {
                const initials = getInitials(name);
                const isTwoLetters = initials.length !== 1;
                const color = getColorForUser(name);
                return (
                    <div
                        style={{ background: color }}
                        class="rounded-full w-[1.5em] h-[1.5em] text-white inline-flex items-center justify-center select-none"
                    >
                        <span class={isTwoLetters ? "text-xs" : ""}>
                            {initials}
                        </span>
                    </div>
                );
            }}
        </Show>
    );
}

export function UserProfileRenderer(props: {
    userID: User["id"];
    groupID?: Accessor<Group["id"]>;
}) {
    const user = useUser(() => props.userID, props.groupID);
    const Fallback = () => <UserInitialsProfile name={user()?.name} />;
    return (
        <Show when={user()?.profileUrl} fallback={<Fallback />}>
            {(url) => (
                <ImageRoot class="rounded-full w-[1.5em] h-[1.5em]">
                    <Image src={url()} alt={user()?.name ?? "profile"} />
                    <ImageFallback>
                        <Fallback />
                    </ImageFallback>
                </ImageRoot>
            )}
        </Show>
    );
}

type Format = "m/d/y" | "m/y";

type IntoDate = ConstructorParameters<typeof Date>[0];

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
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let year = date.getFullYear();
        if (year > 2000) {
            // shorten years after 2000 to 2 digits
            year -= 2000;
        }
        switch (format) {
            case "m/d/y":
                return `${month}/${day}/${year}`;
            case "m/y":
                return `${month}/${year}`;
        }
    });
    return <span>{format()}</span>;
}

export function MoneyRenderer(props: { amount: number; showPlus?: boolean }) {
    const sign = createMemo(() =>
        props.amount < 0 ? "-" : props.showPlus ? "+" : ""
    );
    const amount = createMemo(() => {
        // show amount in dollars instead of cents
        // also convert to float if it ins't already
        const a = Math.abs(props.amount) / 100.0;
        // don't show that many decimal places because who cares
        return a.toFixed(2);
    });
    return (
        <span>
            {sign()}${amount()}
        </span>
    );
}

export function SplitRenderer(props: { splitId: Split["id"]; class?: string }) {
    const split = useSplit(() => props.splitId);
    return (
        <Show when={split()} keyed>
            {(split) => (
                <Show
                    when={!split.isOneOff}
                    fallback={<OneOffSplitUsers split={split} />}
                >
                    <SplitBadge split={split} class={props.class} />
                </Show>
            )}
        </Show>
    );
}

function OneOffSplitUsers(props: { split: Split }) {
    // TODO: create useSortedUserIDs hook that takes list of userIDs and sorts them by the users name
    const userIDs = createMemo(() => {
        const ids = Object.keys(props.split.portions);
        console.log({ ids });
        return ids;
    });
    return (
        <div class="inline-flex gap-1">
            <Show
                when={userIDs().length !== 1}
                fallback={<UserRenderer userId={userIDs()[0]} />}
            >
                <For each={userIDs()}>
                    {(id) => <UserProfileRenderer userID={id} />}
                </For>
            </Show>
        </div>
    );
}

function SplitBadge(props: { split: Split; class?: string }) {
    return (
        <Badge
            class={props.class}
            style={`background-color: ${props.split.color}`}
        >
            {props.split.name}
        </Badge>
    );
}

export function Render<T, K extends string, V extends Record<K, T>>(props: {
    value: T | undefined;
    c: (props: V) => JSX.Element;
    key: K;
}) {
    return (
        <Show when={props.value}>
            <props.c {...({ [props.key]: props.value! } as V)} />
        </Show>
    );
}

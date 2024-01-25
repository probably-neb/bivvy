import { USERS, User, useSession } from "@/lib/session";
import {
    For,
    JSX,
    Show,
    createMemo,
    createRenderEffect,
    on,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { routes } from "@/routes";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Api, authUrl } from "@/lib/api";
import { CollectionNode } from "@kobalte/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiOutlineGoogle } from "solid-icons/ai";

type SelectItemProps<T> = { item: CollectionNode<T> };

const AVAILABLE_PROVIDERS = ["google"] as const;
type Provider = (typeof AVAILABLE_PROVIDERS)[number];

const DEFAULT_PROVIDERS: Provider[] = ["google"];

const PROVIDERS = Object.fromEntries(
    DEFAULT_PROVIDERS.map((p) => [p, Api.authUrl(p)]),
);

export default function () {
    console.log("Login");
    const [_, { isValid }] = useSession();

    const navigate = useNavigate();
    createRenderEffect(
        on(isValid, (valid) => {
            if (!valid) {
                return
            }
            console.log("has session");
            navigate(routes.groups);
        }),
    );
    return (
        <div class="flex justify-center items-center px-4 pt-4">
            <LoginCard providers={PROVIDERS} />
        </div>
    );
}

function LoginCard(props: { providers: Record<string, string> }) {
    return (
        <Card class="min-w-fit md:w-1/3">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                {/* TODO: email login */ }
                <Show when={import.meta.env.VITE_IS_LOCAL}>
                    <GroupMembers />
                </Show>
                <div class="px-2 py-4 text-center text-sm text-muted-foreground">Or Continue With</div>
                <Providers providers={props.providers} />
            </CardContent>
        </Card>
    );
}

function Providers(props: { providers: Record<string, string> }) {
    return (
        <div class="flex flex-col gap-2">
            <For each={Object.entries(props.providers)}>
                {([provider, url]) => (
                    <Provider provider={provider as Provider} url={url} />
                )}
            </For>
        </div>
    );
}

const ICONS: Record<Provider, () => JSX.Element> = {
    google: () => <AiOutlineGoogle />,
};

const TITLES: Record<Provider, string> = {
    google: "Google",
};

function Provider(props: { provider: Provider; url: string }) {
    const icon = createMemo(() => ICONS[props.provider]());
    return (
        <a href={props.url} rel="noreferrer">
            <Button class="flex gap-2 w-full">
                {icon()} {TITLES[props.provider]}
            </Button>
        </a>
    );
}

function GroupMembers() {
    const navigate = useNavigate();

    const url = (userId: User["id"]) => `${authUrl("local")}?userId=${userId}`;

    const onChange = async (user: User) => {
        // TODO: handle
        if (!user) return;
        navigate(
            url(user.id)
        );
    };

    function itemComponent(itemProps: SelectItemProps<User>) {
        const { item } = itemProps;
        const user = item.rawValue;
        return (
            <SelectItem item={item}>
                <a href={url(user.id)}>
                    <Button>{user.name}</Button>
                </a>
            </SelectItem>
        );
    }

    return (
        <Select<User>
            options={USERS}
            onChange={onChange}
            placeholder="Member"
            itemComponent={itemComponent}
        >
            <SelectTrigger class="bg-white">User</SelectTrigger>
            <SelectContent />
        </Select>
    );
}

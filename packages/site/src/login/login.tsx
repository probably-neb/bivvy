import { USERS, User, useSession } from "@/lib/session";
import {
    For,
    JSX,
    Show,
    createMemo,
    createRenderEffect,
    on,
    onMount,
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
import { isDev } from "@/lib/utils";

type SelectItemProps<T> = { item: CollectionNode<T> };

export default function () {
    console.log("Login");
    const [_, { isValid }] = useSession();

    const navigate = useNavigate();
    createRenderEffect(
        on(isValid, (valid) => {
            // TODO: show loading spinner when validating
            if (!valid) {
                return;
            }
            console.log("has session");
            navigate(routes.groups);
        })
    );
    return (
        <div class="flex justify-center items-center px-4 pt-4">
            <LoginCard />
        </div>
    );
}

function LoginCard() {
    const params = new URLSearchParams({
        client_id: "local",
        redirect_uri: location.toString(),
        response_type: "token",
        provider: "google",
    });
    const googleUrl = `${
        import.meta.env.VITE_AUTH_URL
    }/google/authorize?${params.toString()}`;
    return (
        <Card class="min-w-fit md:w-1/3">
            <CardHeader>
                <CardTitle>LOGIN</CardTitle>
            </CardHeader>
            <CardContent>
                {/* TODO: email login */}
                <Show when={isDev()}>
                    <GroupMembers />
                </Show>
                <div class="px-2 py-4 text-center text-sm text-muted-foreground">
                    CONTINUE WITH
                </div>

                <a href={googleUrl} rel="noreferrer">
                    <Button class="flex gap-2 w-full">
                        <AiOutlineGoogle /> GOOGLE
                    </Button>
                </a>
            </CardContent>
        </Card>
    );
}

function GroupMembers() {
    const navigate = useNavigate();

    const url = (userId: User["id"]) => `${authUrl("local")}?userId=${userId}`;

    const onChange = async (user: User) => {
        // TODO: handle
        if (!user) return;
        navigate(url(user.id));
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

import { createFilter } from "@kobalte/core";
import type { ComboboxTriggerMode } from "@/components/ui/combobox";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import { USERS, User, initSessionSchema, useSession } from "@/lib/session";
import Layout from "@/lib/layout";
import {
    Match,
    Switch,
    createEffect,
    createMemo,
    createRenderEffect,
    createResource,
    createSignal,
    on,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { routes } from "@/routes";
import { Button } from "@/components/ui/button";
import { Show } from "solid-js";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";

type name = string;
type url = string;
type Providers = Record<name, url>;

// FIXME: hit `GET /auth` endpoint to get possible signin methods
// obv could just hard code them but this allows for having backend control what options there are
// (specifically whether local version shows)
export default function () {
    console.log("Login");
    const [_, { isValid }] = useSession();

    const navigate = useNavigate();
    createRenderEffect(
        on(isValid, (valid) => {
            if (valid) {
                console.log("has session");
                navigate(routes.groups);
            }
        }),
    );
    // TODO: remove
    const [providersResource] = createResource<Providers>(() =>
        fetch(`${import.meta.env.VITE_API_URL}/auth/`).then((r) => r.json()),
    );
    const providers = createMemo(
        on(providersResource, (p) => {
            if (!p) return new Map();
            return new Map(Object.entries(p));
        }),
    );
    createEffect(
        on(providers, (p) => {
            console.log("providers", p);
        }),
    );
    return (
        <div class="flex flex-row justify-between items-center px-4 pt-4">
            <Show when={providers().has("local")}>
                <GroupMembers />
            </Show>
            <Show when={providers().has("google")}>
                <a href={providers().get("google")} rel="noreferrer">
                    <Button>GOOGOO</Button>
                </a>
            </Show>
        </div>
    );
}

function GroupMembers() {
    const [_, { initSession }] = useSession();
    const users = createMemo(() => {
        return USERS.map((user) => user.name) ?? [];
    });
    // const filter = createFilter({ sensitivity: "base" });
    const [options, setOptions] = createSignal(USERS);
    // createEffect(
    //     on(users, (users) => {
    //         setOptions(users);
    //     }),
    // );
    // const onOpenChange = (
    //     isOpen: boolean,
    //     triggerMode?: ComboboxTriggerMode,
    // ) => {
    //     if (isOpen && triggerMode === "manual") {
    //         // setOptions(users());
    //     }
    // };

    // const onInputChange = (value: string) => {
    //     setOptions(users().filter((option) => filter.contains(option, value)));
    // };

    //const [currentUser, setCurrentUser] = createSignal<User | undefined>();
    const navigate = useNavigate();

    const onChange = async (user: User) => {
        // TODO: handle
        if (!user) return;
        navigate(
            `${import.meta.env.VITE_API_URL}/auth/local/authorize?userId=${
                user.id
            }`,
        );
        //setCurrentUser(user);
    };

    // const [session] = createResource(currentUser, async (user) => {
    //     if (!user) return;
    //     const id = user.id;
    //     const res = await fetch(
    //         `${import.meta.env.VITE_API_URL}/auth/local/authorize?userId=${id}`,
    //         {
    //             method: "GET",
    //         },
    //     ).then((res) => res.json());
    //     if (!res.body) {
    //         throw new Error("Invalid response");
    //     }
    //     const info = initSessionSchema.safeParse(JSON.parse(res.body));
    //     if (!info.success) {
    //         throw new Error("Invalid response: " + info.error);
    //     }
    //     return info.data;
    // });
    //
    // createEffect(
    //     on(session, (s) => {
    //         if (!s) return;
    //         console.log("session", s);
    //         initSession(s);
    //     }),
    // );

    return (
        <Select<User>
            options={options()}
            // onOpenChange={onOpenChange}
            onChange={onChange}
            placeholder="Member"
            itemComponent={(props) => (
                <SelectItem item={props.item}>
                    <a
                        href={`${
                            import.meta.env.VITE_API_URL
                        }/auth/local/authorize?userId=${props.item.rawValue.id}`}
                    >
                        <Button>{props.item.rawValue.name}</Button>
                    </a>
                </SelectItem>
            )}
        >
            <SelectTrigger class="bg-white"></SelectTrigger>
            <SelectContent />
        </Select>
    );
}

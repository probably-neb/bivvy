import { createFilter } from "@kobalte/core";
import type { ComboboxTriggerMode } from "@/components/ui/combobox";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import { USERS, User, hasSession, initSession } from "@/lib/auth";
import Layout from "@/lib/layout";
import {
    createEffect,
    createMemo,
    createResource,
    createSignal,
    on,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { z } from "zod";

export default function () {
    console.log("Login");

    const navigate = useNavigate();
    createEffect(() => {
        if (hasSession()) {
            console.log("has session")
            navigate("/")
        }
    });
    return (
        <Layout>
            <div class="flex flex-row justify-between items-center px-4 pt-4">
                <GroupMembers />
            </div>
        </Layout>
    );
}

const sessionSchema = z.object({
    userId: z.string(),
    token: z.string(),
})

function GroupMembers() {
    const users = createMemo(() => {
        return USERS.map((user) => user.name) ?? [];
    });
    const filter = createFilter({ sensitivity: "base" });
    const [options, setOptions] = createSignal(users());
    createEffect(
        on(users, (users) => {
            setOptions(users);
        }),
    );
    const onOpenChange = (
        isOpen: boolean,
        triggerMode?: ComboboxTriggerMode,
    ) => {
        if (isOpen && triggerMode === "manual") {
            setOptions(users());
        }
    };

    const onInputChange = (value: string) => {
        setOptions(users().filter((option) => filter.contains(option, value)));
    };

    const [currentUser, setCurrentUser] = createSignal<User | undefined>();

    const onChange = async (value: string) => {
        const user = USERS.find((user) => user.name === value);
        // TODO: handle
        if (!user) return;
        setCurrentUser(user);
    };

    const [session] = createResource(currentUser, async (user) => {
        if (!user) return;
        const id = user.id;
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/local/authorize?userId=${id}`,
            {
                method: "GET",
            },
        ).then((res) => res.json());
        if (!res.body) {
            throw new Error("Invalid response");
        }
        const info = sessionSchema.safeParse(JSON.parse(res.body));
        if (!info.success) {
            throw new Error("Invalid response: " + info.error);
        }
        return info.data;
    });

    createEffect(
        on(session, (s) => {
            if (!s) return;
            console.log("session", s)
            initSession(s.userId, s.token);
        }),
    );

    return (
        <Combobox
            options={options()}
            onInputChange={onInputChange}
            onOpenChange={onOpenChange}
            value={currentUser()?.name}
            onChange={onChange}
            placeholder="Member"
            itemComponent={(props) => (
                <ComboboxItem item={props.item}>
                    {props.item.rawValue}
                </ComboboxItem>
            )}
        >
            <ComboboxTrigger class="bg-white">
                <ComboboxInput />
            </ComboboxTrigger>
            <ComboboxContent />
        </Combobox>
    );
}

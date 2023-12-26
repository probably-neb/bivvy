import { Button } from "@/components/ui/button";
import {
    createEffect,
    createMemo,
    createSignal,
    on,
    onCleanup,
    onMount,
} from "solid-js";
import { OverviewCard } from "@/home/overview-card";
import { ExpensesTable } from "@/home/expenses-table";
import { AddExpenseCard } from "@/home/add-expense";
import { ViewExpenseCard } from "@/home/view-expense";
import { Expense, addUser, removeUsers, useUsers } from "@/lib/rep";

type AsideCardView = { mode: "view"; id: Expense["id"] };
// TODO:
// type AsideCardEdit = { mode: "edit"; id: Expense["id"] };
type AsideCardMode = { mode: "add"; id?: undefined } | AsideCardView;

export const [asideCardMode, setAsideCardMode] = createSignal<AsideCardMode>(
    {
        mode: "add",
    },
    {
        equals: (a, b) => a.mode === b.mode && a.id === b.id,
    },
);

export type ViewExpense = (expenseId: Expense["id"]) => void;

export function HomePage() {
    const AsideCard = createMemo(() => {
        const aside = asideCardMode();
        switch (aside.mode) {
            case "add":
                return <AddExpenseCard />;
            case "view":
                return <ViewExpenseCard expenseId={aside.id} />;
            default:
                const _ = aside satisfies never;
                throw new Error(`Unexpected mode: ${_}`);
        }
    });
    const viewExpense = (id: Expense["id"]) => {
        setAsideCardMode({ mode: "view", id });
    };

    return (
        <>
            <div class="flex flex-row justify-between items-center px-4 pt-4">
                <div class="text-white">
                    <h1 class="text-4xl font-bold">Paypals</h1>
                </div>
                <div class="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={[setAsideCardMode, { mode: "add" }]}
                        disabled={asideCardMode().mode == "add"}
                    >
                        Add Expense
                    </Button>
                    <GroupMembers />
                </div>
            </div>
            <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                <section class="w-full lg:w-2/3">
                    <ExpensesTable viewExpense={viewExpense} />
                </section>
                <aside class="w-full lg:w-1/3 flex flex-col justify-start gap-6 pt-6">
                    <OverviewCard />
                    {AsideCard()}
                </aside>
            </div>
        </>
    );
}

import { createFilter } from "@kobalte/core";
import type { ComboboxTriggerMode } from "@/components/ui/combobox";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import { currentUser, setCurrentUser, USERS } from "@/lib/auth";

function GroupMembers() {
    onMount(() => {
        for (const user of USERS) {
            addUser(user);
        }
    });
    onCleanup(() => {
        removeUsers();
    });
    const _users = useUsers();
    const users = createMemo(() => {
        return _users()?.map((user) => user.name) ?? [];
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

    const onChange = (value: string) => {
        const user = USERS.find((user) => user.name === value);
        if (user) {
            setCurrentUser(user);
            console.log({ currentUser: currentUser() });
        }
    };

    return (
        <Combobox
            options={options()}
            onInputChange={onInputChange}
            onOpenChange={onOpenChange}
            value={currentUser().name}
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

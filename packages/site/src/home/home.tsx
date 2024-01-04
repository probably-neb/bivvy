import { Button } from "@/components/ui/button";
import {
    createMemo,
    createSignal,
} from "solid-js";
import { OverviewCard } from "@/home/overview-card";
import { ExpensesTable } from "@/home/expenses-table";
import { AddExpenseCard } from "@/home/add-expense";
import { ViewExpenseCard } from "@/home/view-expense";
import {CreateSplit} from "@/home/create-split";
import { Expense } from "@/lib/rep";

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

export default function HomePage() {
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

    // FIXME: move group ctx provider to group page in child route
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
                    </div>
                </div>
                <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                    <section class="w-full lg:w-2/3">
                        <CreateSplit />
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


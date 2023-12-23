import { Button } from "@/components/ui/button";
import { createMemo, createSignal, Setter } from "solid-js";
import { OverviewCard } from "@/home/overview-card";
import { ExpensesTable } from "@/home/expenses-table";
import { AddExpenseCard } from "@/home/add-expense";
import { ViewExpenseCard } from "@/home/view-expense";
import { Expense } from "./lib/rep";

type AsideCardView = { mode: "view"; id: Expense["id"] };
type AsideCardMode = { mode: "add"; id?: undefined } | AsideCardView;

export type SetAsideCardMode = Setter<AsideCardMode>;
export const [asideCardMode, setAsideCardMode] = createSignal<AsideCardMode>(
    {
        mode: "add",
    },
    {
        equals: (a, b) => a.mode === b.mode && a.id === b.id,
    },
);

function App() {


    const AsideCard = createMemo(() => {
        const aside = asideCardMode();
        switch (aside.mode) {
            case "add":
                return <AddExpenseCard />;
            case "view":
                return <ViewExpenseCard expenseId={aside.id} />;
            default:
                throw new Error(`Unexpected mode: ${aside}`);
        }
    });

    return (
        <>
            <main class="min-h-screen bg-gradient-to-tl from-[#145277] to-[#83D0CB]">
                <div class="bg-white text-black p-3">
                    <h1 class="text-3xl font-bold">Paypals</h1>
                </div>
                <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                    <section class="w-full lg:w-2/3">
                        <ExpensesTable setAsideCardMode={setAsideCardMode} />
                    </section>
                    <aside class="w-full lg:w-1/3 flex flex-col justify-start gap-6 pt-6">
                        <OverviewCard />
                        <Button
                            variant="outline"
                            onClick={[setAsideCardMode, { mode: "add" }]}
                            disabled={asideCardMode().mode == "add"}
                        >
                            Add Expense
                        </Button>
                        {AsideCard()}
                    </aside>
                </div>
            </main>
        </>
    );
}

export default App;

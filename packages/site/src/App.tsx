import { Button } from "@/components/ui/button";
import { createSignal, Show } from "solid-js";
import { OverviewCard } from "@/home/overview-card";
import { TransactionTable } from "@/home/transactions-table";
import { AddExpenseCard } from "@/home/add-expense";
import { ViewExpenseCard } from "@/home/view-expense";

type AsideCardMode = "add" | "view";

export const [asideCardMode, setAsideCardMode] =
    createSignal<AsideCardMode>("add");

function App() {
    return (
        <>
            <main class="min-h-screen bg-gradient-to-tl from-[#145277] to-[#83D0CB]">
                <div class="bg-white text-black p-3">
                    <h1 class="text-3xl font-bold">Paypals</h1>
                </div>
                <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                    <section class="w-full lg:w-2/3">
                        <TransactionTable />
                    </section>
                    <aside class="w-full lg:w-1/3 flex flex-col justify-start gap-6 pt-6">
                        <OverviewCard />
                        <Button
                            variant="outline"
                            onClick={[setAsideCardMode, "add"]}
                            disabled={asideCardMode() == "add"}
                        >
                            Add Transaction
                        </Button>
                        <Show
                            when={asideCardMode() === "view"}
                            fallback={<AddExpenseCard />}
                        >
                            <ViewExpenseCard />
                        </Show>
                    </aside>
                </div>
            </main>
        </>
    );
}

export default App;

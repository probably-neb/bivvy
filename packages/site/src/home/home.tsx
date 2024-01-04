import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import {
    Switch,
    Show,
    createMemo,
    createSignal,
    Match,
} from "solid-js";
import { OverviewCard } from "@/home/overview-card";
import { ExpensesTable } from "@/home/expenses-table";
import { AddExpenseCard } from "@/home/add-expense";
import { ViewExpenseCard } from "@/home/view-expense";
import {CreateSplit} from "@/home/create-split";
import { Expense } from "@/lib/rep";
import { useQueries } from "@/lib/device";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExpenseCardView = { mode: "view"; id: Expense["id"] };
// TODO:
// type AsideCardEdit = { mode: "edit"; id: Expense["id"] };
type ExpenseCardMode = { mode: "add"; id?: undefined } | ExpenseCardView;

const [expenseCardMode, _setExpenseCardMode] = createSignal<ExpenseCardMode>(
    {
        mode: "add",
    },
    {
        equals: (a, b) => a.mode === b.mode && a.id === b.id,
    },
);
export {expenseCardMode as asideCardMode}

const [expenseCardOpen, setExpenseCardOpen] = createSignal(false);

export function setExpenseCardMode(mode: ExpenseCardMode) {
    _setExpenseCardMode(mode);
    // modal only exists on small devices but just setting it here and
    // keeping logic elsewhere is simpler
    setExpenseCardOpen(true);
}

export type ViewExpense = (expenseId: Expense["id"]) => void;

// TODO: pass as prop to expenses table
function AddExpenseButton() {
    const device = useQueries()
    const disabled = createMemo(() => {
        if (!expenseCardOpen() && device.isSm()) {
            return false
        }
        return expenseCardMode().mode == "add"
    })
    return ( <Button
        variant="outline"
        onClick={[setExpenseCardMode, { mode: "add" }]}
        disabled={disabled()}
    >
        Add Expense
    </Button> )

}

export default function HomePage() {
    const viewExpense = (id: Expense["id"]) => {
        setExpenseCardMode({ mode: "view", id });
    };

    return (
            <>
                <div class="flex flex-row justify-between items-center px-4 pt-4">
                    <div class="text-white">
                        <h1 class="text-4xl font-bold">Paypals</h1>
                    </div>
                    <div class="flex gap-3">
                        <AddExpenseButton />
                    </div>
                </div>
                <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                    <section class="w-full lg:w-2/3">
                        <CreateSplit />
                        <ExpensesTable viewExpense={viewExpense} />
                    </section>
                    <aside class="w-full lg:w-1/3 flex flex-col justify-start gap-6 pt-6">
                        <OverviewCard />
                        <ExpenseCardWrapper />
                    </aside>
                </div>
            </>
    );
}

function ExpenseCardWrapper() {
    const device = useQueries()
    const isSm = createMemo(() => {
        const isSm = device.isSm()
        console.log("isSm", isSm)
        return isSm
    })

    return <Show when={isSm()} fallback={<ExpenseCard />}>
        <ExpenseCardModal />
    </Show>
}

function ExpenseCardModal() {
        return (<Dialog
            open={expenseCardOpen()}
            onOpenChange={setExpenseCardOpen}
        >
            <DialogTrigger>
                <Button onClick={[setExpenseCardOpen, true]}>Open</Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                <ExpenseCardInner />
                <Button onClick={[setExpenseCardOpen, false]}>Close</Button>
            </DialogContent>
        </Dialog>)

}

function ExpenseCard() {
    const title = createMemo(() => {
        switch (expenseCardMode().mode) {
            case "add":
            return "New Expense";
            case "view":
            return "Expense Details";
        }
    })
    return <Card>
            <CardHeader>
                <CardTitle>{title()}</CardTitle>
            </CardHeader>
            <CardContent class="px-10">
                <ExpenseCardInner />
            </CardContent>
        </Card>
}

function ExpenseCardInner() {
    return <Switch>
        <Match when={expenseCardMode().mode === "add"}>
            <AddExpenseCard />
        </Match>
        <Match when={expenseCardMode().mode === "view"}>
            <ViewExpenseCard expenseId={expenseCardMode().id!} />
        </Match>
    </Switch>
}


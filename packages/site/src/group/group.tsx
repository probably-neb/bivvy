import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch, Show, createMemo, createSignal, Match, ParentProps } from "solid-js";
import { OverviewCard } from "@/group/overview-card";
import { ExpensesTable } from "@/group/expenses-table";
import { AddExpenseCard } from "@/group/add-expense";
import { ViewExpenseCard } from "@/group/view-expense";
import { Expense, useMutations } from "@/lib/rep";
import { useQueries } from "@/lib/device";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiTrash } from "solid-icons/ti";

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
export { expenseCardMode as asideCardMode };

const [expenseCardOpen, setExpenseCardOpen] = createSignal(false);

export function setExpenseCardMode(mode: ExpenseCardMode) {
    console.log("setting mode", mode);
    _setExpenseCardMode(mode);
    // modal only exists on small devices but just setting it here
    // always and keeping logic elsewhere is simpler
    setExpenseCardOpen(true);
}

export type ViewExpense = (expenseId: Expense["id"]) => void;

function AddExpenseButton() {
    const device = useQueries();
    const disabled = createMemo(() => {
        // if the expense card will be shown in a modal,
        // don't disable the button when the modal isn't open
        if (!expenseCardOpen() && !device.isAtLeastLg()) {
            return false;
        }
        return expenseCardMode().mode == "add";
    });
    return (
        <Button
            variant="outline"
            onClick={[setExpenseCardMode, { mode: "add" }]}
            disabled={disabled()}
        >
            Add Expense
        </Button>
    );
}

function DeleteExpenseButton(props: { expenseId: Expense["id"] }) {
    const { deleteExpense } = useMutations();
    const onClickDelete = async () => {
        // TODO: show confirmation dialog
        await deleteExpense(props.expenseId);
        setExpenseCardMode({ mode: "add" });
        setExpenseCardOpen(false);
    };
    // FIXME: button not red
    return (
        <Button variant="ghost" onClick={onClickDelete}>
            <TiTrash size="1.5em" class="bg-red" />
        </Button>
    );
}

export default function GroupPage() {
    const viewExpense = (id: Expense["id"]) => {
        setExpenseCardMode({ mode: "view", id });
    };

    // TODO: move header to layout
    return (
        <>
            <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12 p-6">
                <aside class="w-full flex flex-col justify-start gap-6 pt-6 lg:w-1/3 lg:order-last">
                    <OverviewCard />
                    <ExpenseCardWrapper />
                </aside>
                <section class="w-full lg:w-2/3">
                    <ExpensesTable
                        viewExpense={viewExpense}
                        addExpenseButton={<AddExpenseButton />}
                    />
                </section>
            </div>
        </>
    );
}

function ExpenseCardWrapper() {
    const device = useQueries();
    const title = createMemo(() => {
        switch (expenseCardMode().mode) {
            case "add":
                return "New Expense";
            case "view":
                return "Expense Details";
        }
    });

    return (
        <Show
            when={device.isAtLeastLg()}
            fallback={<ExpenseCardModal title={title()} />}
        >
            <ExpenseCard title={title()} />
        </Show>
    );
}

function ExpenseCardModal(props: { title: string }) {
    return (
        <Dialog open={expenseCardOpen()} onOpenChange={setExpenseCardOpen}>
            <DialogContent class="sm:max-w-[425px] max-w-[80%]">

                <ExpenseCardHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                </ExpenseCardHeader>
                <ExpenseCardInner />
            </DialogContent>
        </Dialog>
    );
}

function ExpenseCard(props: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <ExpenseCardHeader>
                    <CardTitle>{props.title}</CardTitle>
                </ExpenseCardHeader>
            </CardHeader>
            <CardContent class="px-10">
                <ExpenseCardInner />
            </CardContent>
        </Card>
    );
}

function ExpenseCardHeader(props: ParentProps) {
    return <Show when={expenseCardMode().mode === "view"} fallback={props.children}>
        <div class="flex justify-between items-center">
            {props.children}
            <DeleteExpenseButton expenseId={expenseCardMode().id!} />
        </div>
    </Show>
}

function ExpenseCardInner() {
    return (
        <Switch>
            <Match when={expenseCardMode().mode === "add"}>
                <AddExpenseCard onSubmit={() => setExpenseCardOpen(false)} />
            </Match>
            <Match when={expenseCardMode().mode === "view"}>
                <ViewExpenseCard expenseId={expenseCardMode().id!} />
            </Match>
        </Switch>
    );
}

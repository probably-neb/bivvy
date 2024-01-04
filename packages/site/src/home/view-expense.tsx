import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiTrash } from "solid-icons/ti";
import { Expense, useExpense, useMutations } from "@/lib/rep";
import { ParentProps, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { setExpenseCardMode } from "@/home/home";
import {
    DateRenderer,
    MoneyRenderer,
    UserRenderer,
} from "@/components/renderers";

export function DeleteExpenseButton(props: { expenseId: Expense["id"] }) {
    const {deleteExpense} = useMutations();
    const onClickDelete = async () => {
        // TODO: show confirmation dialog
        await deleteExpense(props.expenseId);
        setExpenseCardMode({ mode: "add" });
    };
    // FIXME: button not red
    return <Button onClick={onClickDelete}>
            <TiTrash class="bg-red" />
    </Button>
}

export function ViewExpenseCard(props: { expenseId: Expense["id"] }) {
    const expense = useExpense(props.expenseId);


    return (
        <div class="grid grid-cols-2">
            <KV k="Paid By">
                <Show when={expense()?.paidBy}>
                    {(paidBy) => <UserRenderer userId={paidBy()} />}
                </Show>
            </KV>
            <KV k="Amount">
                <Show when={expense()?.amount}>
                    {(amount) => <MoneyRenderer amount={amount()} />}
                </Show>
            </KV>
            <KV k="Status">
                <Show when={expense()?.status}>
                    {(status) => (
                        <span class="uppercase">{status()}</span>
                    )}
                </Show>
            </KV>
            <KV k="Description">
                <Show when={expense()?.description}>
                    {(description) => <span>{description()}</span>}
                </Show>
            </KV>
            <KV k="Paid On">
                <Show when={expense()?.paidOn}>
                    {(paidOn) => <DateRenderer dateStr={paidOn()} />}
                </Show>
            </KV>
            <KV k="Added On">
                <Show when={expense()?.createdAt}>
                    {(createdAt) => (
                        <DateRenderer dateStr={createdAt()} />
                    )}
                </Show>
            </KV>
        </div>
    );
}

function KV({ k, children }: ParentProps<{ k: string }>) {
    return (
        <>
            <div class="text-gray-600">{k}</div>
            <div>{children}</div>
        </>
    );
}

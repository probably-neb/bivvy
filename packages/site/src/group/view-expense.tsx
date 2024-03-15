import { Expense, useExpense } from "@/lib/rep";
import { ParentProps, Show } from "solid-js";
import {
    DateRenderer,
    MoneyRenderer,
    SplitRenderer,
    UserRenderer,
} from "@/components/renderers";


export function ViewExpenseCard(props: { expenseId: Expense["id"] }) {
    const expense = useExpense(() => props.expenseId);

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
            <KV k="Description">
                <Show when={expense()?.description}>
                    {(description) => <span>{description()}</span>}
                </Show>
            </KV>
            <KV k="Split">
                <Show when={expense()?.splitId}>
                    {(splitId) => <SplitRenderer splitId={splitId()} />}
                </Show>
            </KV>
            <KV k="Paid On">
                <Show when={expense()?.paidOn}>
                    {(paidOn) => <DateRenderer date={paidOn()} />}
                </Show>
            </KV>
            <KV k="Added On">
                <Show when={expense()?.createdAt}>
                    {(createdAt) => (
                        <DateRenderer date={createdAt()} />
                    )}
                </Show>
            </KV>
        </div>
    );
}

function KV(props: ParentProps<{ k: string }>) {
    return (
        <>
            <div class="text-gray-600">{props.k}</div>
            <div>{props.children}</div>
        </>
    );
}

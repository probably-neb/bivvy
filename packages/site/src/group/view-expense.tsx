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
            <KV k="PAID BY:">
                <Show when={expense()?.paidBy}>
                    {(paidBy) => <UserRenderer userId={paidBy()} />}
                </Show>
            </KV>
            <KV k="AMOUNT:">
                <Show when={expense()?.amount}>
                    {(amount) => <MoneyRenderer amount={amount()} />}
                </Show>
            </KV>
            <KV k="PAID ON:">
                <Show when={expense()?.paidOn}>
                    {(paidOn) => <DateRenderer date={paidOn()} />}
                </Show>
            </KV>
            <KV k="ADDED ON:">
                <Show when={expense()?.createdAt}>
                    {(createdAt) => (
                        <DateRenderer date={createdAt()} />
                    )}
                </Show>
            </KV>
            <KV k="SPLIT:">
                <Show when={expense()?.splitId}>
                    {(splitId) => <SplitRenderer splitId={splitId()} />}
                </Show>
            </KV>
            <KV k="DESCRIPTION:">
                <Show when={expense()?.description}>
                    {(description) => <span>{description()}</span>}
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

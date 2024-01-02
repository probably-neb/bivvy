import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiTrash } from "solid-icons/ti";
import { Expense, deleteExpense, useExpense } from "@/lib/rep";
import { ParentProps } from "solid-js";
import {Show} from "solid-js"
import { Button } from "@/components/ui/button";
import { setAsideCardMode } from "@/home/home";
import {
    DateRenderer,
    MoneyRenderer,
    Render,
    UserRenderer,
} from "@/components/renderers";

export function ViewExpenseCard(props: { expenseId: Expense["id"] }) {
    const expense = useExpense(props.expenseId);

    const onClickDelete = async () => {
        // TODO: show confirmation dialog
        await deleteExpense(props.expenseId);
        setAsideCardMode({ mode: "add" });
    };

    return (
        <Card>
            <CardHeader>
                <div class="flex justify-between items-center">
                    <CardTitle>Expense Details</CardTitle>
                    <Button onClick={onClickDelete}>
                        <TiTrash class="bg-red" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
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

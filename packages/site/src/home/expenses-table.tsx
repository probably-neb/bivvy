import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ViewExpense } from "@/home/home";
import { useExpenses, type Expense } from "@/lib/rep";
import { For, Show } from "solid-js";
import {
    DateRenderer,
    MoneyRenderer,
    UserRenderer,
} from "@/components/renderers";

export function ExpensesTable({ viewExpense }: { viewExpense: ViewExpense }) {
    const expenses = useExpenses();
    // FIXME: move add expense button here
    return (
        <Card class="mt-6">
            <CardHeader>
                <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Paid By</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid On</TableHead>
                            <TableHead>Added On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <For each={expenses()}>
                            {(expense) => (
                                <ExpenseRow
                                    expense={expense}
                                    viewExpense={viewExpense}
                                />
                            )}
                        </For>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ExpenseRow({
    expense,
    viewExpense,
}: {
    expense: Expense;
    viewExpense: (expenseId: Expense["id"]) => void;
}) {
    return (
        <TableRow onClick={[viewExpense, expense.id]}>
            <TableCell>
                <UserRenderer userId={expense.paidBy} />
            </TableCell>
            <TableCell>
                <MoneyRenderer amount={expense.amount} />
            </TableCell>
            <TableCell>{expense.description}</TableCell>
            <TableCell class="uppercase">{expense.status}</TableCell>
            <TableCell>
                <Show when={expense.paidOn} fallback={<span class="flex justify-center">-</span>}>
                    {(paidOn) => <DateRenderer dateStr={paidOn()} />}
                </Show>
            </TableCell>
            <TableCell>
                <DateRenderer dateStr={expense.createdAt} />
            </TableCell>
        </TableRow>
    );
}

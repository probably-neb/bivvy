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

export function ExpensesTable(props: { viewExpense: ViewExpense }) {
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
                                    viewExpense={props.viewExpense}
                                />
                            )}
                        </For>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ExpenseRow(props: {
    expense: Expense;
    viewExpense: (expenseId: Expense["id"]) => void;
}) {
    return (
        <TableRow onClick={[props.viewExpense, props.expense.id]}>
            <TableCell>
                <UserRenderer userId={props.expense.paidBy} />
            </TableCell>
            <TableCell>
                <MoneyRenderer amount={props.expense.amount} />
            </TableCell>
            <TableCell>{props.expense.description}</TableCell>
            <TableCell class="uppercase">{props.expense.status}</TableCell>
            <TableCell>
                <Show when={props.expense.paidOn}>
                    {(paidOn) => <DateRenderer date={paidOn()} />}
                </Show>
            </TableCell>
            <TableCell>
                <DateRenderer date={props.expense.createdAt} />
            </TableCell>
        </TableRow>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { setAsideCardMode } from "@/App";
import { useExpenses, type Expense } from "@/lib/rep";
import { For } from "solid-js";

export function TransactionTable() {
    const expenses = useExpenses();
    return (
        <Card class="mt-6">
            <CardHeader>
                <CardTitle>Shared Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <For each={expenses()}>
                            {(expense) => <ExpenseRow expense={expense} />}
                        </For>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ExpenseRow({ expense }: { expense: Expense }) {
    return (
        <TableRow onClick={[setAsideCardMode, "view"]}>
            <TableCell>{expense.payer}</TableCell>
            <TableCell>{expense.amount}</TableCell>
            <TableCell class="uppercase">{expense.status}</TableCell>
        </TableRow>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SetAsideCardMode } from "@/App";
import { useExpenses, type Expense } from "@/lib/rep";
import { For } from "solid-js";

export function ExpensesTable({setAsideCardMode}: {setAsideCardMode: SetAsideCardMode}) {
    const expenses = useExpenses();
    const viewExpense = (expenseId: Expense["id"]) => {
        setAsideCardMode({mode: "view", id: expenseId});
    }
    return (
        <Card class="mt-6">
            <CardHeader>
                <CardTitle>Expenses</CardTitle>
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
                            {(expense) => <ExpenseRow expense={expense} viewExpense={viewExpense}/>}
                        </For>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ExpenseRow({ expense, viewExpense}: { expense: Expense, viewExpense: (expenseId: Expense["id"]) => void}) {
    return (
        <TableRow onClick={[viewExpense, expense.id]}>
            <TableCell>{expense.payer}</TableCell>
            <TableCell>{expense.amount}</TableCell>
            <TableCell class="uppercase">{expense.status}</TableCell>
        </TableRow>
    );
}

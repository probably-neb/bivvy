import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ViewExpense } from "@/group/group";
import { useExpenses, type Expense } from "@/lib/rep";
import { Accessor, For, JSX, Show, createMemo, on } from "solid-js";
import {
    DateRenderer,
    MoneyRenderer,
    SplitRenderer,
    UserRenderer,
} from "@/components/renderers";
import { Size, useDeviceContext } from "@/lib/device";

// NOTE: order of fields here determines order in table
const columnFields = [
    "paidBy",
    "amount",
    "splitId",
    "description",
    "status",
    "paidOn",
    "createdAt",
] as const;
type Columns = Pick<Expense, (typeof columnFields)[number]>;
type Column = keyof Columns

const titles: Record<Column, string> = {
    paidBy: "Paid By",
    amount: "Amount",
    description: "Description",
    status: "Status",
    paidOn: "Paid On",
    createdAt: "Added On",
    splitId: "Split",
};

const showAt: Record<Column, Size> = {
    paidBy: "sm",
    amount: "sm",
    description: "sm",
    splitId: "sm",
    status: "md",
    paidOn: "md",
    createdAt: "md",
};

export function ExpensesTable(props: { viewExpense: ViewExpense, addExpenseButton: JSX.Element }) {
    const expenses = useExpenses();
    const [device, { isAtLeast }] = useDeviceContext();
    const show = createMemo(
        on(device, () =>
            Object.fromEntries(
                columnFields.map(f => [f, isAtLeast(showAt[f])])
            ) as Record<Column, boolean>
        )
    )
    return (
        <Card class="mt-6">
            <CardHeader class="flex flex-row justify-between items-center p-3 pl-6">
                <CardTitle>Expenses</CardTitle>
                {props.addExpenseButton}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <For each={columnFields}>
                                {(field) => (
                                    <Show when={show()[field]}>
                                        <TableHead>{titles[field]}</TableHead>
                                    </Show>
                                )}
                            </For>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <For each={expenses()}>
                            {(expense) => (
                                <ExpenseRow
                                    show={show}
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

type RowRenderer<Key extends Column> = (
    k: Columns[Key],
    v: Columns,
) => JSX.Element;

const renderers: { [key in Column]: RowRenderer<key> } = {
    paidBy: (paidBy) => <UserRenderer userId={paidBy} />,
    amount: (amount) => <MoneyRenderer amount={amount} />,
    description: (description) => <span>{description}</span>,
    status: (status) => <span class="uppercase">{status}</span>,
    paidOn: (paidOn) => ( <Show when={paidOn}> <DateRenderer date={paidOn!} /> </Show>),
    createdAt: (createdAt) => <DateRenderer date={createdAt} />,
    splitId: (splitId) => <SplitRenderer splitId={splitId} />,
};

function ExpenseRow(props: {
    show: Accessor<Record<Column, boolean>>;
    expense: Expense;
    viewExpense: (expenseId: Expense["id"]) => void;
}) {
    return (
        <TableRow onClick={[props.viewExpense, props.expense.id]}>
            <For each={columnFields}>
                {(field) => (
                    <Show when={props.show()[field]}>
                        <TableCell>
                            {(renderers[field] as any)(props.expense[field], props.expense)}
                        </TableCell>
                    </Show>
                )}
            </For>
        </TableRow>
    );
}

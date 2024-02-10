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
import {
    Accessor,
    Component,
    For,
    JSX,
    Show,
    createEffect,
    createSignal,
    on,
} from "solid-js";
import {
    DateRenderer,
    MoneyRenderer,
    SplitRenderer,
    UserRenderer,
} from "@/components/renderers";
import { Size, useDeviceContext } from "@/lib/device";
import { TiPlus, TiUpload } from "solid-icons/ti";
import { Button } from "@/components/ui/button";
import { CreateSplitDialog } from "./create-split";
import { createStore } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { routes } from "@/routes";
import { useCurrentGroupId } from "@/lib/group";
import { FiUpload } from "solid-icons/fi";
import { AiOutlinePlus } from "solid-icons/ai";

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
type Column = keyof Columns;

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

const actions: Record<Column, Component> = {
    paidBy: () => null,
    amount: () => null,
    description: () => null,
    status: () => null,
    paidOn: () => null,
    createdAt: () => null,
    splitId: () => <CreateSplitButton />,
};

function ColumnAction(props: { field: Column }) {
    const Action = actions[props.field];
    return <Action />;
}

const defaultShow = Object.fromEntries(
    columnFields.map((c) => [c, true]),
) as Record<Column, boolean>;

const [show, setShow] = createStore<Record<Column, boolean>>(defaultShow);

function watchShow() {
    const [device, { isAtLeast }] = useDeviceContext();
    createEffect(
        on(device, () => {
            setShow(
                Object.fromEntries(
                    columnFields.map((f) => [f, isAtLeast(showAt[f])]),
                ),
            );
        }),
    );
}

export function ExpensesTable(props: {
    viewExpense: ViewExpense;
    addExpenseButtonProps: AddExpenseButtonProps;
}) {
    watchShow();
    return (
        <Card class="mt-6">
            <CardHeader class="flex flex-row justify-between items-center p-3 pl-6">
                <CardTitle>Expenses</CardTitle>
                <div class="flex flex-row gap-2">
                    <AddExpenseButton {...props.addExpenseButtonProps} />
                    <UploadExpensesButton />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHeaders />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRows viewExpense={props.viewExpense} />
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function TableHeaders() {
    return (
        <For each={columnFields}>
            {(field) => (
                <Show when={show[field]}>
                    <TableHead>
                        {titles[field]}
                        <ColumnAction field={field} />
                    </TableHead>
                </Show>
            )}
        </For>
    );
}

function TableRows(props: { viewExpense: ViewExpense }) {
    const expenses = useExpenses();
    return (
        <For each={expenses()}>
            {(expense) => (
                <ExpenseRow expense={expense} viewExpense={props.viewExpense} />
            )}
        </For>
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
    paidOn: (paidOn) => (
        <Show when={paidOn}>
            <DateRenderer date={paidOn!} />
        </Show>
    ),
    createdAt: (createdAt) => <DateRenderer date={createdAt} />,
    splitId: (splitId) => <SplitRenderer splitId={splitId} />,
};

function ExpenseRow(props: {
    expense: Expense;
    viewExpense: (expenseId: Expense["id"]) => void;
}) {
    return (
        <TableRow onClick={[props.viewExpense, props.expense.id]}>
            <For each={columnFields}>
                {(field) => (
                    <Show when={show[field]}>
                        <TableCell>
                            {(renderers[field] as any)(
                                props.expense[field],
                                props.expense,
                            )}
                        </TableCell>
                    </Show>
                )}
            </For>
        </TableRow>
    );
}

function CreateSplitButton() {
    const [open, setOpen] = createSignal(false);
    return (
        <>
            <Button variant="ghost" onClick={() => setOpen(true)}>
                <TiPlus />
            </Button>
            <CreateSplitDialog open={open()} setOpen={setOpen} />
        </>
    );
}

function UploadExpensesButton() {
    const navigate = useNavigate();
    const groupId = useCurrentGroupId()

    function onClick() {
        const gid = groupId();
        if (!gid) {
            console.error("No group id")
            return
        }
        const path = routes.scan(gid);
        navigate(path);
    }

    return <div>
        <Button variant="outline" class="gap-2 uppercase" onClick={onClick}>
            <FiUpload /> Upload
        </Button>
    </div>
}

type AddExpenseButtonProps = {disabled: Accessor<boolean>, onClick: () => void}



function AddExpenseButton(props: AddExpenseButtonProps) {
    return (
        <Button
            class="gap-2 uppercase"
            variant="outline"
            onClick={props.onClick}
            disabled={props.disabled()}
        >
            <AiOutlinePlus /> Add
        </Button>
    );
}

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
import { type Expense, useTableExpenses } from "@/lib/rep";
import {
    Accessor,
    Component,
    For,
    ParentProps,
    Show,
    Switch,
    Match,
    createEffect,
    createSignal,
    on,
} from "solid-js";
import {
    DateRenderer,
    MoneyRenderer,
    SplitRenderer,
    UserProfileListRenderer,
    UserRenderer,
} from "@/components/renderers";
import { Size, useDeviceContext } from "@/lib/device";
import { TiPlus } from "solid-icons/ti";
import { Button } from "@/components/ui/button";
import { CreateSplitDialog } from "./create-split";
import { createStore } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { routes } from "@/routes";
import { useCurrentGroupId } from "@/lib/group";
import { FiUpload } from "solid-icons/fi";
import { AiOutlinePlus } from "solid-icons/ai";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTitle,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { attrWhen, dbg, isDev, when } from "@/lib/utils";
import {
    Table as TanstackTable,
    ColumnDef,
    HeaderGroup,
    Row,
    SortingState,
    createSolidTable,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    GroupingState,
    getGroupedRowModel,
    RowData,
    CellContext,
} from "@tanstack/solid-table";
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from "@/components/ui/hover-card";
import { As } from "@kobalte/core";
import { TbSelector } from "solid-icons/tb";

// NOTE: order of fields here determines order in table
const columnFields = [
    "paidBy",
    "amount",
    "splitId",
    "description",
    "paidOn",
    "createdAt",
] as const;
type Columns = Pick<Expense, typeof columnFields[number]>;
type Column = keyof Columns;

const showAt: Record<Column, Size> = {
    paidBy: "sm",
    amount: "sm",
    description: "sm",
    splitId: "sm",
    paidOn: "md",
    createdAt: "md",
};

const defaultShow = Object.fromEntries(
    columnFields.map((c) => [c, true])
) as Record<Column, boolean>;

const [show, setShow] = createStore<Record<Column, boolean>>(defaultShow);

function watchShow() {
    const [device, { isAtLeast }] = useDeviceContext();
    createEffect(
        on(device, () => {
            setShow(
                Object.fromEntries(
                    columnFields.map((f) => [f, isAtLeast(showAt[f])])
                )
            );
        })
    );
}

type ExpenseButtonProps = {
    viewExpense: ViewExpense;
    addExpenseButtonProps: AddExpenseButtonProps;
};

declare module "@tanstack/solid-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        width: string;
    }
}

function render<TValue>(ctx: CellContext<Expense, TValue>) {
    return flexRender(ctx.column.columnDef.cell, ctx)
}

const columns: ColumnDef<Expense>[] = [
    {
        header: "Paid By",
        accessorKey: "paidBy",
        cell: (params) => (
            <UserRenderer userId={params.getValue<Expense["paidBy"]>()} />
        ),
        aggregationFn: "unique",
        aggregatedCell(params) {
            if (params.cell.getIsGrouped()) {
                return flexRender(params.column.columnDef.cell, params);
            }
            console.log("foo", params.cell.getIsGrouped());
            const value = params.getValue<Array<Expense["id"]>>();
            return <UserProfileListRenderer userIDs={value} />;
        },
        meta: {
            width: "w-8",
        },
    },
    {
        header: "Amount",
        accessorKey: "amount",
        cell: (params) => (
            <MoneyRenderer amount={params.getValue<Expense["amount"]>()} />
        ),
        aggregatedCell: (params) => (
            <MoneyRenderer amount={params.getValue<Expense["amount"]>()} />
        ),
        meta: {
            width: "w-6",
        },
    },
    {
        header: () => (
            <>
                Split <CreateSplitButton />
            </>
        ),
        accessorKey: "splitId",
        cell: (params) => (
            <SplitRenderer splitId={params.getValue<Expense["splitId"]>()} />
        ),
        aggregatedCell: (params) => (
            <SplitRenderer splitId={params.getValue<Expense["splitId"]>()} />
        ),
        meta: {
            width: "w-8",
        },
    },
    {
        header: "Description",
        accessorKey: "description",
        cell: (params) => (
            <Show when={params.getValue<Expense["description"]>()}>
                {(description) => (
                    <Show
                        when={description().length > 20}
                        fallback={<span>{description()}</span>}
                    >
                        <HoverCard>
                            <HoverCardTrigger>
                                <span class="block text-nowrap truncate w-20 lg:w-32">
                                    {description()}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <span>{description()}</span>
                            </HoverCardContent>
                        </HoverCard>
                    </Show>
                )}
            </Show>
        ),
        meta: {
            width: "w-20 lg:w-32",
        },
    },
    {
        header: "Paid On",
        id: "paidOn",
        accessorFn: (val) => {
            // TODO: create custom `getGroupedRowModel` that does this on demand
            if (val.paidOn == null) return null;
            const ca = new Date(val.paidOn);
            // strip h, m, s, ms
            ca.setHours(0, 0, 0, 0);
            return ca.getTime();
        },
        cell: (params) => (
            <Show when={params.getValue<Expense["paidOn"]>()}>
                {(date) => <DateRenderer date={date()} />}
            </Show>
        ),
        aggregationFn: "extent",
        aggregatedCell: (params) => (
            <Show
                when={when(
                    params.getValue<[Expense["paidOn"], Expense["paidOn"]]>(),
                    (exp): exp is [number | null, number | null] =>
                        /* only show range when cell is not the one being grouped by */
                        !params.cell.getIsGrouped()
                )}
                fallback={render(params)}
            >
                {(extent) => (
                    <Switch>
                        <Match
                            when={
                                when(extent(), (ex): ex is [number, number] =>
                                    ex[0] !== ex[1] && ex.every((v) => v != null)
                                ) /* both dates not null */
                            }
                        >
                            {(extent) => (
                                <>
                                    <DateRenderer date={extent()[0]} />{" "}-{" "}
                                    <DateRenderer date={extent()[1]} />
                                </>
                            )}
                        </Match>
                        <Match
                            when={
                                extent().find(
                                    (d) => d != null
                                ) /* only one date not null */
                            }
                        >
                            {(date) => <DateRenderer date={date()} />}
                        </Match>
                    </Switch>
                )}
            </Show>
        ),
        sortingFn(a, b) {
            const aPaidOn = a.getValue<Expense["paidOn"]>("paidOn");
            const aAddedOn = a.getValue<Expense["createdAt"]>("createdAt");
            const bPaidOn = b.getValue<Expense["paidOn"]>("paidOn");
            const bAddedOn = b.getValue<Expense["createdAt"]>("createdAt");
            // default to createdAt if paidOn == null
            return (aPaidOn ?? aAddedOn) - (bPaidOn ?? bAddedOn);
        },
        meta: {
            width: "w-10",
        },
    },
    {
        header: "Added On",
        id: "createdAt",
        accessorFn: (val) => {
            const ca = new Date(val.createdAt);
            // strip h, m, s, ms
            ca.setHours(0, 0, 0, 0);
            return ca.getTime();
        },
        cell: (params) => (
            <DateRenderer date={params.getValue<Expense["createdAt"]>()} />
        ),
        aggregationFn: "extent",
        aggregatedCell: (params) => (
            <Show
                when={when(
                    params.getValue<
                        [Expense["createdAt"], Expense["createdAt"]]
                    >(),
                    (extent): extent is [number, number] =>
                        Array.isArray(extent)
                )}
                fallback={render(params)}
            >
                {(extent) => (
                <Show when={extent()[0] !== extent()[1]} fallback={<DateRenderer date={extent()[0]} />}>
                    <div>
                        <DateRenderer date={extent()[0]} /> -{" "}
                        <DateRenderer date={extent()[1]} />
                    </div>
                </Show>
                )}
            </Show>
        ),
        meta: {
            width: "w-10 data-[aggregate]:w-24",
        },
    },
];

type ExpenseTable = TanstackTable<Expense>;

export function ExpensesTable(props: ExpenseButtonProps) {
    watchShow();
    const expenses = useTableExpenses();
    const [state, setState] = createStore<{
        sorting: SortingState;
        grouping: GroupingState;
    }>({
        sorting: [{ id: "createdAt", desc: true }],
        grouping: [],
    });

    const table = createSolidTable<Expense>({
        get data() {
            return expenses() ?? [];
        },
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        onSortingChange: (sorting) => setState("sorting", sorting),
        onGroupingChange: (grouping) => setState("grouping", grouping),
        state: {
            get sorting() {
                return state.sorting;
            },
            get grouping() {
                return state.grouping;
            },
        },
        // debugAll: true,
    });
    return (
        <ExpensesTableWrapper
            table={table}
            addExpenseButtonProps={props.addExpenseButtonProps}
        >
            <Table>
                <TableHeaders
                    headerGroups={table.getHeaderGroups()}
                    isGrouped={state.grouping.length > 0}
                />
                <TopLevelTableRows
                    rows={table.getRowModel().rows}
                    viewExpense={props.viewExpense}
                    isGrouped={state.grouping.length > 0}
                />
            </Table>
        </ExpensesTableWrapper>
    );
}

function ExpensesTableWrapper(
    props: ParentProps<{
        table: ExpenseTable;
        addExpenseButtonProps: AddExpenseButtonProps;
    }>
) {
    return (
        <Card class="mt-6">
            <CardHeader class="flex flex-row justify-between items-center p-3 pl-6">
                <CardTitle>Expenses</CardTitle>
                <div class="flex flex-row gap-2">
                    <DisplaySettingsMenu table={props.table} />
                    <AddExpenseButton {...props.addExpenseButtonProps} />
                    <Show when={isDev()}>
                        <UploadExpensesButton />
                    </Show>
                </div>
            </CardHeader>
            <CardContent>{props.children}</CardContent>
        </Card>
    );
}

function DisplaySettingsMenu(props: { table: ExpenseTable }) {
    function setSorting(value: string) {
        const [id, dir] = value.split("-");
        const desc = dir === "desc";
        console.log({ id, desc });
        props.table.setSorting(() => [{ id, desc }]);
    }
    function setGrouping(value: string) {
        if (value === "none") {
            props.table.setGrouping(() => []);
            return;
        }
        props.table.setGrouping(() => [value]);
    }

    const valAnd = <T, R>(val: T | undefined | null, fn: (val: T) => R) => {
        if (val != null) {
            return fn(val);
        }
        return undefined;
    };
    return (
        <DropdownMenu placement="bottom">
            <DropdownMenuTrigger asChild>
                <As component={Button} variant="outline">
                    Display
                </As>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuTitle>Display Settings</DropdownMenuTitle>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort By</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={valAnd(
                                props.table.getState().sorting.at(0),
                                (sort) =>
                                    `${sort.id}-${sort.desc ? "desc" : "asc"}`
                            )}
                            onChange={setSorting}
                        >
                            <DropdownMenuRadioItem value="createdAt-asc">
                                Date Added ^
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="createdAt-desc">
                                Date Added v
                            </DropdownMenuRadioItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioItem value="paidOn-asc">
                                Date Paid ^
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="paidOn-desc">
                                Date Paid v
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Group By</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={props.table.getState().grouping.at(0) ?? 'none'}
                            onChange={setGrouping}
                        >
                            <DropdownMenuRadioItem value="none">
                                None
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="createdAt">
                                Date Added
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="paidOn">
                                Date Paid
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="splitId">
                                Split
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="paidBy">
                                Paid By
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function TableHeaders(props: {
    headerGroups: HeaderGroup<Expense>[];
    isGrouped: boolean;
}) {
    return (
        <TableHeader>
            <TableRow>
                <Show when={props.isGrouped}>
                    <TableHead class="w-2 px-0"></TableHead>
                    {/* "Expand" Column */}
                </Show>
                <For each={props.headerGroups[0].headers}>
                    {(header) => (
                        <Show when={true /* show[field] */}>
                            <TableHead
                                class={header.column.columnDef.meta?.width}
                            >
                                <Show when={!header.isPlaceholder}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </Show>
                            </TableHead>
                        </Show>
                    )}
                </For>
            </TableRow>
        </TableHeader>
    );
}

function TopLevelTableRows(props: {
    rows: Row<Expense>[];
    viewExpense: ViewExpense;
    isGrouped: boolean;
}) {
    return (
        <Show
            when={props.isGrouped}
            fallback={
                <TableBody class="min-h-0 max-h-[80vh] overflow-y-auto">
                    <For each={props.rows}>
                        {(row) => (
                            <ExpenseTableRow
                                row={row}
                                viewExpense={props.viewExpense}
                            />
                        )}
                    </For>
                </TableBody>
            }
        >
            <For each={props.rows}>
                {(row) => {
                    const [expanded, setExpanded] = createSignal(false);
                    return (
                        <Show when={row.getIsGrouped()}>
                            <TableRow>
                                <TableCell class="w-2 p-0 items-center text-muted-foreground">
                                    <span>{row.subRows.length}</span>
                                    <Button
                                        variant="ghost"
                                        onClick={[setExpanded, !expanded()]}
                                    >
                                        <TbSelector class="h-4 w-4 opacity-50" />
                                    </Button>
                                </TableCell>
                                <For each={row.getVisibleCells()}>
                                    {(cell, i) => (
                                        <TableCell
                                            data-aggregate
                                            class={`${
                                                cell.column.columnDef.meta
                                                    ?.width ?? ""
                                            }`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef
                                                    .aggregatedCell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    )}
                                </For>
                            </TableRow>
                            <TableBody
                                data-expanded={attrWhen(expanded())}
                                data-closed={attrWhen(!expanded())}
                                class="animate-collapsible-up data-[closed]:hidden data-[expanded]:animate-collapsible-down"
                            >
                                <For each={row.subRows}>
                                    {(subRow) => (
                                        <ExpenseTableRow
                                            row={subRow}
                                            viewExpense={props.viewExpense}
                                        />
                                    )}
                                </For>
                            </TableBody>
                        </Show>
                    );
                }}
            </For>
        </Show>
    );
}

function ExpenseTableRow(props: {
    row: Row<Expense>;
    viewExpense?: ViewExpense;
}) {
    return (
        <TableRow
            onClick={
                props.viewExpense && [props.viewExpense, props.row.original.id]
            }
        >
            <Show when={props.row.depth > 0}>
                <TableCell class="w-0 p-0"></TableCell>
            </Show>
            <For each={props.row.getVisibleCells()}>
                {(cell, i) => (
                    <TableCell
                        class={`${cell.column.columnDef.meta?.width ?? ""}`}
                    >
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                    </TableCell>
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
    const groupId = useCurrentGroupId();

    function onClick(kind: "receipt" | "table") {
        const gid = groupId();
        if (!gid) {
            console.error("No group id");
            return;
        }
        let path = routes.scanReceipt(gid);
        if (kind === "table") {
            path = routes.scanSpreadsheet(gid);
        }
        navigate(path);
    }

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="outline" class="gap-2 uppercase">
                        <FiUpload /> Upload
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={[onClick, "receipt"]}>
                        Receipt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={[onClick, "table"]}>
                        Spreadsheet
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

type AddExpenseButtonProps = {
    disabled: Accessor<boolean>;
    onClick: () => void;
};

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

"use client"
import styles from "./table.module.css";

import type { ReactNode } from "react";
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import type {
    Column,
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    Header,
    HeaderGroup,
    Row,
    RowData,
    SortDirection,
    SortingFn,
    SortingState,
    Table as TanstackTable,
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    sortingFns,
    useReactTable,
} from "@tanstack/react-table";
import {
    type Virtualizer,
    notUndefined,
    useVirtualizer,
} from "@tanstack/react-virtual";

import { useChanged } from "@/lib/use-changed";
import {
    RankingInfo,
    rankItem,
    compareItems,
} from "@tanstack/match-sorter-utils";

// FIXME: remove!
import { api } from "@/trpc/react";

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        noSkeleton?: boolean;
    }
    interface Row<TData extends RowData> {
        original: TData & { _skeleton?: boolean };
    }
    interface FilterFns {
        fuzzy: FilterFn<unknown>;
    }
    interface FilterMeta {
        itemRank: RankingInfo;
    }
}

// TODO: make this a prop
const PAGE_SIZE = 20;

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
        itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
};

const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
    let dir = 0;

    // Only sort by rank if the column has ranking information
    if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(
            rowA.columnFiltersMeta[columnId]?.itemRank!,
            rowB.columnFiltersMeta[columnId]?.itemRank!,
        );
    }

    // Provide an alphanumeric fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
}

export function DataTable<TData, TValue>({
    columns,
}: DataTableProps<TData, TValue>) {
    const rowHeight = 53;
    const fetchingPage = useRef<number | null>(0);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const query = api.expenses.lazy.useInfiniteQuery(
        {
            pageSize: PAGE_SIZE,
        },
        {
            initialCursor: 0,
        },
    );
    const numRows = useMemo(() => {
        const num = query.data?.pages.at(0)?.meta.totalRowCount ?? 0;
        console.log("updating numRows", num);
        return num;
    }, [query.data]);

    const pageQueue = usePageQueue([]);

    const [data, fetchedPages] = useMemo(() => {
        console.log("updating data");
        if (!query.data) return [[], []];

        const rows = new Array<TData>(numRows);

        const numPages = pageOfRow(numRows);
        const pages = query.data.pages;
        const fetchedPages = new Array<number>(pages.length);

        for (let i = 0; i < pages.length; i++) {
            const chunk = pages[i]!;
            const page = chunk.meta.page;
            const start = page * PAGE_SIZE;
            const removed = rows.splice(
                start,
                chunk.rows.length,
                ...(chunk.rows as TData[]),
            );
            console.assert(
                removed.length === PAGE_SIZE,
                "removed.length === PAGE_SIZE",
            );
            fetchedPages[i] = page;
        }
        for (let p = 0; p <= numPages; p++) {
            if (fetchedPages.includes(p)) continue;
            const start = p * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            rows.fill({ _skeleton: true } as unknown as TData, start, end);
        }
        for (const fetchedPage of fetchedPages) {
            void pageQueue.remove(fetchedPage);
        }
        const next = pageQueue.pop();
        if (next) {
            void query.fetchNextPage({ pageParam: next, cancelRefetch: false });
            fetchingPage.current = next;
        } else {
            fetchingPage.current = null;
        }
        return [rows, fetchedPages];
    }, [query.data?.pages]);
    // TODO: search using filter (https://tanstack.com/table/v8/docs/api/features/filters#filter-meta)
    const table = useReactTable({
        data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        enableColumnResizing: true,
        manualSorting: true,
        onSortingChange: (sorting) => {
            console.log("sorting changed", {
                sorting,
                pageQueue: pageQueue.data,
                fetchedPages,
            });
            void pageQueue.clear();
            virtualizer.scrollToIndex(0);
            setSorting(sorting);
        },
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        debugTable: true,
    });

    const bodyRef = useRef<HTMLDivElement>(null);

    const { rows } = table.getRowModel();

    const virtualizer = useVirtualizer({
        count: rows.length,
        // https://github.com/TanStack/virtual/issues/555#issuecomment-1600642269
        estimateSize: useCallback(() => rowHeight, []),
        getScrollElement: () => bodyRef.current,
        overscan: 10,
    });

    const [pagesToFetch, pagesToFetchChanged] = useChanged(
        () => [virtualizer.scrollOffset],
        () => {
            const range = virtualizer.calculateRange();
            if (!range) {
                // happens somewhat frequently, don't know why
                // returning empty array doesn't cause problems
                return [];
            }
            const visiblePages = new Array<number>();
            // TODO: add overscan but don't prioritize previous rows
            // i.e. start at current start and add leading overscan to end
            for (let i = range.startIndex; i <= range.endIndex; i++) {
                const page = pageOfRow(i);
                if (visiblePages.includes(page)) continue;
                visiblePages.push(page);
            }
            const pagesToFetch = visiblePages.filter(
                (p) =>
                    !fetchedPages.includes(p) &&
                    !pageQueue.has(p) &&
                    p !== fetchingPage.current,
            );
            return pagesToFetch;
        },
        {debugKey: "pagesToFetch"},
    );

    if (pagesToFetchChanged && pagesToFetch.length > 0) {
        console.log("pages to fetch", ...pagesToFetch);
        const [pageToFetch, ...pagesToQueue] = pagesToFetch as [
            number,
            ...number[],
        ];
        if (pagesToQueue.length > 0) {
            pageQueue.push(pagesToQueue);
        }

        void query.fetchNextPage({
            pageParam: pageToFetch,
            cancelRefetch: true,
        });
    }

    return (
        <div>
            <div>
                <DebouncedInput
                    value={globalFilter ?? ""}
                    onChange={(value) => setGlobalFilter(String(value))}
                    className="font-lg border-block border p-2 shadow"
                    placeholder="Search all columns..."
                />
            </div>
            <div
                ref={bodyRef}
                className="h-[500px] w-[800px] overflow-auto rounded-md border bg-white"
                style={{ overflowAnchor: "none" }}
            >
                <div
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                    className="relative"
                >
                    <Table>
                        <TableHeader className="sticky top-0 z-[1] bg-white">
                            <HeaderGroups groups={table.getHeaderGroups()} />
                        </TableHeader>
                        <TableBody>
                            <TableRows
                                virtualizer={virtualizer}
                                rows={rows}
                                columnsLen={columns.length}
                            />
                        </TableBody>
                    </Table>
                </div>
            </div>
            <RowCountFooter total={numRows} range={virtualizer.range} />
        </div>
    );
}

interface RowCountFooterProps {
    total: number;
    range: {
        startIndex: number;
        endIndex: number;
    } | null;
}

function RowCountFooter({ total, range }: RowCountFooterProps) {
    return (
        <div className="w-[800px] bg-white flex rouned-b-md justify-end text-black">
            Showing rows{" "}
            {range ? (
                `${range.startIndex} - ${range.endIndex}`
            ) : (
                <Skeleton style={{ width: 10 }} />
            )}{" "}
            Of {total} rows
        </div>
    );
}

interface TableRowsProps<TData> {
    virtualizer: Virtualizer<HTMLDivElement, Element>;
    rows: Row<TData>[];
    columnsLen: number;
}

function TableRows<TData>({
    virtualizer,
    rows,
    columnsLen,
}: TableRowsProps<TData>) {
    if (!rows.length) {
        return (
            <TableRow>
                <TableCell colSpan={columnsLen} className="h-24 text-center">
                    No results.
                </TableCell>
            </TableRow>
        );
    }
    const vitems = virtualizer.getVirtualItems();
    const vrows = new Array(vitems.length);

    // https://github.com/TanStack/virtual/discussions/476
    // https://codesandbox.io/s/virtual-simple-table-cdqqpg?file=/src/App.tsx
    const [before, after] =
        vitems.length > 0
            ? [
                  notUndefined(vitems[0]).start -
                      virtualizer.options.scrollMargin,
                  virtualizer.getTotalSize() - notUndefined(vitems.at(-1)).end,
              ]
            : [0, 0];

    for (let i = 0; i < vitems.length; i++) {
        const vitem = vitems[i]!;
        const row = rows[vitem.index]!;
        vrows[i] = (
            <TableRow
                key={vitem.key}
                data-state={row.getIsSelected() && "selected"}
            >
                <RowCells row={row} />
            </TableRow>
        );
    }
    return (
        <>
            {before > 0 && (
                <tr>
                    <td colSpan={columnsLen} style={{ height: before }} />
                </tr>
            )}
            {vrows}
            {after > 0 && (
                <tr>
                    <td colSpan={columnsLen} style={{ height: after }} />
                </tr>
            )}
        </>
    );
}

interface RowCellsProps<TData> {
    row: Row<TData>;
}

function RowCells<TData>({ row }: RowCellsProps<TData>) {
    const visibleCells = row.getVisibleCells();
    const renderedCells = new Array<ReactNode>(visibleCells.length);

    const isSkeleton = row.original._skeleton;

    for (let i = 0; i < visibleCells.length; i++) {
        const cell = visibleCells[i]!;
        const key = cell.id;
        if (isSkeleton && !cell.column.columnDef.meta?.noSkeleton) {
            renderedCells[i] = (
                <TableCell key={key}>
                    <Skeleton
                        className="w-9/12"
                        style={{
                            height: "1rem",
                        }}
                    />
                </TableCell>
            );
            continue;
        }
        renderedCells[i] = (
            <TableCell key={key}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
        );
    }
    return renderedCells;
}

function HeaderGroups<TData>({ groups }: { groups: HeaderGroup<TData>[] }) {
    const renderedGroups = new Array<ReactNode>(groups.length);
    for (let g = 0; g < groups.length; g++) {
        const group = groups[g]!;
        const len = group.headers.length;
        const renderedHeaders = new Array<ReactNode>(len);
        for (let h = 0; h < len; h++) {
            const header = group.headers[h]!;
            renderedHeaders[h] = (
                <IndividualHeader key={header.column.id} header={header} />
            );
        }
        renderedGroups[g] = (
            <TableRow key={group.id}>{renderedHeaders}</TableRow>
        );
    }
    return renderedGroups;
}

function IndividualHeader<TData>({
    header,
}: {
    header: Header<TData, unknown>;
}) {
    const setSort = useCallback(
        (newSort: SortDirection | false) => {
            const column = header.column;
            const curSort = column.getIsSorted();
            const unchanged =
                (!curSort && newSort === null) || curSort === newSort;
            if (unchanged) {
                console.warn("uneccessary set sorting");
                return;
            }

            if (newSort === null) {
                console.log("clearing sorting", header.column.columnDef.header);
                column.clearSorting();
                return;
            }
            console.log(
                "setting sorting",
                newSort,
                header.column.columnDef.header,
            );
            const desc = newSort === "desc";
            column.toggleSorting(desc);
        },
        [header],
    );
    return (
        <TableHead
            key={header.id}
            colSpan={header.colSpan}
            style={{
                width: header.getSize(),
                position: "relative",
            }}
        >
            {header.isPlaceholder
                ? null
                : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                  )}
            {header.column.getCanSort() ? (
                <HeaderSortIcon setSort={setSort} />
            ) : null}
            <div
                className={`${styles.resizer} ${
                    header.column.getIsResizing() ? styles.isResizing : ""
                }`}
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
            ></div>
            {header.column.getCanFilter() ? (
                <div>
                    <Filter
                        column={header.column}
                        table={header.getContext().table}
                    />
                </div>
            ) : null}
        </TableHead>
    );
}

function Filter({
    column,
    table,
}: {
    column: Column<any, unknown>;
    table: TanstackTable<any>;
}) {
    const firstValue = table
        .getPreFilteredRowModel()
        .flatRows[0]?.getValue(column.id);

    const columnFilterValue = column.getFilterValue();

    const sortedUniqueValues = useMemo(
        () =>
            typeof firstValue === "number"
                ? []
                : Array.from(column.getFacetedUniqueValues().keys())
                      .filter((v) => !!v)
                      .sort(),
        [column.getFacetedUniqueValues()],
    );

    return typeof firstValue === "number" ? (
        <div>
            <div className="flex space-x-2">
                <DebouncedInput
                    type="number"
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                    value={(columnFilterValue as [number, number])?.[0] ?? ""}
                    onChange={(value) =>
                        column.setFilterValue((old: [number, number]) => [
                            value,
                            old?.[1],
                        ])
                    }
                    placeholder={`Min ${
                        column.getFacetedMinMaxValues()?.[0]
                            ? `(${column.getFacetedMinMaxValues()?.[0]})`
                            : ""
                    }`}
                    className="w-24 rounded border shadow"
                />
                <DebouncedInput
                    type="number"
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                    value={(columnFilterValue as [number, number])?.[1] ?? ""}
                    onChange={(value) =>
                        column.setFilterValue((old: [number, number]) => [
                            old?.[0],
                            value,
                        ])
                    }
                    placeholder={`Max ${
                        column.getFacetedMinMaxValues()?.[1]
                            ? `(${column.getFacetedMinMaxValues()?.[1]})`
                            : ""
                    }`}
                    className="w-24 rounded border shadow"
                />
            </div>
            <div className="h-1" />
        </div>
    ) : (
        <>
            <datalist id={column.id + "list"}>
                {sortedUniqueValues.slice(0, 5000).map((value: any) => (
                    <option value={value} key={value} />
                ))}
            </datalist>
            <DebouncedInput
                type="text"
                value={(columnFilterValue ?? "") as string}
                onChange={(value) => column.setFilterValue(value)}
                placeholder={`Search... (${
                    column.getFacetedUniqueValues().size
                })`}
                className="w-36 rounded border shadow"
                list={column.id + "list"}
            />
            <div className="h-1" />
        </>
    );
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number;
    onChange: (value: string | number) => void;
    debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}

function usePageQueue(initial: number[]) {
    const data = useRef<number[]>(initial);
    const push = (_pages: number | number[]) => {
        const pages = Array.isArray(_pages) ? _pages : [_pages];
        if (!pages.length) return;
        let pagesAlreadyNextInQueue = true;
        for (let i = -1; i >= -pages.length; i--) {
            if (data.current.at(i) !== pages.at(i)) {
                pagesAlreadyNextInQueue = false;
                break;
            }
        }
        console.log({ data, pages, alreadyNext: pagesAlreadyNextInQueue });
        if (pagesAlreadyNextInQueue) return;
        data.current = data.current.filter((p) => !pages.includes(p));
        data.current.push(...pages);
        console.log("enqueuing", ...pages);
    };
    const pop = () => data.current.pop();

    const remove = (value: number) => {
        if (!data.current.includes(value)) return false;
        data.current = data.current.filter((x) => x !== value);
        return true;
    };
    const clear = () => {
        data.current = [];
    };

    const peek = () => data.current.at(-1);

    const has = (value: number) => data.current.includes(value);

    return {
        push,
        pop,
        clear,
        peek,
        data: data.current as readonly number[],
        has,
        remove,
    };
}

function pageOfRow(row: number) {
    if (row < PAGE_SIZE) {
        return 0;
    }
    const page = Math.floor(row / PAGE_SIZE);
    return page;
}

type HeaderSort = "none" | "asc" | "desc";

const stateMap = {
    none: {
        next: "asc",
        symbol: "o",
        sort: false,
    },
    asc: {
        next: "desc",
        symbol: "^",
        sort: "asc",
    },
    desc: {
        next: "none",
        symbol: "v",
        sort: "desc",
    },
} as const;

function HeaderSortIcon({
    setSort,
}: {
    setSort: (sort: SortDirection | false) => void;
}) {
    const [state, dispatch] = useReducer((state: HeaderSort) => {
        return stateMap[state].next;
    }, "none");

    const onClick = useCallback(() => {
        dispatch();
        setSort(stateMap[stateMap[state].next].sort);
    }, [state, setSort]);

    return (
        <button className="px-2" onClick={onClick}>
            {stateMap[state].symbol}
        </button>
    );
}

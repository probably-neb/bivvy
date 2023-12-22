"use client"

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import type {RouterOutputs} from "@/trpc/shared";

type Expense = RouterOutputs["expenses"]["list"]

const columns: ColumnDef<Expense>[] = [
    {
        cell: ({ row }) => row.index,
        accessorKey: "#",
        meta: {
            noSkeleton: true,
        },
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
    },
    {
        accessorKey: "id",
        header: "Id",
    },
    {
        accessorKey: "title",
        header: "Title",
    },
];

export function ExpensesTable() {
    return <DataTable columns={columns} />
}

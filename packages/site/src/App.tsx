import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import type {Todo} from "@paypals/core/todo";

const columns: ColumnDef<Todo>[] = [
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

function App() {

    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#145277] to-[#83D0CB]">
                <DataTable columns={columns} />
            </main>
        </>
    );
}

export default App;

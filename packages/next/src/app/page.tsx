import { ExpensesTable } from "./expenses-table";


export default function Page() {
    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#145277] to-[#83D0CB]">
                <ExpensesTable />
            </main>
        </>
    );
}

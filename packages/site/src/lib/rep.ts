import { Accessor, from } from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import {nanoid} from "nanoid";

import z from "zod";


export const ExpenseSchema = z.object({
    id: z.string(),
    payer: z.string().min(3),
    amount: z.number(),
    status: z.enum(["paid", "unpaid"]),
})

export type Expense = z.infer<typeof ExpenseSchema>;

export const ExpenseInputSchema = ExpenseSchema.omit({id: true, status: true});

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

const mutators = {
    addExpense: async (tx: WriteTransaction, info: {expense: ExpenseInput, id: string}) => {
        const expense: Expense = {
            ...info.expense,
            id: info.id,
            status: "unpaid",
        }
        await tx.set(`expense/${info.id}`, expense);
    }
}

const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;
console.log("license key", import.meta.env.VITE_rep_key);
export const rep = new Replicache({
    name: "nebcache",
    licenseKey,
    mutators
});

export function useExpenses() {
    const expenses = use(async (tx) => await tx.scan<Expense>({prefix: "expense/"}).values().toArray());
    console.log("got expenses", expenses());
    return expenses;
}

export async function addExpense(expense: ExpenseInput) {
    const id = nanoid();
    const e = {expense, id}
    console.log("adding expense", e);
    await rep.mutate.addExpense(e);

}

export function use<R>(getter: (tx: ReadTransaction) => Promise<R>) {
    const value: Accessor<R | undefined> = from((set) => {
        console.log("subscribing");
        return rep.subscribe(
            getter,
            (val) => {
                console.log("got value", val);
                // @ts-ignore
                set(val);
            },
        )
    })
    return value;
}

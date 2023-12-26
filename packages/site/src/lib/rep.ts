import { Accessor, from } from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { currentUser } from "./auth";

const NANOID_ID_LENGTH = 21;

const idSchema = z.string().length(NANOID_ID_LENGTH);

export const expenseSchema = z.object({
    id: idSchema,
    description: z.string(),
    paidBy: z.string(),
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: z.date().transform(dateToString).optional(),
    createdAt: z.date().transform(dateToString),
});

export type Expense = z.infer<typeof expenseSchema>;

export const expenseInputSchema = expenseSchema.omit({
    id: true,
    status: true,
    paidBy: true,
    createdAt: true,
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const userSchema = z.object({
    id: idSchema,
    name: z.string(),
});

export type User = z.infer<typeof userSchema>;

const mutators = {
    addExpense: async (tx: WriteTransaction, expense: Expense) => {
        await tx.set(`expense/${expense.id}`, expense);
    },
    deleteExpense: async (tx: WriteTransaction, id: Expense["id"]) => {
        await tx.del(`expense/${id}`);
    },
    addUser: async (tx: WriteTransaction, user: User) => {
        await tx.set(`user/${user.id}`, user);
    },
    removeUsers: async (tx: WriteTransaction) => {
        for await (const userId of tx
            .scan<string>({ prefix: "user/" })
            .keys()) {
            await tx.del(`user/${userId}`);
        }
    },
};

const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;

export const rep = new Replicache({
    name: "nebcache",
    licenseKey,
    mutators,
    indexes: {
        expensePaidBy: {
            prefix: "expense/",
            jsonPointer: "/paidBy",
        },
    },
    pushURL: import.meta.env.VITE_API_URL + "/push",
    // TODO: client id + auth (will involve waiting to create Replicache or recreating it on login)
});

export function useExpenses() {
    const expenses = use(
        async (tx) =>
            await tx.scan<Expense>({ prefix: "expense/" }).values().toArray(),
    );
    return expenses;
}

export function useExpense(id: Expense["id"]) {
    const expense = use(async (tx) => await tx.get<Expense>(`expense/${id}`));
    return expense;
}

export async function deleteExpense(id: Expense["id"]) {
    await rep.mutate.deleteExpense(id);
}

export async function addExpense(expense: ExpenseInput) {
    const id = nanoid();
    const currentUserId = currentUser().id;
    let e: Expense = Object.assign(
        expense,
        // second arg because these values should override expense values
        {
            createdAt: new Date().toUTCString(),
            paidOn: expense.paidOn && new Date(expense.paidOn).toUTCString(),
            status: "unpaid" as const,
            // FIXME: get current user id for payer
            paidBy: currentUserId,
            id,
        },
    );
    await rep.mutate.addExpense(e);
}

export async function addUser(user: User) {
    await rep.mutate.addUser(user);
}

export async function removeUsers() {
    await rep.mutate.removeUsers();
}

export function useUserExpenses(id: User["id"]) {
    // PERF: compare against filterAsyncIterator in Replicache (requires custom toArray impl)
    const expenses = use(async (tx) =>
        (
            await tx.scan<Expense>({ prefix: "expense/" }).values().toArray()
        ).filter((e) => e.paidBy === id),
    );
    return expenses;
}

export function useOtherUsers() {
    const users = use(
        async (tx) =>
            (await tx.scan<User>({ prefix: "user/" }).values().toArray()).filter(
            (u) => u.id !== currentUser().id,
        ),
    );
    return users;
}

export function useOwed() {
    // TODO: make this a stored value not computed (allow for server computation)
    const info = use(async (tx) => {
        const owe = {
            // Total amount owed to/by current user
            // +/- => owed to/by current user
                total: 0,
            // Map of user id to amount owed to/by to that user
            // +/- => owed to/by current user
                to: new Map<string, number>(),
        }
        // TODO: use clientId isntead of currentUser()
        const curUserId = currentUser().id;
        const otherUsers = (
            await tx.scan<User>({ prefix: "user/" }).values().toArray()
        ).filter((u) => u.id !== curUserId);
        for (const u of otherUsers) {
            owe.to.set(u.id, 0);
        }
        for await (const expense of tx
            .scan<Expense>({ prefix: "expense/" })
            .values()) {
            // TODO: implement splits
            const split = expense.amount / otherUsers.length;
            if (expense.paidBy === curUserId) {
                owe.total += expense.amount;
                for (const user of otherUsers) {
                    owe.to.set(
                        user.id,
                        (owe.to.get(user.id) ?? 0) + split,
                    );
                }
            } else {
                owe.total -= split;
                owe.to.set(
                    expense.paidBy,
                    (owe.to.get(expense.paidBy) ?? 0) - split,
                );
            }
        }
        return owe;
    });
    return info;
}

export function useUsers() {
    const users = use((tx) =>
        tx.scan<User>({ prefix: "user/" }).values().toArray(),
    );
    return users;
}

export function useUser(id: User["id"]) {
    const user = use(async (tx) => await tx.get<User>(`user/${id}`));
    return user;
}

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
export function use<R>(getter: (tx: ReadTransaction) => Promise<R>) {
    const value: Accessor<R | undefined> = from((set) => {
        return rep.subscribe(getter, (val) => {
            set(val as Exclude<R, Function>);
        });
    });
    return value;
}

function dateToString(d: Date) {
    return d.toISOString();
}

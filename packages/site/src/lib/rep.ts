import { Accessor, from, untrack } from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { currentUser, session } from "./auth";
import { unwrap } from "solid-js/store";

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
    owed: z.number().default(0),
});

export type User = z.infer<typeof userSchema>;

const P = {
    // return session group id but don't track changes to it
    gid: () => unwrap(session).currentGroupId,
    group: {
        prefix: `group/`,
        id(id: string) {
            return `${P.group.prefix}${id}`;
        },
    },
    expense: {
        prefix(groupId?: string) {
            const gid = groupId ?? P.gid();
            if (!gid) {
                throw new Error("No current groupId for expense path");
            }
            return `group-${gid}/expense/`;
        },
        id(groupId: string, expenseId?: Expense["id"]) {
            if (!expenseId) {
                expenseId = groupId;
                groupId = P.gid()!;
            }
            if (!groupId) {
                throw new Error("No current groupId for expense path");
            }
            return `${P.expense.prefix(groupId)}${expenseId}`;
        },
    },
    user: {
        prefix(groupId?: string) {
            const gid = groupId ?? P.gid();
            if (!gid) {
                throw new Error("No current groupId for user path");
            }
            return `group-${gid}/user/`;
        },
        id(groupId: string, userId?: User["id"]) {
            if (!userId) {
                userId = groupId;
                groupId = P.gid()!;
            }
            if (!groupId) {
                throw new Error("No current groupId for user path");
            }
            return `${P.user.prefix(groupId)}${userId}`;
        },
    },
};

const mutators = {
    addExpense: async (tx: WriteTransaction, expense: Expense) => {
        await tx.set(P.expense.id(expense.id), expense);
    },
    deleteExpense: async (tx: WriteTransaction, id: Expense["id"]) => {
        await tx.del(P.expense.id(id));
    },
    addUser: async (tx: WriteTransaction, user: User) => {
        await tx.set(P.user.id(user.id), user);
    },
    removeUsers: async (tx: WriteTransaction) => {
        for await (const userId of tx
            .scan<string>({ prefix: P.user.prefix() })
            .keys()) {
            await tx.del(P.user.id(userId));
        }
    },
    recomputeOwed: async (tx: WriteTransaction) => {
        const owe = {
            // Total amount owed to/by current user
            // +/- => owed to/by current user
            total: 0,
            // Map of user id to amount owed to/by to that user
            // +/- => owed to/by current user
            to: {} as { [id: User["id"]]: number },
        };
        // TODO: use clientId isntead of currentUser()
        const users = await tx
            .scan<User>({ prefix: P.user.prefix() })
            .values()
            .toArray();

        const curUserId = untrack(() => currentUser().id);
        let [[curUser], otherUsers] = filterSplit(
            users,
            (u) => u.id === curUserId,
        );

        for (const u of otherUsers) {
            owe.to[u.id] = 0;
        }

        for await (const expense of tx
            .scan<Expense>({ prefix: P.expense.prefix() })
            .values()) {
            // TODO: implement splits
            const split = expense.amount / otherUsers.length;
            if (expense.paidBy === curUserId) {
                owe.total += expense.amount;
                for (const user of otherUsers) {
                    owe.to[user.id] = owe.to[user.id] + split;
                }
            } else {
                owe.total -= split;
                owe.to[expense.paidBy] = owe.to[expense.paidBy] - split;
            }
        }
        console.log("recomputeOwed", owe);
        curUser = { ...curUser, owed: owe.total };
        await tx.set(P.user.id(curUserId), curUser);
        for (let user of otherUsers) {
            user = { ...user, owed: owe.to[user.id] };
            await tx.set(P.user.id(user.id), user);
        }
    },
};

const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;

export const rep = new Replicache({
    name: "nebcache",
    licenseKey,
    mutators,
    pushURL: import.meta.env.VITE_API_URL + "/push",
    pullURL: import.meta.env.VITE_API_URL + "/pull",
    // TODO: client id + auth (will involve waiting to create Replicache or recreating it on login)
});

export function useExpenses() {
    const expenses = use(
        async (tx) =>
            await tx
                .scan<Expense>({ prefix: P.expense.prefix() })
                .values()
                .toArray(),
    );
    return expenses;
}

export function useExpense(id: Expense["id"]) {
    const expense = use(async (tx) => await tx.get<Expense>(P.expense.id(id)));
    return expense;
}

export async function deleteExpense(id: Expense["id"]) {
    await rep.mutate.deleteExpense(id);
    await rep.mutate.recomputeOwed();
}

export async function addExpense(expense: ExpenseInput) {
    const id = nanoid();
    const currentUserId = untrack(() => currentUser().id);
    let e: Expense = {
        // copy because replicache responses are Readonly
        ...expense,
        createdAt: new Date().toUTCString(),
        paidOn: expense.paidOn ?? "",
        status: "unpaid" as const,
        paidBy: currentUserId,
        id,
    };
    await rep.mutate.addExpense(e);
    await rep.mutate.recomputeOwed();
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
            await tx
                .scan<Expense>({ prefix: P.expense.prefix() })
                .values()
                .toArray()
        ).filter((e) => e.paidBy === id),
    );
    return expenses;
}

export function useOtherUsers() {
    const users = use(async (tx) => {
        const cuid = untrack(() => currentUser().id);
        return (
            await tx.scan<User>({ prefix: P.user.prefix() }).values().toArray()
        ).filter((u) => u.id !== cuid);
    });
    return users;
}

type Owed = {
    total: number;
    to: { [id: User["id"]]: number };
};

function filterSplit<T>(a: T[], fn: (t: T) => boolean) {
    const yes: T[] = [];
    const no: T[] = [];
    for (const t of a) {
        if (fn(t)) {
            yes.push(t);
        } else {
            no.push(t);
        }
    }
    return [yes, no];
}

export function useOwed() {
    const info = use(async (tx) => {
        const owed: Owed = {
            total: 0,
            to: {},
        };
        const cuid = untrack(() => currentUser().id);
        for await (const user of tx
            .scan<User>({ prefix: P.user.prefix() })
            .values()) {
            if (user.id === cuid) {
                owed.total = user.owed ?? 0;
                continue;
            }
            owed.to[user.id] = user.owed ?? 0;
        }
        return owed;
    });
    return info;
}

export function useUsers() {
    const users = use((tx) =>
        tx.scan<User>({ prefix: P.user.prefix() }).values().toArray(),
    );
    return users;
}

export function useUser(id: User["id"]) {
    const user = use(async (tx) => await tx.get<User>(P.user.id(id)));
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

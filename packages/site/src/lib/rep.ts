import { Accessor, createMemo, from, untrack } from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { InitSession, session } from "@/lib/auth";
import { useMatch } from "@solidjs/router";
import { unwrap } from "solid-js/store";

const NANOID_ID_LENGTH = 21;

const idSchema = z.string().length(NANOID_ID_LENGTH);

export const expenseSchema = z.object({
    id: idSchema,
    description: z.string(),
    paidBy: z.string(),
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: z.number().optional(),
    createdAt: z.number(),
    groupId: z.string(),
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

function useGid() {
    console.log("currentGroupId");
    try {
        const groupMatch = useMatch(() => "group/:id/*");
        return groupMatch()?.params.id;
    } catch (e) {
        // ignored
    }
}

const P = {
    // return session group id but don't track changes to it
    group: {
        prefix: `group/`,
        id(id: string) {
            return `${P.group.prefix}${id}`;
        },
    },
    expense: {
        prefix(groupId: string) {
            return `group-${groupId}/expense/`;
        },
        id(groupId: string, expenseId: Expense["id"]) {
            return `${P.expense.prefix(groupId)}${expenseId}`;
        },
    },
    user: {
        prefix(groupId: string) {
            return `group-${groupId}/user/`;
        },
        id(groupId: string, userId: User["id"]) {
            return `${P.user.prefix(groupId)}${userId}`;
        },
    },
};

const mutators = {
    addExpense: async (tx: WriteTransaction, expense: Expense) => {
        await tx.set(P.expense.id(expense.groupId, expense.id), expense);
        const curUserId = unwrap(session).userId;
        const users = await tx
            .scan<User>({ prefix: P.user.prefix(expense.groupId) })
            .values()
            .toArray();
        let numUsers = users.length - 1;
        if (numUsers === 0) {
            numUsers = 1;
        }
        // FIXME: splits
        const portion = expense.amount / numUsers;
        if (expense.paidBy === curUserId) {
            const user = users.find((u) => u.id === expense.paidBy)!;
            if (!user) {
                return;
            }
            const owed = (user?.owed ?? 0) + expense.amount;
            await tx.set(P.user.id(expense.groupId, user.id), {
                ...user,
                owed,
            });
            return;
        }
        for (const user of users) {
            let owed = user.owed;
            if (user.id === curUserId) {
                owed = (owed ?? 0) + expense.amount;
            } else {
                owed = (owed ?? 0) - portion;
            }
            await tx.set(P.user.id(expense.groupId, user.id), {
                ...user,
                owed,
            });
        }
    },
    deleteExpense: async (
        tx: WriteTransaction,
        { groupId, id }: { groupId: Expense["groupId"]; id: Expense["id"] },
    ) => {
        await tx.del(P.expense.id(groupId, id));
        // FIXME: handle
        // FIXME: update owed
    },
    // recomputeOwed: async (tx: WriteTransaction) => {
    //     const owe = {
    //         // Total amount owed to/by current user
    //         // +/- => owed to/by current user
    //         total: 0,
    //         // Map of user id to amount owed to/by to that user
    //         // +/- => owed to/by current user
    //         to: {} as { [id: User["id"]]: number },
    //     };
    //     // TODO: use clientId isntead of currentUser()
    //     const users = await tx
    //         .scan<User>({ prefix: P.user.prefix() })
    //         .values()
    //         .toArray();
    //
    //     const curUserId = untrack(() => currentUser().id);
    //     let [[curUser], otherUsers] = filterSplit(
    //         users,
    //         (u) => u.id === curUserId,
    //     );
    //
    //     for (const u of otherUsers) {
    //         owe.to[u.id] = 0;
    //     }
    //
    //     const expenses = tx
    //         .scan<Expense>({ prefix: P.expense.prefix() })
    //         .values()
    //
    //     for await (const expense of expenses) {
    //         // TODO: implement splits
    //         const split = expense.amount / otherUsers.length;
    //         if (expense.paidBy === curUserId) {
    //             owe.total += expense.amount;
    //             for (const user of otherUsers) {
    //                 owe.to[user.id] = owe.to[user.id] + split;
    //             }
    //         } else {
    //             owe.total -= split;
    //             owe.to[expense.paidBy] = owe.to[expense.paidBy] - split;
    //         }
    //     }
    //     console.log("recomputeOwed", owe);
    //     curUser = { ...curUser, owed: owe.total };
    //     await tx.set(P.user.id(curUserId), curUser);
    //     for (let user of otherUsers) {
    //         user = { ...user, owed: owe.to[user.id] };
    //         await tx.set(P.user.id(user.id), user);
    //     }
    // },
};

// FIXME: move to a state store and create on login
// also create

export function initReplicache(s: InitSession) {
    const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;

    const rep = new Replicache({
        name: s.userId,
        auth: s.token,
        licenseKey,
        mutators,
        pushURL: import.meta.env.VITE_API_URL + "/push",
        pullURL: import.meta.env.VITE_API_URL + "/pull",
        // TODO: client id + auth (will involve waiting to create Replicache or recreating it on login)
    });
    return rep;
}

export type Rep = ReturnType<typeof initReplicache>;

export function useExpenses() {
    const expenses = use(
        async (tx, {groupId}) =>
            await tx
                .scan<Expense>({ prefix: P.expense.prefix(groupId) })
                .values()
                .toArray(),
    );
    return expenses;
}

export function useExpense(id: Expense["id"]) {
    const expense = use(async (tx, {groupId}) => await tx.get<Expense>(P.expense.id(groupId, id)));
    return expense;
}

export async function deleteExpense(id: Expense["id"]) {
    const groupId = useGid();
    const rep = unwrap(session).rep;
    if (!groupId || !rep) return;
    await rep.mutate.deleteExpense({groupId, id});
}

export async function addExpense(expense: ExpenseInput) {
    console.log("addExpense", expense)
    const s = unwrap(session);
    if (!s.valid) {
        console.log("not logged in");
        return
    };
    const id = nanoid();
    const curUserId = s.userId;
    if (!curUserId) {
        throw new Error("Not logged in");
    }
    console.log("paidOn", expense.paidOn, typeof expense.paidOn);
    let e: Expense = {
        // copy because replicache responses are Readonly
        ...expense,
        createdAt: new Date().getTime(),
        paidOn: expense.paidOn ?? -1,
        status: "unpaid" as const,
        paidBy: curUserId,
        id,
    };
    console.log("addExpense", e);
    await s.rep.mutate.addExpense(e);
}

export function useUserExpenses(id: User["id"]) {
    // PERF: compare against filterAsyncIterator in Replicache (requires custom toArray impl)
    const expenses = use(async (tx, {groupId}) =>
        (
            await tx
                .scan<Expense>({ prefix: P.expense.prefix(groupId) })
                .values()
                .toArray()
        ).filter((e) => e.paidBy === id),
    );
    return expenses;
}

export function useOtherUsers() {
    const users = use(async (tx, {groupId, userId}) => {
        return (
            await tx.scan<User>({ prefix: P.user.prefix(groupId) }).values().toArray()
        ).filter((u) => u.id !== userId);
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
    const info = use(async (tx, { groupId }) => {
        const owed: Owed = {
            total: 0,
            to: {},
        };
        const cuid = unwrap(session).userId;
        for await (const user of tx
            .scan<User>({ prefix: P.user.prefix(groupId) })
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
    const users = use((tx, { groupId }) => {
        const us = tx
            .scan<User>({ prefix: P.user.prefix(groupId) })
            .values()
            .toArray();
        console.log("users", us);
        return us;
    });
    return users;
}

export function useUser(id: User["id"]) {
    const user = use(
        async (tx, { groupId }) => await tx.get<User>(P.user.id(groupId, id)),
    );
    return user;
}

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
type Getter<R> = (
    tx: ReadTransaction,
    opts: { groupId: Expense["groupId"]; rep: Rep; userId: User["id"] },
) => Promise<R>;

export function use<R>(getter: Getter<R>) {
    const value: Accessor<R | undefined> = from((set) => {
        const userId = session.userId;
        const rep = session.rep;
        const groupId = useGid();
        if (!rep || !groupId || !userId) return () => {};
        console.log("use", { groupId, userId})
        return rep.subscribe(
            async (tx) => getter(tx, { groupId, rep, userId }),
            (val) => {
                set(val as Exclude<R, Function>);
            },
        );
    });
    return value;
}

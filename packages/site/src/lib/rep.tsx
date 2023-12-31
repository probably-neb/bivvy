import {
    Accessor,
    ParentProps,
    createContext,
    createEffect,
    createMemo,
    from,
    on,
} from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { InitSession } from "@/lib/auth";
import { useMatch } from "@solidjs/router";
import { createStore, reconcile } from "solid-js/store";

const NANOID_ID_LENGTH = 21;

const idSchema = z.string().length(NANOID_ID_LENGTH);

export const expenseSchema = z.object({
    id: idSchema,
    description: z.string(),
    paidBy: z.string(),
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: z.number().nullable(),
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
        const curUserId = expense.paidBy;
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
};

type Mutators = typeof mutators;

// FIXME: move to a state store and create on login
// also create

export function initReplicache(s: InitSession) {
    const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;

    const rep = new Replicache<Mutators>({
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

type TRep = {
    isInit: true;
    rep: Rep;
    userId: User["id"];
    groupId?: string;
};

// NOTE: for some reason mutations don't work when this state is in context only,
// and reads don't work when the state is in store only,
// so we have to use both (context derived from global store)
const [ctx, setCtx] = createStore<TRep | { isInit: false }>({ isInit: false });

const ReplicacheContext = createContext<TRep | { isInit: false }>({
    isInit: false,
});

export function ReplicacheContextProvider(
    props: ParentProps<{ session: Accessor<InitSession> }>,
) {
    createEffect(
        on(props.session, (s) => {
            setCtx(() => ({
                isInit: true,
                rep: initReplicache(s),
                userId: s.userId,
                groupId: undefined,
            }));
        }),
    );

    const groupMatch = useMatch(() => "group/:id/*");
    createEffect(
        on(groupMatch, (m) => {
            console.log("groupMatch", m);
            setCtx(() => ({
                groupId: m?.params.id,
            }));
        }),
    );

    return (
        <ReplicacheContext.Provider value={ctx}>
            {props.children}
        </ReplicacheContext.Provider>
    );
}
export async function deleteExpense(id: Expense["id"]) {
    if (!ctx.isInit) {
        throw new Error("Replicache not initialized");
    }
    if (!ctx.groupId) {
        throw new Error("Group not set");
    }
    await ctx.rep.mutate.deleteExpense({ groupId: ctx.groupId, id });
}

export async function addExpense(expense: ExpenseInput) {
    if (!ctx.isInit) {
        throw new Error("Replicache not initialized");
    }
    if (!ctx.groupId) {
        throw new Error("Group not set");
    }
    console.log("addExpense", ctx, expense);
    const id = nanoid();
    if (!ctx.userId) {
        throw new Error("Not logged in");
    }
    console.log("paidOn", expense.paidOn, typeof expense.paidOn);
    let e: Expense = {
        // copy because replicache responses are Readonly
        ...expense,
        createdAt: new Date().getTime(),
        paidOn: expense.paidOn ?? null,
        status: "unpaid" as const,
        paidBy: ctx.userId,
        groupId: ctx.groupId,
        id,
    };
    console.log("addExpense", e);
    await ctx.rep.mutate.addExpense(expenseSchema.parse(e));
}

export function useExpenses() {
    const expenses = use(async (tx, { groupId }) => {
        return await tx
            .scan<Expense>({ prefix: P.expense.prefix(groupId) })
            .values()
            .toArray();
    });
    return expenses;
}

export function useExpense(id: Expense["id"]) {
    const expense = use(
        async (tx, { groupId }) =>
            await tx.get<Expense>(P.expense.id(groupId, id)),
    );
    return expense;
}

export function useUserExpenses(id: User["id"]) {
    // PERF: compare against filterAsyncIterator in Replicache (requires custom toArray impl)
    const expenses = use(async (tx, { groupId }) =>
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
    const users = use(async (tx, { groupId, userId }) => {
        return (
            await tx
                .scan<User>({ prefix: P.user.prefix(groupId) })
                .values()
                .toArray()
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
    const info = use(async (tx, { groupId, userId }) => {
        const owed: Owed = {
            total: 0,
            to: {},
        };
        for await (const user of tx
            .scan<User>({ prefix: P.user.prefix(groupId) })
            .values()) {
            if (user.id === userId) {
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
        async (tx, { groupId }) => {
            const u = await tx.get<User>(P.user.id(groupId, id))
            console.log("user", u)
            return u;
        },
    );
    return user;
}

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
type Getter<R> = (
    tx: ReadTransaction,
    opts: { groupId: Expense["groupId"]; userId: User["id"] },
) => Promise<R>;

// FIXME: create version just for groups, this depends on both group and global replicache context
export function use<R>(getter: Getter<R>) {
    const ctxVals = createMemo(() => {
        console.log("ctxVals", ctx);
        if (!ctx.isInit) {
            return {
                isInit: false,
            } as const;
        }
        return {
            isInit: ctx.isInit,
            rep: ctx.rep,
            userId: ctx.userId,
            groupId: ctx.groupId,
        } as const;
    });

    const [value, setValue] = createStore<{value: R | undefined}>({value: undefined});

    createEffect(
        on(ctxVals, (ctx) => {
            const {isInit, groupId, userId, rep} = ctx;
            if (!isInit || !groupId) {
                console.log("not init")
                return
            }
            console.log("valMemo", ctx)
            const valInner: Accessor<R | undefined> = from(() => {
                const opts = { groupId, userId };
                console.log("use", opts);
                const unsub = rep.subscribe(
                    async (tx) => getter(tx, opts),
                    (val) => {
                        console.log("vals", val)
                        setValue("value", reconcile(val as Exclude<R, Function>));
                    },
                );
                return unsub;
            });
            return valInner;
        }),
    );

    // TODO: return store directly instead of pretending to be a signal
    return () => value.value;
}

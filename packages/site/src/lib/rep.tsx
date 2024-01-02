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

type TRep = {
    isInit: true;
    rep: Rep;
    userId: User["id"];
    groupId?: string;
};

// The replicache context is used to store the replicache instance and the some info
// from the current session

type Ctx = TRep | { isInit: false };
const [ctx, setCtx] = createStore<Ctx>({ isInit: false });

const ReplicacheContext = createContext<Ctx>({
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

// TODO: use rep ctx in zod validations for checking uniqueness, existence, etc

const NANOID_ID_LENGTH = 21;

// TODO: replace *Schema with z* for brevity
const idSchema = z.string().length(NANOID_ID_LENGTH);


export const groupSchema = z.object({
    name: z.string(),
    id: idSchema,
});
export type Group = z.infer<typeof groupSchema>;


export const userSchema = z.object({
    id: idSchema,
    name: z.string(),
    owed: z.number().default(0),
});
export type User = z.infer<typeof userSchema>;

const unixTimeSchema = z.number().int().min(0);

export const expenseSchema = z.object({
    id: idSchema,
    description: z.string(),
    paidBy: userSchema.shape.id,
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: unixTimeSchema.nullable().default(null),
    createdAt: unixTimeSchema,
    groupId: groupSchema.shape.id,
    splitId: idSchema
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseInputSchema = expenseSchema.pick({
    description: true,
    amount: true,
    paidOn: true,
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;


const percentSchema = z.number().gte(0.0).lte(1.0);

export const splitSchema = z.object({
    name: z.string(),
    id: idSchema,
    portions: z.record(userSchema.shape.id, percentSchema),
    createdAt: unixTimeSchema,
    groupId: groupSchema.shape.id,
})
export type Split = z.infer<typeof splitSchema>;

export const splitInputSchema = z.object({
    name: z.string(),
    portions: z.record(z.string(), z.number().gte(0.0).lte(1.0)),
});

export type SplitInput = z.infer<typeof splitInputSchema>;

const P = {
    // return session group id but don't track changes to it
    group: {
        prefix: `group/`,
        id(id: string) {
            return `${P.group.prefix}${id}`;
        },
    },
    expense: {
        prefix(groupId: Group["id"]) {
            return `group-${groupId}/expense/`;
        },
        id(groupId: Group["id"], expenseId: Expense["id"]) {
            return `${P.expense.prefix(groupId)}${expenseId}`;
        },
    },
    user: {
        prefix(groupId: Group["id"]) {
            return `group-${groupId}/user/`;
        },
        id(groupId: Group["id"], userId: User["id"]) {
            return `${P.user.prefix(groupId)}${userId}`;
        },
    },
    split: {
        prefix(groupId: Group["id"]) {
            return `group-${groupId}/split/`;
        },
        id(groupId: Group["id"], splitId: Split["id"]) {
            return `${P.split.prefix(groupId)}${splitId}`;
        }
    }
};

// NOTE: wrappers around these mutators are required because the mutators will be run by the server
// with the same arguments (this being the contents of the push request). For consistency we want
// the server and client to generate entities with the same IDs so the ID and other non-deterministic
// fields must be generated before being passed to mutator so the server has access to them as well
const mutators = {
    addExpense: async (tx: WriteTransaction, expense: Expense) => {
        await tx.set(P.expense.id(expense.groupId, expense.id), expense);
        const curUserId = expense.paidBy;
        const users = await tx
            .scan<User>({ prefix: P.user.prefix(expense.groupId) })
            .values()
            .toArray();
        let numUsers = users.length;
        if (numUsers === 0) {
            numUsers = 1;
        }
        // FIXME: splits
        const portion = expense.amount / numUsers;
        for (const user of users) {
            let owed = user.owed ?? 0;
            if (user.id === curUserId) {
                owed = owed + expense.amount - portion;
            } else {
                owed = owed + portion;
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
    createSplit: async (
        tx: WriteTransaction,
        split: Split
    ) => {
        await tx.set(P.split.id(split.groupId, split.id), split)
    }
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
    if (!ctx.userId) {
        throw new Error("Not logged in");
    }
    // TODO: consider sanity collision check
    const id = nanoid();
    console.log("paidOn", expense.paidOn, typeof expense.paidOn);
    // FIXME: use passed split id
    const evenlyId = "H05mUnfdhpIdJVbXFFGd7"
    let e: Expense = {
        // copy because replicache responses are Readonly
        ...expense,
        createdAt: new Date().getTime(),
        paidOn: expense.paidOn ?? null,
        status: "unpaid" as const,
        paidBy: ctx.userId,
        groupId: ctx.groupId,
        id,
        // TODO: use given split id
        splitId: evenlyId
    };
    console.log("addExpense", e);
    await ctx.rep.mutate.addExpense(expenseSchema.parse(e));
}

export async function createSplit(splitInput: SplitInput) {
    if (!ctx.isInit) {
        throw new Error("Replicache not initialized");
    }
    const groupId = ctx.groupId;
    if (!groupId) {
        throw new Error("Group not set");
    }
    const split: Split = Object.assign(
        {
            groupId,
            id: nanoid(),
            createdAt: new Date().getTime(),
        },
        splitInput
    )
    await ctx.rep.mutate.createSplit(splitSchema.parse(split))
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

            const valSignal: Accessor<R | undefined> = from(() => {
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
            // [ I THINK ] returning the signal is necessary here so that it is kept alive
            // and not cleaned up until next time this effect is ran (aka when the session context
            // changes). This happens because solid allows returning a value within an effect that
            // will be passed to the next run of the effect (aka persist the value)
            // consequently, the signal is kept alive until the next run of the effect and the
            // subscription is cleaned up when it should be (and not before!)
            return valSignal;
        }),
    );

    // TODO: return store directly instead of pretending to be a signal
    return () => value.value;
}

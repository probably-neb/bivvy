import {
    Accessor,
    ParentProps,
    createContext,
    createEffect,
    createMemo,
    from,
    on,
    useContext,
} from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { InitSession } from "@/lib/session";
import { useMatch } from "@solidjs/router";
import { createStore, reconcile } from "solid-js/store";
import { routes } from "@/index";
import { useSession, useUserId } from "./session";

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
    createSplit: async (tx: WriteTransaction, split: Split) => {
        await tx.set(P.split.id(split.groupId, split.id), split);
    },
};

type Mutators = typeof mutators;

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
        },
    },
};

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
    splitId: idSchema,
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseInputSchema = expenseSchema.pick({
    description: true,
    amount: true,
    paidOn: true,
    splitId: true,
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

const percentSchema = z.number().gte(0.0).lte(1.0);

const zHexString = z
    .string()
    .length(7)
    .regex(/^#[\da-fA-F]{6}/);

export const splitSchema = z.object({
    name: z.string(),
    id: idSchema,
    portions: z.record(userSchema.shape.id, percentSchema),
    createdAt: unixTimeSchema,
    groupId: groupSchema.shape.id,
    color: zHexString.nullable(),
});
export type Split = z.infer<typeof splitSchema>;

export const splitInputSchema = splitSchema.pick({
    name: true,
    portions: true,
    color: true,
});

export type SplitInput = z.infer<typeof splitInputSchema>;

// The replicache context is used to store the replicache instance and the some info
// from the current session

type MutationWrappers = {
    addExpense: (e: ExpenseInput) => Promise<void>;
    deleteExpense: (id: Expense["id"]) => Promise<void>;
    createSplit: (s: SplitInput) => Promise<void>;
};

const defualtMutations: MutationWrappers = {
    addExpense: async () => {},
    deleteExpense: async () => {},
    createSplit: async () => {},
};

type Ctx = [Accessor<Rep | null>, MutationWrappers];
const defaultCtx: Ctx = [() => null, defualtMutations];
const ReplicacheContext = createContext<Ctx>(defaultCtx);

export function ReplicacheContextProvider(props: ParentProps) {
    const [session] = useSession();
    const rep = createMemo(() => {
        if (!session.valid) {
            return null;
        }
        return initReplicache(session);
    });
    const groupId = useGroup();
    const userId = useUserId();

    const useCtx = createMemo(() => {
        if (!rep() || !groupId() || !userId()) {
            return {
                isInit: false as const,
            };
        }
        return {
            isInit: true as const,
            rep: rep()!,
            groupId: groupId()!,
            userId: userId()!,
        };
    });

    const mutations = {
        async addExpense(expense: ExpenseInput) {
            const ctx = useCtx();
            if (!ctx.isInit) {
                throw new Error("Replicache not initialized");
            }
            if (!ctx.groupId) {
                throw new Error("Group not set");
            }
            console.log("addExpense", expense);
            if (!ctx.userId) {
                throw new Error("Not logged in");
            }
            // TODO: consider sanity collision check
            const id = nanoid();
            console.log("paidOn", expense.paidOn, typeof expense.paidOn);
            // FIXME: use passed split id
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
            await rep()!.mutate.addExpense(expenseSchema.parse(e));
        },
        async deleteExpense(id: Expense["id"]) {
            const ctx = useCtx();
            if (!ctx.isInit) {
                throw new Error("Replicache not initialized");
            }
            if (!ctx.groupId) {
                throw new Error("Group not set");
            }
            await ctx.rep.mutate.deleteExpense({ groupId: ctx.groupId, id });
        },
        async createSplit(splitInput: SplitInput) {
            const ctx = useCtx();
            if (!ctx.rep) {
                throw new Error("Replicache not initialized");
            }
            if (!ctx.groupId) {
                throw new Error("Group not set");
            }
            const split: Split = Object.assign(
                {
                    groupId: ctx.groupId,
                    id: nanoid(),
                    createdAt: new Date().getTime(),
                },
                splitInput,
            );
            await ctx.rep.mutate.createSplit(splitSchema.parse(split));
        },
    };

    return (
        <ReplicacheContext.Provider value={[rep, mutations]}>
            {props.children}
        </ReplicacheContext.Provider>
    );
}

function useRep() {
    return useContext(ReplicacheContext)[0];
}

export function useMutations() {
    return useContext(ReplicacheContext)[1];
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

export function useExpense(id: Accessor<Expense["id"]>) {
    const expense = useWithOpts(
        id,
        async (tx, id, { groupId }) =>
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
        return us;
    });
    return users;
}

export function useUser(id: Accessor<User["id"]>) {
    const user = useWithOpts(id, async (tx, id, { groupId }) => {
        const u = await tx.get<User>(P.user.id(groupId, id));
        return u;
    });
    return user;
}

export function useSplits() {
    const splits = use(async (tx, { groupId }) => {
        return await tx
            .scan<Split>({ prefix: P.split.prefix(groupId) })
            .values()
            .toArray();
    });
    return splits;
}

export function useSplit(id: Accessor<Split["id"]>) {
    const split = useWithOpts(id, async (tx, id, { groupId }) => {
        return await tx.get<Split>(P.split.id(groupId, id));
    });
    return split;
}

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
type Getter<R> = (
    tx: ReadTransaction,
    opts: { groupId: Expense["groupId"]; userId: User["id"] },
) => Promise<R>;

export function use<R>(getter: Getter<R>) {
    const ctxVals = createMemo(() => {
        const rep = useRep();
        const groupId = useGroup();
        const userId = useUserId();
        if (!rep() || !groupId() || !userId()) {
            console.log("not init", {
                rep: rep(),
                groupId: groupId(),
                userId: userId(),
            });
            return {
                isInit: false,
            } as const;
        }
        return {
            isInit: true,
            rep: rep()!,
            userId: userId()!,
            groupId: groupId()!,
        } as const;
    });

    const [value, setValue] = createStore<{ value: R | undefined }>({
        value: undefined,
    });

    createEffect(
        on(ctxVals, (ctx) => {
            const { isInit, groupId, userId, rep } = ctx;
            if (!isInit || !groupId) {
                console.log("not init");
                return;
            }

            const valSignal: Accessor<R | undefined> = from(() => {
                const opts = { groupId, userId };
                const unsub = rep.subscribe(
                    async (tx) => getter(tx, opts),
                    (val) => {
                        setValue(
                            "value",
                            reconcile(val as Exclude<R, Function>),
                        );
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

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
type GetterWithOpts<Opts, Result> = (
    tx: ReadTransaction,
    opts: Opts,
    ctx: { groupId: Expense["groupId"]; userId: User["id"] },
) => Promise<Result>;

// params to use* hooks are not tracked when used in component body because it is not a tracking scope
// by passing a closure with the options we can make the hooks reactive because we use the closure in a
// tracking scope in this utility function
export function useWithOpts<Opts, Result>(getOpts: Accessor<Opts>, getter: GetterWithOpts<Opts, Result>) {
    const ctxVals = createMemo(() => {
        const rep = useRep();
        const groupId = useGroup();
        const userId = useUserId();
        if (!rep() || !groupId() || !userId()) {
            console.log("not init", {
                rep: rep(),
                groupId: groupId(),
                userId: userId(),
            });
            return {
                isInit: false,
            } as const;
        }
        return {
            isInit: true,
            rep: rep()!,
            userId: userId()!,
            groupId: groupId()!,
        } as const;
    });

    // while there will be inherently some overhead to using a store to save the
    // values returned by replicache (replicache docs explicitly state values returned
    // by subscribe should just be used directly), however, this is working...
    // and as a bonus we get to use the reconcile function for truly fine grained
    // reactivity
    // the overhead of this should be monitored especially with a large number of
    // expenses
    const [value, setValue] = createStore<{ value: Result | undefined }>({
        value: undefined,
    });


    createEffect(
        on([ctxVals, getOpts], ([ctx, opts]) => {
            const { isInit, groupId, userId, rep } = ctx;
            if (!isInit || !groupId) {
                console.log("not init");
                return;
            }

            const valSignal: Accessor<Result | undefined> = from(() => {
                const subCtx = { groupId, userId };
                const unsub = rep.subscribe(
                    async (tx) => getter(tx, opts, subCtx),
                    (val) => {
                        setValue(
                            "value",
                            reconcile(val as Exclude<Result, Function>),
                        );
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

function useGroup() {
    const groupMatch = useMatch(() => routes.group(":id") + "/*");
    const id = createMemo(() => groupMatch()?.params.id);
    return id;
}

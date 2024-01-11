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
import { routes } from "@/routes";
import { useSession, useUserId } from "./session";

// NOTE: wrappers around these mutators are required because the mutators will be run by the server
// with the same arguments (this being the contents of the push request). For consistency we want
// the server and client to generate entities with the same IDs so the ID and other non-deterministic
// fields must be generated before being passed to mutator so the server has access to them as well
const mutators = {
    addExpense: async (tx: WriteTransaction, expense: Expense) => {
        await tx.set(P.expense.id(expense.groupId, expense.id), expense);
        const curUserId = expense.paidBy;
        const groupUsers = await tx
            .scan<GroupUser>({ prefix: P.groupUser.prefix(expense.groupId) })
            .values()
            .toArray();
        let numUsers = groupUsers.length;
        if (numUsers === 0) {
            numUsers = 1;
        }
        // FIXME: splits
        const portion = expense.amount / numUsers;
        for (const user of groupUsers) {
            let owed = user.owed ?? 0;
            if (user.userId === curUserId) {
                owed = owed + expense.amount - portion;
            } else {
                owed = owed + portion;
            }
            await tx.set(P.groupUser.id(expense.groupId, user.userId), {
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
        // FIXME: handle side effects
        // FIXME: update owed
    },
    createSplit: async (tx: WriteTransaction, split: Split) => {
        await tx.set(P.split.id(split.groupId, split.id), split);
    },
    createGroup: async (tx: WriteTransaction, input: CreateGroupInput) => {
        const [group, { defaultSplitId, ownerId }] = removeKeys(input, [
            "defaultSplitId",
            "ownerId",
        ]) satisfies readonly [Group, any];
        tx.set(P.group.id(group.id), group);
        tx.set(P.groupUser.id(group.id, ownerId), {
            userId: ownerId,
            owed: 0,
        });
        // TODO: handle invites when creating group so default split can be accurate
        const split = createEvenSplit([ownerId], defaultSplitId, group.id);
        tx.set(P.split.id(group.id, split.id), split);
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

// TODO: refactor into set, get, getAll that take Transactions and give type safe result
// also create filter option that doesn't copy (may need to be called separately but having
// it here would be nice)
const P = {
    // return session group id but don't track changes to it
    group: {
        prefix: `groups/`,
        id(id: string) {
            return `${P.group.prefix}${id}`;
        },
    },
    expense: {
        prefix(groupId: Group["id"]) {
            return `group/${groupId}/expense/`;
        },
        id(groupId: Group["id"], expenseId: Expense["id"]) {
            return `${P.expense.prefix(groupId)}${expenseId}`;
        },
    },
    groupUser: {
        prefix(groupId: Group["id"]) {
            return `group/${groupId}/user/`;
        },
        id(groupId: Group["id"], userId: User["id"]) {
            return `${P.groupUser.prefix(groupId)}${userId}`;
        },
    },
    user: {
        prefix: `user/`,
        id(userId: User["id"]) {
            return `${P.user.prefix}${userId}`;
        },
    },
    split: {
        prefix(groupId: Group["id"]) {
            return `group/${groupId}/split/`;
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
});
export type User = z.infer<typeof userSchema>;

export const groupUserSchema = z.object({
    userId: userSchema.shape.id,
    owed: z.number().default(0),
});
export type GroupUser = z.infer<typeof groupUserSchema>;

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

const createGroupInputSchema = groupSchema.extend({
    ownerId: userSchema.shape.id,
    defaultSplitId: splitSchema.shape.id,
});

type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

export const groupInputSchema = groupSchema.pick({
    name: true,
});

export type GroupInput = z.infer<typeof groupInputSchema>;

// The replicache context is used to store the replicache instance and the some info
// from the current session

type MutationWrappers = {
    addExpense: (e: ExpenseInput) => Promise<void>;
    deleteExpense: (id: Expense["id"]) => Promise<void>;
    createSplit: (s: SplitInput) => Promise<void>;
    createGroup: (name: Group["name"]) => Promise<void>;
};

const defualtMutations: MutationWrappers = {
    addExpense: async () => {},
    deleteExpense: async () => {},
    createSplit: async () => {},
    createGroup: async () => {},
};

type Ctx = [Accessor<Rep | null>, MutationWrappers];
const defaultCtx: Ctx = [() => null, defualtMutations];
const ReplicacheContext = createContext<Ctx>(defaultCtx);

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};
type Optional<T, Keys extends keyof T> = Simplify<
    Omit<T, Keys> & Partial<Pick<T, Keys>>
>;

export function ReplicacheContextProvider(props: ParentProps) {
    const [session] = useSession();
    const rep = createMemo(() => {
        if (!session.valid) {
            return null;
        }
        return initReplicache(session);
    });
    const groupId = useGroupId();
    const userId = useUserId();

    const useCtx = createMemo(() => {
        if (!rep()) {
            return {
                isInit: false as const,
            };
        }
        if (!userId()) {
            throw new Error("not logged in");
        }
        return {
            isInit: true as const,
            rep: rep()!,
            groupId: groupId(),
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
            // TODO: consider sanity collision check
            const id = nanoid();
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
            if (!ctx.isInit) {
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
        async createGroup(name: Group["name"]) {
            const ctx = useCtx();
            if (!ctx.isInit) {
                throw new Error("Replicache not initialized");
            }
            const group: CreateGroupInput = Object.assign(
                { name },
                {
                    id: nanoid(),
                    ownerId: ctx.userId,
                    defaultSplitId: nanoid(),
                },
            );
            await ctx.rep.mutate.createGroup(
                createGroupInputSchema.parse(group),
            );
        },
    };

    return (
        <ReplicacheContext.Provider value={[rep, mutations]}>
            {props.children}
        </ReplicacheContext.Provider>
    );
}

export function useRep() {
    return useContext(ReplicacheContext)[0];
}

export function useMutations() {
    return useContext(ReplicacheContext)[1];
}

export function useGroups() {
    return use(
        (tx) => tx.scan<Group>({ prefix: P.group.prefix }).values().toArray(),
        false,
    );
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

export function useNumUsers(group?: Accessor<Group["id"]>) {
    const groupId = useGroupId(group);
    const len = useWithOpts(groupId, (tx, groupId) =>
        groupUsers(tx, groupId).then(
            (us) => us.length
        ),
    );
    return len;
}

export function useOtherUsers(group?: Accessor<Group["id"]>) {
    const groupId = useGroupId(group);
    const users = useWithOpts(groupId, async (tx, groupId, { userId }) => {
        return groupUsers(tx, groupId).then((us) =>
            us.filter((u) => u.id !== userId),
        );
    });
    return users;
}

async function groupUsers(tx: ReadTransaction, groupId: Group["id"]) {
    let gids = await tx
        .scan({ prefix: P.groupUser.prefix(groupId) })
        .keys()
        .toArray();
    gids = gids.map((id) => id.split("/").at(-1)!);
    return tx
        .scan<User>({ prefix: P.user.prefix })
        .values()
        .toArray()
        .then((us) => us.filter((u) => gids.includes(u.id)));
}

export type Owed = {
    total: number;
    to: { [id: User["id"]]: number };
};

export function useOwed() {
    const info = use(async (tx, { groupId, userId }) => {
        const owed: Owed = {
            total: 0,
            to: {},
        };
        for await (const gu of tx
            .scan<GroupUser>({ prefix: P.groupUser.prefix(groupId) })
            .values()) {
            if (gu.userId === userId) {
                owed.total = gu.owed ?? 0;
                continue;
            }
            owed.to[gu.userId] = gu.owed ?? 0;
        }
        console.log("owed", owed);
        return owed;
    });
    return info;
}

export function useUsers(group?: Accessor<Group["id"]>) {
    const groupId = useGroupId(group);
    const users = useWithOpts(groupId, async (tx, groupId) => {
        return groupUsers(tx, groupId);
    });
    return users;
}

export function useUser(
    userId: Accessor<User["id"]>,
    group?: Accessor<Group["id"]>,
) {
    const groupId = useGroupId(group);
    const opts = createMemo(() => ({ groupId: groupId(), userId: userId() }));
    const user = useWithOpts(opts, async (tx, { userId }) => {
        const u = await tx.get<User>(P.user.id(userId));
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
type Getter<R, WithGroupId> = (
    tx: ReadTransaction,
    opts: {
        groupId: WithGroupId extends true ? Expense["groupId"] : undefined;
        userId: User["id"];
    },
) => Promise<R>;

// this mumbo jumbo makes it so if you pass false as the second arg to use the current group id won't be null asserted
// and you'll get a typesafe result
export function use<R, W extends false>(
    g: Getter<R, W>,
    withGroupId: false,
): Accessor<R | undefined>;
export function use<R, W extends true>(
    g: Getter<R, W>,
    withGroupId?: true | undefined,
): Accessor<R | undefined>;
export function use<R, W extends true | false>(
    getter: Getter<R, W>,
    withGroupId?: true | false,
) {
    const ctxVals = createMemo(() => {
        const rep = useRep();
        const groupId = useGroupId();
        const userId = useUserId();
        if (!rep() || !userId()) {
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
            groupId: groupId(),
        } as const;
    });

    const [value, setValue] = createStore<{ value: R | undefined }>({
        value: undefined,
    });

    createEffect(
        on(ctxVals, (ctx) => {
            const { isInit, groupId, userId, rep } = ctx;
            if (!isInit || (!groupId && withGroupId !== false)) {
                console.log("not init");
                return;
            }

            const valSignal: Accessor<R | undefined> = from(() => {
                const opts = { groupId, userId };
                const unsub = rep.subscribe(
                    async (tx) =>
                        getter(
                            tx,
                            opts as {
                                groupId: W extends true ? string : undefined;
                                userId: string;
                            },
                        ),
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
export function useWithOpts<Opts, Result>(
    getOpts: Accessor<Opts>,
    getter: GetterWithOpts<Opts, Result>,
) {
    const ctxVals = createMemo(() => {
        const rep = useRep();
        const groupId = useGroupId();
        const userId = useUserId();
        if (!rep() || !userId()) {
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
            if (!isInit) {
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

function useGroupId(group?: Accessor<Group["id"]>) {
    const groupMatch = useMatch(() => routes.group(":id") + "/*");
    const id = createMemo(() => {
        if (group) {
            return group();
        }
        const id = groupMatch()?.params.id;
        // TODO: how to handle?
        return id!;
    });
    return id;
}

function createEvenSplit(userIds: string[], splitId: string, groupId: string) {
    const portions: Split["portions"] = {};
    const percentage = 1.0 / userIds.length;
    for (const id of userIds) {
        portions[id] = percentage;
    }
    return {
        id: splitId,
        portions,
        name: "Even Split",
        groupId,
        color: null,
        // TODO: use this in backend
        createdAt: new Date().getTime(),
    } satisfies Split;
}

function removeKeys<T, K extends keyof T>(obj: T, keys: K[]) {
    const copy = { ...obj };
    const removed = {} as Pick<T, K>;
    for (const key of keys) {
        removed[key] = copy[key];
        delete copy[key];
    }
    return [
        copy as Simplify<Omit<T, K>>,
        removed as Simplify<Pick<T, K>>,
    ] as const;
}

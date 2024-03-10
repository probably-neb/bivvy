import {
    Accessor,
    ParentProps,
    createContext,
    createEffect,
    createResource,
    createMemo,
    from,
    on,
    useContext,
    Signal,
    createSignal,
} from "solid-js";
import { ReadTransaction, Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

import z from "zod";
import { InitSession } from "@/lib/session";
import { createStore, reconcile } from "solid-js/store";
import { useSession, useUserId } from "./session";
import { useCurrentGroupId } from "./group";
import { removeKeys } from "./utils";

function assert(value: unknown, message?: string): asserts value {
    if (value)
        return
    console.assert(value, message)
    throw new Error(`Assertion Error: ${message ?? ""} -- ${value} is Falsy`)
}

// NOTE: wrappers around these mutators are required because the mutators will be run by the server
// with the same arguments (this being the contents of the push request). For consistency we want
// the server and client to generate entities with the same IDs so the ID and other non-deterministic
// fields must be generated before being passed to mutator so the server has access to them as well
const mutators = {
    async addExpense(tx: WriteTransaction, expense: Expense) {
        await tx.set(P.expense.id(expense.groupId, expense.id), expense);
        await createExpenseSideEffects(tx, expense);
    },
    async deleteExpense(
        tx: WriteTransaction,
        o: {
            groupId: Expense["groupId"];
            id: Expense["id"];
            userId: User["id"];
        },
    ) {
        const expense = await tx.get<Expense>(P.expense.id(o.groupId, o.id));
        if (!expense) {
            throw new Error("expense not found");
        }
        if (expense.paidBy !== o.userId) {
            throw new Error("Cannot delete other users expenses");
        }
        await cleanupExpenseSideEffects(tx, expense, o.groupId);
        await tx.del(P.expense.id(o.groupId, o.id));
    },
    async expenseEdit(tx: WriteTransaction, e: Expense) {
        await tx.set(P.expense.id(e.groupId, e.id), e);
        await cleanupExpenseSideEffects(tx, e, e.groupId);
        await createExpenseSideEffects(tx, e);
    },
    async createSplit(tx: WriteTransaction, split: Split) {
        await tx.set(P.split.id(split.groupId, split.id), split);
    },
    async splitEdit(tx: WriteTransaction, split: Split) {
        await tx.set(P.split.id(split.groupId, split.id), split);
    },
    async createGroup(tx: WriteTransaction, input: CreateGroupInput) {
        const [group, { defaultSplitId }] = removeKeys(input, [
            "defaultSplitId",
        ]) satisfies readonly [Group, any];
        tx.set(P.group.id(group.id), group);
        tx.set(P.groupUser.id(group.id, group.ownerId), {
            userId: group.ownerId,
            owed: 0,
        });
    },
    async groupEdit(tx: WriteTransaction, group: Group) {
        const existing = await tx.get<Group>(P.group.id(group.id))
        if (existing == null) {
            throw new Error(`no group with id: ${group.id}`)
        }
        assert(existing.ownerId)
        await tx.set(P.group.id(group.id), group)
    },
    async createInvite(tx: WriteTransaction, invite: Invite) {
        tx.set(P.invite.id(invite.id), invite);
    },
    async acceptInvite(tx: WriteTransaction, inviteId: Invite["id"]) {
        const invite = await tx.get<Invite>(P.invite.id(inviteId));
        const updated = {
            ...invite,
            id: inviteId,
            accepted: true,
            acceptedAt: new Date().getTime(),
        };
        tx.set(P.invite.id(inviteId), updated);
    },
};

async function createExpenseSideEffects(
    tx: WriteTransaction,
    expense: Expense,
) {
    const groupId = expense.groupId;
    const curUserId = expense.paidBy;
    const split = await tx.get<Split>(P.split.id(groupId, expense.splitId));
    if (!split) {
        throw new Error("split not found");
    }
    await updateOwed(tx, curUserId, groupId, expense.amount, split.portions);
}

async function cleanupExpenseSideEffects(
    tx: WriteTransaction,
    expense: Expense,
    groupId: Group["id"],
) {
    let split = await tx.get<Split>(P.split.id(groupId, expense.splitId));
    if (!split) {
        // FIXME: uncomment
        // throw new Error("split not found");
        const userIds = await groupUserIds(tx, groupId);
        split = createEvenSplit(userIds, expense.splitId, groupId);
    }
    const total = -expense.amount;
    await updateOwed(tx, expense.paidBy, groupId, total, split.portions);
}

async function updateOwed(
    tx: WriteTransaction,
    paidById: string,
    groupId: string,
    total: number,
    portions: Split["portions"],
) {
    const groupUsers = await tx
        .scan<GroupUser>({ prefix: P.groupUser.prefix(groupId) })
        .values()
        .toArray();
    const totalParts = Math.max(
        Math.abs(Object.values(portions).reduce((a, b) => a + b, 0)),
        1.0,
    );
    for (const user of groupUsers) {
        const portion = (total * (portions[user.id] ?? 0)) / totalParts;
        let owed = user.owed ?? 0;
        if (user.id === paidById) {
            owed = owed + total - portion;
        } else {
            owed = owed + portion;
        }
        await tx.set(P.groupUser.id(groupId, user.id), {
            ...user,
            owed,
        });
    }
}

type Mutators = typeof mutators;

export function initReplicache(s: InitSession) {
    const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;
    const IS_LOCAL = import.meta.env.VITE_IS_LOCAL === "true";
    const logLevel = IS_LOCAL ? "debug" : "error";

    const rep = new Replicache<Mutators>({
        name: s.userId,
        auth: `Bearer ${s.token}`,
        licenseKey,
        mutators,
        pushURL: import.meta.env.VITE_API_URL + "/push",
        pullURL: import.meta.env.VITE_API_URL + "/pull",
        logLevel,
        // TODO: client id + auth (will involve waiting to create Replicache or recreating it on login)
    });
    return rep;
}

export type Rep = ReturnType<typeof initReplicache>;

function useIsClosed() {
    return useContext(ReplicacheContext)[2][0];
}

export function closeRep() {
    const [rep, _, [_closed, setClosed]] = useContext(ReplicacheContext);
    rep()?.close();
    // FIXME: use still logging "not init" after closing (logging out)
    setClosed(true);
}

export const INVITE_PREFIX = "invite";


async function acceptPendingInvites(rep: Rep) {
    // TODO: scan for multiple invites just in case?
    // FIXME: NOT WORKING IN PROD

    // get all invites
    const invites = new Array<[string, string]>();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key == null || !key.startsWith(INVITE_PREFIX)) {
            continue;
        }
        const invite = localStorage.getItem(key);
        if (!invite) {
            console.log(`invite with key: '${key}' was null`);
            continue;
        }
        invites.push([key, invite]);
    }

    const acceptTasks = invites.map(async ([key, invite]) => {
        await rep.mutate.acceptInvite(invite);
        localStorage.removeItem(key);
        console.log("accepted invite", key);
        return invite;
    });
    const results = await Promise.allSettled(acceptTasks);
    if (results.length != 0) {
        await rep.pull();
    }
    return results;
}

// TODO: refactor into set, get, getAll that take Transactions and give type safe result
// also create filter option that doesn't copy (may need to be called separately but having
// it here would be nice)
const P = {
    currentUserID: "userID",
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
    invite: {
        prefix: `invite/`,
        id(inviteId: Invite["id"]) {
            return `${P.invite.prefix}${inviteId}`;
        },
    },
};

// TODO: use rep ctx in zod validations for checking uniqueness, existence, etc

const NANOID_ID_LENGTH = 21;

// TODO: replace *Schema with z* for brevity
const zID = z.string().length(NANOID_ID_LENGTH);
const zUnixTime = z.number().int().min(0);

const zHexString = z
    .string()
    .length(7)
    .regex(/^#[\da-fA-F]{6}/);

export const groupSchema = z.object({
    name: z.string(),
    id: zID,
    pattern: z.string().nullable(),
    color: zHexString.nullable(),
    createdAt: zUnixTime,
    ownerId: zID
});
export type Group = z.infer<typeof groupSchema>;

export const userSchema = z.object({
    id: zID,
    name: z.string(),
    profileUrl: z.string().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const groupUserSchema = z.object({
    id: userSchema.shape.id,
    owed: z.number().default(0),
});
export type GroupUser = z.infer<typeof groupUserSchema>;


export const expenseSchema = z.object({
    id: zID,
    description: z.string(),
    paidBy: userSchema.shape.id,
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: zUnixTime.nullable().default(null),
    createdAt: zUnixTime,
    groupId: groupSchema.shape.id,
    splitId: zID,
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseInputSchema = expenseSchema.pick({
    description: true,
    amount: true,
    paidOn: true,
    splitId: true,
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

const portionSchema = z.number().gte(0.0);

export const splitSchema = z.object({
    name: z.string().min(1),
    id: zID,
    portions: z.record(userSchema.shape.id, portionSchema),
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
    pattern: true,
    color: true
});

export type GroupInput = z.infer<typeof groupInputSchema>;

export const inviteSchema = z.object({
    id: zID,
    groupId: groupSchema.shape.id,
    createdAt: zUnixTime,
    acceptedAt: zUnixTime.nullable(),
});

export type Invite = z.infer<typeof inviteSchema>;

export const inviteInputSchema = inviteSchema.pick({
    id: true,
    groupId: true,
});

export type InviteInput = z.infer<typeof inviteInputSchema>;

interface MutationMap extends Record<keyof Mutators, any> {}

interface MutationWrapperInputs extends MutationMap {
    addExpense: ExpenseInput;
    deleteExpense: Expense["id"];
    createSplit: SplitInput;
    createGroup: GroupInput;
    createInvite: InviteInput;
    markInviteAccepted: Invite["id"];
}

type Mutation<M extends keyof Mutators> = (
    input: MutationWrapperInputs[M],
) => Promise<void>;

type MutationWrappers = {
    [key in keyof Mutators]: Mutation<key>;
};

const defualtMutations: MutationWrappers = Object.fromEntries(
    Object.keys(mutators).map((k) => [k, async () => {}]),
) as MutationMap;

type Ctx = [Accessor<Rep | null>, MutationWrappers, Signal<boolean>];
const defaultCtx: Ctx = [() => null, defualtMutations, [() => true, () => {}]];
const ReplicacheContext = createContext<Ctx>(defaultCtx);

export function ReplicacheContextProvider(props: ParentProps) {
    const [session] = useSession();
    const closed = createSignal(true);
    const rep = createMemo(() => {
        if (!session.valid) {
            return null;
        }
        closed[1](false)
        return initReplicache(session);
    });

    const [acceptedInvites] = createResource(rep, (rep) =>
        acceptPendingInvites(rep),
    );
    createEffect(
        on(acceptedInvites, (results) => {
            if (results == null) {
                return;
            }
            console.log("invite results: ", results);
        }),
    );

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
            groupId: groupId() as string | undefined,
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
            await rep()!.mutate.addExpense(expenseSchema.parse(e));
        },
        async deleteExpense(id: Expense["id"]) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            assert(ctx.groupId, "Group not set");
            await ctx.rep.mutate.deleteExpense({
                groupId: ctx.groupId,
                id,
                userId: ctx.userId,
            });
        },
        async expenseEdit(expense: Expense) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            await ctx.rep.mutate.expenseEdit(expenseSchema.parse(expense));
        },
        async createSplit(splitInput: SplitInput) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            if (!ctx.groupId) {
                throw new Error("Group not set");
            }
            const split: Split = Object.assign(
                {
                    groupId: ctx.groupId,
                    id: nanoid(),
                    createdAt: Date.now()
                },
                splitInput,
            );
            await ctx.rep.mutate.createSplit(splitSchema.parse(split));
        },
        async splitEdit(split: Split) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            await ctx.rep.mutate.splitEdit(splitSchema.parse(split));
        },
        async createGroup(groupInput: GroupInput) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            const group: CreateGroupInput = Object.assign(
                {
                    id: nanoid(),
                    ownerId: ctx.userId,
                    defaultSplitId: nanoid(),
                    pattern: null,
                    color: null,
                    createdAt: Date.now()
                },
                groupInput,
            );
            await ctx.rep.mutate.createGroup(
                createGroupInputSchema.parse(group),
            );
        },
        async groupEdit(group: Group) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            await ctx.rep.mutate.groupEdit(groupSchema.parse(group));
        },
        async createInvite(i: InviteInput) {
            // FIXME: separate created invites and recieved invites
            // created has recieved/accepted by map
            // recieved has accepted bool
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            assert(i.groupId, "Group not set in invte")
            assert(i.id, "no invite id")
            const invite = Object.assign({}, i, {
                createdAt: new Date().getTime(),
                acceptedAt: null,
            }) satisfies Invite;
            await ctx.rep.mutate.createInvite(inviteSchema.parse(invite));
        },
        async acceptInvite(id: Invite["id"]) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            await ctx.rep.mutate.acceptInvite(id);
        },
    } satisfies MutationWrappers;

    return (
        <ReplicacheContext.Provider value={[rep, mutations, closed]}>
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

export function useGroup(group: Accessor<Group["id"]>) {
    return use((tx) => tx.get<Group>(P.group.id(group())));
}

export function useCurrentGroup() {
    return use((tx, {groupId}) => tx.get<Group>(P.group.id(groupId)))
}

export function useOwnsCurrentGroup() {
    return use(async (tx, {groupId}) => {
        const userID = await tx.get<string>(P.currentUserID)
        assert(userID, "No logged in user set")
        const group = await tx.get<Group>(P.group.id(groupId))
        assert(group, `No group with id: ${groupId}`)
        return group.ownerId === userID
    })
}

export async function fetchGroup(groupId: Group["id"]) {
    const rep = useRep();
    return await rep?.()?.query(async (tx) => tx.get<Group>(P.group.id(groupId)));
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
        groupUsers(tx, groupId).then((us) => us.length),
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

async function groupUserIds(tx: ReadTransaction, groupId: Group["id"]) {
    let gids = await tx
        .scan({ prefix: P.groupUser.prefix(groupId) })
        .keys()
        .toArray();
    gids = gids.map((id) => id.split("/").at(-1)!);
    return gids;
}

async function groupUsers(tx: ReadTransaction, groupId: Group["id"]) {
    const gids = await groupUserIds(tx, groupId);
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
        const groupUsers = tx
            .scan<GroupUser>({ prefix: P.groupUser.prefix(groupId) })
            .values();
        for await (const gu of groupUsers) {
            if (gu.id === userId) {
                owed.total = gu.owed ?? 0;
                continue;
            }
            owed.to[gu.id] = gu.owed ?? 0;
        }
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

export function useCurrentUser() {
    const user = use(async (tx) => {
        const userID = await tx.get<string>(P.currentUserID);
        console.log("userID", userID);
        if (userID == null) {
            return null;
        }
        return await tx.get<User>(P.user.id(userID));
    }, false);
    createEffect(() => {
        console.log("currentUser", user());
    });
    return user;
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
        const isClosed = useIsClosed()
        if (isClosed()) {
            return {
                isInit: false,
                isClosed: true,
            } as const
        }
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
                if (ctx.isClosed) {
                    console.log("closed")
                    return;
                }
                console.log("not init");
                setValue("value", undefined);
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
        const isClosed = useIsClosed()
        if (isClosed()) {
            console.log("closed")
            return {
                isInit: false,
                isClosed: true,
            } as const
        }
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
                if (ctx.isClosed) {
                    console.log("closed")
                    return;
                }
                console.log("not init");
                setValue("value", undefined);
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
    const curId = useCurrentGroupId();
    const id = createMemo(() => {
        if (group) {
            return group();
        }
        const id = curId();
        // TODO: how to handle?
        return id!;
    });
    return id;
}

function createEvenSplit(userIds: string[], splitId: string, groupId: string) {
    const portions: Split["portions"] = {};
    for (const id of userIds) {
        portions[id] = 1.0;
    }
    return {
        id: splitId,
        portions,
        name: "Even Split",
        groupId,
        color: null,
        // TODO: use this in backend
        createdAt: Date.now()
    } satisfies Split;
}

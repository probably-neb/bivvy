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
import { removeKeys, assert} from "./utils";

// NOTE: wrappers around these mutators are required because the mutators will be run by the server
// with the same arguments (this being the contents of the push request). For consistency we want
// the server and client to generate entities with the same IDs so the ID and other non-deterministic
// fields must be generated before being passed to mutator so the server has access to them as well
const mutators = {
    async addExpense(tx: WriteTransaction, expense: Expense) {
        await tx.set(P.expense.id(expense.groupId, expense.id), expense);
        await createExpenseSideEffects(tx, expense);
    },
    async expenseWithOneOffSplitCreate(tx: WriteTransaction, expenseInput: ExpenseWithOneOffSplit) {
        const [expenseNoSplitID, {split}] = removeKeys(expenseInput, ["split"])
        const expense = Object.assign(expenseNoSplitID, {splitId: split.id})
        await tx.set(P.expense.id(expense.groupId, expense.id), expense)
        await tx.set(P.split.id(split.groupId, split.id), split)
        await createExpenseSideEffects(tx, expense)
    },
    async expenseWithOneOffSplitEdit(tx: WriteTransaction, expenseInput: ExpenseWithOneOffSplit) {
        const [expenseNoSplitID, {split}] = removeKeys(expenseInput, ["split"])

        const expense = Object.assign(expenseNoSplitID, {splitId: split.id})

        const prev = await tx.get<Expense>(P.expense.id(expense.groupId, expense.id))
        if (prev != null) {
            await cleanupExpenseSideEffects(tx, prev, prev.groupId)
        }

        await tx.set(P.expense.id(expense.groupId, expense.id), expense)
        await tx.set(P.split.id(split.groupId, split.id), split)

        await createExpenseSideEffects(tx, expense)
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
        const [group, _] = removeKeys(input, [
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
            acceptedAt: Date.now()
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
    if (split == null) {
        console.warn("failed to cleanup effects of expense with null split", {expense})
        return
    }
    const total = -expense.amount;
    await updateOwed(tx, expense.paidBy, groupId, total, split.portions);
}

async function updateOwed(
    tx: WriteTransaction,
    paidByID: string,
    groupId: string,
    amount: number,
    portions: Split["portions"],
) {
    // when client side paid by is always the current user
    const userID = paidByID;
    const totalParts = Math.max(
        Math.abs(Object.values(portions).reduce((a, b) => a + b, 0)),
        1.0,
    );
    const owed = new Array<[string, number]>();
    const splitParts = Object.entries(portions)

    const userKey = P.groupUser.id(groupId, userID)
    let user = await tx.get<GroupUser>(userKey)
    if (user == null) {
        user = {id: userID, owed: 0}
    }
    let userOwed = user.owed

    let userParts = 0
    for (let i = 0; i< splitParts.length; i++) {
        const [partUserID, parts] = splitParts[i]
        if (partUserID === userID) {
            userParts = parts
            break
        }
    }
    const userPortion = (amount * userParts) / totalParts

    const paidByUser = paidByID === userID;

    async function updateUserOwed(userID: string, delta: number) {
        const key = P.groupUser.id(groupId, userID)
        const user = await tx.get<GroupUser>(key)
        await tx.set(key, {id: userID, owed: (user?.owed ?? 0) + delta})
    }

    if (!paidByUser) {
        // If not paid by user and user owes nothing we don't care anymore
        if (userParts === 0) return owed

        // If another user paid for the expense they are owed the requesting
        // users portion and the requesting user is owed their portion less
        userOwed -= userPortion
        await tx.set(userKey, {...user, owed: userOwed})

        updateUserOwed(paidByID, userPortion)
        return
    }

    // if the user paid for the expense they are owed the amount of the expense
    // minus their portion
    userOwed += amount - userPortion
    await tx.set(userKey, {...user, owed: userOwed})

    for (let i = 0; i < splitParts.length; i++) {
        const [portionUserID, portionParts] = splitParts[i]

        if (portionUserID === userID) continue
        if (portionParts === 0) continue

        const portion = (amount * portionParts) / totalParts
        // if the user paid for the expense the other users are owed
        // their portion less
        await updateUserOwed(portionUserID, -portion)
    }
}

type Mutators = typeof mutators;

export function initReplicache(s: InitSession) {
    const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;
    const IS_LOCAL = import.meta.env.VITE_IS_LOCAL === "true";
    const logLevel = IS_LOCAL ? "debug" : "error";

    const rep = new Replicache<Mutators>({
        name: s.userId,
        auth: `${s.token}`,
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

export async function closeRep() {
    const [rep, _, [_closed, setClosed]] = useContext(ReplicacheContext);
    await rep()?.close();
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


const portionSchema = z.number().gte(0.0);

export const zSplit = z.object({
    name: z.string().min(1),
    id: zID,
    portions: z.record(userSchema.shape.id, portionSchema),
    groupId: groupSchema.shape.id,
    color: zHexString.nullable(),
    isOneOff: z.boolean().default(false),
});
export type Split = z.infer<typeof zSplit>;

export const zSplitInput = zSplit.pick({
    name: true,
    portions: true,
    color: true,
});

export type SplitInput = z.infer<typeof zSplitInput>;

export const zExpense = z.object({
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
export type Expense = z.infer<typeof zExpense>;

export const zExpenseInput = zExpense.pick({
    description: true,
    amount: true,
    paidOn: true,
    splitId: true,
});
export type ExpenseInput = z.infer<typeof zExpenseInput>;

export const zExpenseWithOneOffSplit = zExpense.omit({ splitId: true }).extend({
    split: zSplit
})

export type ExpenseWithOneOffSplit = z.infer<typeof zExpenseWithOneOffSplit>;

export const zExpenseWithOneOffSplitInput = zExpenseInput.omit({ splitId: true }).extend({
    split: zSplitInput.pick({ portions: true })
})

export type ExpenseWithOneOffSplitInput = z.infer<typeof zExpenseWithOneOffSplitInput>;

const createGroupInputSchema = groupSchema.extend({
    ownerId: userSchema.shape.id,
    defaultSplitId: zSplit.shape.id,
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

interface MutationMap extends Record<keyof Mutators, any> { }

interface MutationWrapperInputs extends MutationMap {
    addExpense: ExpenseInput;
    expenseAddWithOneOffSplit: ExpenseWithOneOffSplitInput,
    expenseEditWithOneOffSplit: ExpenseWithOneOffSplitInput,
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
    Object.keys(mutators).map((k) => [k, async () => { }]),
) as MutationMap;

type Ctx = [Accessor<Rep | null>, MutationWrappers, Signal<boolean>];
const defaultCtx: Ctx = [() => null, defualtMutations, [() => true, () => { }]];
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

    const mutationWrappers = {
        async addExpense(expense: ExpenseInput) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            const userID = ctx.userId
            const groupID = ctx.groupId
            assert(groupID != null, "Group not set")
            const e = expandExpenseInput(expense, { userID, groupID });
            await ctx.rep.mutate.addExpense(loudParse(zExpense, e));
        },
        async expenseWithOneOffSplitCreate(input: ExpenseWithOneOffSplitInput) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            const userID = ctx.userId
            const groupID = ctx.groupId
            assert(groupID != null, "Group not set")

            const expenseWOOS = expandExpenseWithOneOffSplitInput(input, { userID, groupID })
            await ctx.rep.mutate.expenseWithOneOffSplitCreate(expenseWOOS)
        },
        async expenseWithOneOffSplitEdit(input: ExpenseWithOneOffSplit & { prevSplitWasOneOff: boolean}) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            const groupID = ctx.groupId
            assert(groupID != null, "Group not set")
            console.log("input", JSON.parse(JSON.stringify(input)))

            input.split.name = generateOneOffSplitName(input.id)
            input.split.color = null
            input.split.isOneOff = true
            assert(input.prevSplitWasOneOff != null, "did not pass prevSplitWasOneOff!")
            if (!input.prevSplitWasOneOff) {
                input.split.id = nanoid()
            }

            const split = zSplit.parse(expandSplitInput(input.split, groupID))

            input.split = split
            const expenseWOOS = zExpenseWithOneOffSplit.parse(input)
            console.log("output", JSON.parse(JSON.stringify(expenseWOOS)))

            await ctx.rep.mutate.expenseWithOneOffSplitEdit(expenseWOOS)
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
            await ctx.rep.mutate.expenseEdit(zExpense.parse(expense));
        },
        async createSplit(splitInput: SplitInput) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            const groupID = ctx.groupId
            assert(groupID != null, "Group not set")
            const split = expandSplitInput(splitInput, groupID)
            await ctx.rep.mutate.createSplit(zSplit.parse(split));
        },
        async splitEdit(split: Split) {
            const ctx = useCtx();
            assert(ctx.isInit, "Replicache not initialized")
            await ctx.rep.mutate.splitEdit(zSplit.parse(split));
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
                createdAt: Date.now(),
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
        <ReplicacheContext.Provider value={[rep, mutationWrappers, closed]}>
            {props.children}
        </ReplicacheContext.Provider>
    );
}

function loudParse<Validator extends z.ZodTypeAny>(validator: Validator, input: unknown): z.infer<Validator> {
    try {
        return validator.parse(input);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error('error parsing', input, e)
        }
        throw e
    }
}


function expandExpenseInput(input: ExpenseInput, ctx: { userID: string, groupID: string }) {
    const id = nanoid();
    let e: Expense = {
        // copy because replicache responses are Readonly
        ...input,
        createdAt: Date.now(),
        paidOn: input.paidOn ?? null,
        status: "unpaid" as const,
        paidBy: ctx.userID,
        groupId: ctx.groupID,
        id,
    };
    return e
}

function expandSplitInput(input: SplitInput, groupID: string) {
    const split: Split = Object.assign(
        {
            groupId: groupID,
            id: nanoid(),
            createdAt: Date.now(),
            isOneOff: false,
        },
        input,
    );
    return split
}

function expandExpenseWithOneOffSplitInput(input: ExpenseWithOneOffSplitInput, ctx: { userID: string, groupID: string }) {
    const expenseInput = Object.assign(input, { splitId: "_____PLACEHOLDER_____" })
    const expense = expandExpenseInput(expenseInput, ctx)
    const splitInput = Object.assign(input.split, { name: generateOneOffSplitName(expense.id), color: null, isOneOff: true})
    const split = expandSplitInput(splitInput, ctx.groupID)
    // split.isOneOff = true
    const output = Object.assign(expense, { split })
    return output
}

function generateOneOffSplitName(expenseID: string) {
    return `one-off-${expenseID}`
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
    );
}

export function useGroup(group: Accessor<Group["id"]>) {
    return use((tx) => tx.get<Group>(P.group.id(group())));
}

export function useCurrentGroup() {
    return useWithGroupID((tx, { groupId }) => tx.get<Group>(P.group.id(groupId)))
}

export function useOwnsCurrentGroup() {
    return useWithGroupID(async (tx, { groupId }) => {
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
    const expenses = useWithGroupID(async (tx, { groupId }) => {
        return await tx
            .scan<Expense>({ prefix: P.expense.prefix(groupId) })
            .values()
            .toArray();
    });
    return expenses;
}

export function useTableExpenses() {
    const expenses = useWithGroupID(async (tx, { groupId }) => {
        return await tx
            .scan<Expense>({ prefix: P.expense.prefix(groupId) })
            .values()
            .toArray();
    }, {reconcile: false});
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
    const expenses = useWithGroupID(async (tx, { groupId }) =>
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
    const info = useWithGroupID(async (tx, { groupId, userId }) => {
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

export function useSortedUsers(group?: Accessor<Group["id"]>) {
    const groupId = useGroupId(group);
    const users = useWithOpts(groupId, async (tx, groupId) => {
        const items = await groupUsers(tx, groupId);
        items?.sort((a, b) => a.name.localeCompare(b.name))
        return items
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
    });
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
    const splits = useWithGroupID(async (tx, { groupId }) => {
        return (await tx
            .scan<Split>({ prefix: P.split.prefix(groupId) })
            .values()
            .toArray())
            .filter((item) => !item.isOneOff)
    });
    return splits;
}

export function useSortedSplits() {
    const splits = useWithGroupID(async (tx, { groupId }) => {
        const items = (await tx
            .scan<Split>({ prefix: P.split.prefix(groupId) })
            .values()
            .toArray()
        )
            .filter((item) => !item.isOneOff)
            .sort((a, b) => a.name.localeCompare(b.name))

        return items
    });
    return splits;

}

// null -> not found
// undefined -> still loading
export function useSplit(id: Accessor<Split["id"]>) {
    const split = useWithOpts(id, async (tx, id, { groupId }) => {
        const split = await tx.get<Split>(P.split.id(groupId, id));
        // return null explicitly so the caller can differentiate using
        // null -> not found
        // undefined -> still loading
        if (split == null) return null
        return split
    });
    return split;
}

/// Helper function that wraps a Replicache query subscription in a SolidJS signal
type Getter<R> = (
    tx: ReadTransaction,
    opts: {
        userId: User["id"];
        groupId: Group["id"] | undefined
    },
) => Promise<R>;

export function use<R>(
    getter: Getter<R>,
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
            if (!isInit) {
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
                            opts,
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

type UseWithGroupIDGetter<R> = (
    tx: ReadTransaction,
    opts: {
        userId: User["id"];
        groupId: Group["id"];
    },
) => Promise<R>;

export function useWithGroupID<R>(
    getter: UseWithGroupIDGetter<R>,
    options?: {reconcile?: boolean}
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
            if (!isInit || !groupId) {
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
                            opts,
                        ),
                    (val) => {
                        const update = val as Exclude<R, Function>
                        setValue(
                            "value",
                            options?.reconcile === false ? update : reconcile(update),
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

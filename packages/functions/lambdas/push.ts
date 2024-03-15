import { and, db, eq, schema } from "@paypals/db";
import { ClientGroupTable } from "lib/client-table";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import Parser from "util/parser";
import z from "zod";

const NANOID_ID_LENGTH = 21;
const zId = z.string().length(NANOID_ID_LENGTH);
const zUnixTime = z.number().int().min(0);

export const zGroup = z.object({
    name: z.string(),
    id: zId,
    ownerId: zId,
    pattern: z.string().nullable(),
    color: z.string().nullable(),
    createdAt: zUnixTime,
});
export type Group = z.infer<typeof zGroup>;

export const zUser = z.object({
    id: zId,
    name: z.string(),
});
export type User = z.infer<typeof zUser>;

export const zGroupUser = z.object({
    id: zUser.shape.id,
    owed: z.number().default(0),
});
export type GroupUser = z.infer<typeof zGroupUser>;


const zPortion = z.number().gte(0.0);

const zHexString = z
    .string()
    .length(7)
    .regex(/^#[\da-fA-F]{6}/);

export const zSplit = z.object({
    name: z.string(),
    id: zId,
    portions: z.record(zUser.shape.id, zPortion),
    createdAt: z.optional(zUnixTime),
    groupId: zGroup.shape.id,
    color: zHexString.nullable(),
    isOneOff: z.boolean().default(false)
});
export type Split = z.infer<typeof zSplit>;

export const zSplitInput = zSplit.pick({
    name: true,
    portions: true,
    color: true,
});

export type SplitInput = z.infer<typeof zSplitInput>;

export const zExpense = z.object({
    id: zId,
    description: z.string(),
    paidBy: zUser.shape.id,
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: zUnixTime.nullable().default(null),
    createdAt: z.optional(zUnixTime),
    groupId: zGroup.shape.id,
    splitId: zId,
});
export type Expense = z.infer<typeof zExpense>;

const zExpenseWithOneOffSplit = zExpense.omit({splitId: true}).extend({
    split: zSplit
})
type ExpenseWithOneOffSplit = z.infer<typeof zExpenseWithOneOffSplit>;

export const zDeleteExpenseInput = z.object({
    groupId: zGroup.shape.id,
    id: zExpense.shape.id,
    userId: zUser.shape.id,
});

export type DeleteExpenseInput = z.infer<typeof zDeleteExpenseInput>;
const zCreateGroupInput = zGroup.extend({
    ownerId: zUser.shape.id,
    defaultSplitId: zSplit.shape.id,
});

type CreateGroupInput = z.infer<typeof zCreateGroupInput>;

export const zGroupInput = zGroup.pick({
    pattern: true,
    color: true,
    name: true,
});

export type GroupInput = z.infer<typeof zGroupInput>;

export const zInvite = z.object({
    id: zId,
    groupId: zGroup.shape.id,
    createdAt: z.optional(zUnixTime),
    acceptedAt: zUnixTime.nullable(),
});

export type Invite = z.infer<typeof zInvite>;

export const zInviteInput = zInvite.pick({
    id: true,
    groupId: true,
});

export type InviteInput = z.infer<typeof zInviteInput>;

export type MutationName = (typeof MUTATIONS)[number];
const MUTATIONS = [
    "addExpense",
    "expenseWithOneOffSplitCreate",
    "expenseWithOneOffSplitEdit",
    "deleteExpense",
    "expenseEdit",
    "createSplit",
    "splitEdit",
    "createGroup",
    "groupEdit",
    "createInvite",
    "acceptInvite",
] as const;

type ZodValidator = z.ZodType;

/* type Mutation = {
    clientID: string;
    id: number;
    name: MutationName;
    args: ReadonlyJSONValue;
    timestamp: number;
}; */

const zMutationBase = z.object({
    clientID: z.string(),
    id: z.number(),
    timestamp: z.number(),
});

function mutationValidator<M extends MutationName, Z extends ZodValidator>(
    name: M,
    validator: Z,
) {
    return z.object({ name: z.literal(name), args: validator });
}

const zMutation = z
    .discriminatedUnion("name", [
        mutationValidator("addExpense", zExpense),
        mutationValidator("expenseWithOneOffSplitCreate", zExpenseWithOneOffSplit),
        mutationValidator("expenseWithOneOffSplitEdit", zExpenseWithOneOffSplit),
        mutationValidator("deleteExpense", zDeleteExpenseInput),
        mutationValidator("expenseEdit", zExpense),
        mutationValidator("createSplit", zSplit),
        mutationValidator("splitEdit", zSplit),
        mutationValidator("createGroup", zCreateGroupInput),
        mutationValidator("groupEdit", zGroup),
        mutationValidator("createInvite", zInvite),
        mutationValidator("acceptInvite", zInvite.shape.id),
    ])
    .and(zMutationBase);

/* type PushRequest = {
    pushVersion: 1;
    clientGroupID: string;
    mutations: Mutation[];
    profileID: string;
    schemaVersion: string;
}; */

const zPushRequest = z.object({
    // NOTE: should always be 1, but don't want to fail if it's not for now
    pushVersion: z.number(),
    clientGroupID: z.string(),
    // z.any() here to delay parsing, i.e. don't fail if only one
    // mutation is invalid out of many
    mutations: z.array(z.any()),
    profileID: z.string().optional(),
    schemaVersion: z.string(),
});

const zBodyParser = z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(zPushRequest);

enum ErrorReason {
    InvalidRequest = 400,
    AuthError = 401,
    InternalError = 500,
}
function errResponse(reason: ErrorReason) {
    return {
        statusCode: reason,
    };
}

function okResponse() {
    return {
        statusCode: 200,
    };
}

export const handler = ApiHandler(async (req) => {
    const body = zBodyParser.safeParse(req.body);
    if (!body.success) {
        return errResponse(ErrorReason.InvalidRequest);
    }
    const session = useSession();
    if (session.type !== "user") {
        return errResponse(ErrorReason.AuthError);
    }
    const opts = {
        userID: session.properties.userId,
        clientGroupID: body.data.clientGroupID,
    };
    try {
        await handleMutations(body.data.mutations, opts);
    } catch (e) {
        console.error("WARN: uncaught exception while handling mutations", e);
        return errResponse(ErrorReason.InternalError);
    }
    return okResponse();
});

async function handleMutations(
    mutations: Array<any>,
    opts: { userID: string; clientGroupID: string },
) {
    const userID = opts.userID
    const cg = new ClientGroupTable(opts.clientGroupID);
    const found = await cg.get();
    if (!found) {
        cg.createNewClientGroup(opts.userID);
    }
    const processed = new Array<boolean>(mutations.length);

    for (let i = 0; i < mutations.length; i++) {
        const parsed = zMutation.safeParse(mutations[i]);
        if (!parsed.success) {
            console.dir(
                { error: `Invalid mutation`, data: parsed.error },
                { depth: null },
            );
            processed[i] = true;
            continue;
        }
        const m = parsed.data;
        // deep copy for logging later
        const argsCopy = JSON.parse(JSON.stringify(m.args));
        const clientExists = cg.hasClient(m.clientID);
        if (!clientExists) {
            cg.addNewClient(m.clientID);
        }

        let ok = false;

        try {
            switch (m.name) {
                case "addExpense":
                    ok = await createExpense(m.args);
                    break;
                case "expenseWithOneOffSplitCreate":
                    ok = await expenseWithOneOffSplitCreate(m.args)
                    break;
                case "expenseEdit":
                    ok = await expenseEdit(m.args, userID);
                    break;
                case "expenseWithOneOffSplitEdit":
                    ok = await expenseWithOneOffSplitEdit(m.args, userID)
                    break;
                case "deleteExpense":
                    ok = await deleteExpense(m.args, userID);
                    break;
                case "createSplit":
                    ok = await createSplit(m.args);
                    break;
                case "splitEdit":
                    ok = await splitEdit(m.args);
                    break;
                case "createGroup":
                    ok = await createGroup(m.args, userID);
                    break;
                case "groupEdit":
                    ok = await groupEdit(m.args, userID);
                    break;
                case "createInvite":
                    ok = await createInvite(m.args);
                    break;
                case "acceptInvite":
                    ok = await acceptInvite(m.args, userID);
                    break;
                default:
                    let _ = m satisfies never;
                    console.error("Unknown mutation", _);
                    ok = true;
            }
        } catch (e) {
            // TODO: figure out errors that should be retried and
            // set ok to false in those cases
            ok = true;
            console.error("Error processing mutation", e);
        }
        processed[i] = ok;
        console.log({
            mutation: m.name,
            args: argsCopy,
            argsAfter: m.args,
            ok,
        });
    }

    // mark mutations as processed in ClientGroup
    for (let i = 0; i < processed.length; i++) {
        if (!processed[i]) {
            continue;
        }
        const base = zMutationBase.safeParse(mutations[i]);
        if (!base.success) {
            console.error(
                "Failed to parse base mutation info from processed mutation! - ",
                mutations[i],
            );
            continue;
        }
        const clientID = base.data.clientID;
        const mutationID = base.data.id;

        cg.markMutationProcessed(clientID, mutationID);
    }
    await cg.save();
}

async function createExpense(args: Expense) {
    await db.transaction(async (tx) => {
        await _expenseCreate(tx, args, {withOneOffSplit: false})
    });
    return true;
}

async function _expenseCreate(tx: Tx, args: Expense, opts?: {withOneOffSplit: boolean}) {
    const e = new Parser(args)
        .rename("splitId", "split_id")
        .rename("paidBy", "paid_by_user_id")
        .add("reiumbursed_at", null)
        .replace("paidOn", "paid_on", (d) => new Date(d))
        .rename("groupId", "group_id")
        .replace("createdAt", "created_at", (d) => new Date(d))
        .or_undefined("created_at")
        .value();
    // TODO: remove checks, add foreign key constraints
    // NOTE: check that is_one_off is false prevents one off splits from being used by multiple expenses
    // and removes the need to check that no other expenses are using a one off split when editing/deleting
    if (!(await itemExists(tx, "splits", and(eq(schema.splits.id, e.split_id), eq(schema.splits.is_one_off, opts?.withOneOffSplit ?? false))))) {
        throw new Error(`Split with id: ${e.split_id} not found`);
    }
    if (!(await itemWithIDExists(tx, "groups", e.group_id))) {
        throw new Error(`Group with id: ${e.group_id} not found`);
    }
    if (!(await itemWithIDExists(tx, "users", e.paid_by_user_id))) {
        throw new Error(`User with id: ${e.paid_by_user_id} not found`);
    }
    await tx.insert(schema.expenses).values(e);
}

type Table = Exclude<keyof typeof schema, `${string}Relations`>; // "users" | "splits" | "groups" | "invites";

async function itemWithIDExists<T extends Tx>(
    tx: T,
    table: Exclude<Table, "users_to_group" | "split_portion_def">,
    id: string,
) {
    return await itemExists(tx, table, eq(schema[table].id, id));
}

async function itemExists<T extends Tx, Sql extends any>(
    tx: T,
    table: Table,
    sql: Sql,
) {
    // @ts-ignore
    const val = await tx.query[table].findFirst({
        where: sql as any,
    });
    if (val == null) {
        return false as const;
    }
    return val;
}

async function expenseWithOneOffSplitCreate(args: ExpenseWithOneOffSplit) {
    await db.transaction(async tx => {
        const split = args.split
        split.isOneOff = true
        const splitID = split.id

        await _splitCreate(tx, split)
        const expense = new Parser(args)
            .remove("split")
            .add("splitId", splitID)
            .value()
        await _expenseCreate(tx, expense, {withOneOffSplit: true})
    })
    return true
}

async function deleteExpense(args: DeleteExpenseInput, userID: string) {
    assert(userID === args.userId, "Cannot delete another user's expense")

    const ex = schema.expenses;

    await db.transaction(async tx => {
        const expenseID = args.id
        const prevSplit = await getExpenseSplitIfOneOff(tx, expenseID)
        await tx.delete(ex).where(
            and(
                eq(ex.id, args.id),
                eq(ex.group_id, args.groupId),
                // By having this here and checking the
                // args.userId = session.userId we ensure
                // that the user can only delete their own
                // expenses without having to fech the
                // expense before deleting
                eq(ex.paid_by_user_id, args.userId),
            ),
        );
        // NOTE: after so that it doesn't break if a fk relation is created between expense and splitId
        if (prevSplit != null) {
            await _splitDelete(tx, prevSplit)
        }

    })
    return true;
}

async function getExpenseSplitIfOneOff(tx: Tx, expenseID: string) {
    const prevSplitExp = await tx.query.expenses.findFirst({
        where: eq(schema.expenses.id, expenseID),
        columns: {},
        with: {
            split: {
                columns: {
                    id: true,
                    is_one_off: true,
                    group_id: true,
                }
            }
        }
    })
    if (prevSplitExp == null) {
        return null
    }
    const prevSplit = prevSplitExp.split
    if (prevSplit.is_one_off !== true) {
        return null
    }
    return new Parser(prevSplit)
        .rename("is_one_off", "isOneOff")
        .rename("group_id", "groupId")
        .value()
}

async function expenseEdit(args: Expense, userID: string) {
    await db.transaction(async tx => {
        await _expenseEdit(tx, args, userID)
    })
    return true;
}

async function _expenseEdit(tx: Tx, args: Expense, userID: string) {
    assert(userID === args.paidBy, "Cannot edit another user's expense")


    // NOTE: must ensure groupId, paidBy, createdAt are not changed
    // This is done now with `where` clause, so expense will not be found because one isn't equal
    // but we lose info about what was changed leading to bad UX
    const e = new Parser(args)
        .rename("splitId", "split_id")
        .rename("groupId", "group_id")
        .replace("createdAt", "created_at", (d) => new Date(d))
        .or_undefined("created_at")
        .replace("paidOn", "paid_on", (d) => new Date(d))
        .rename("paidBy", "paid_by_user_id")
        // FIXME: date reimbursed is lost when changed to status
        .replace("status", "reimbursed_at", () => null)
        .value();

    const groupID = e.group_id
    const expenseID = e.id
    const prevSplit = await getExpenseSplitIfOneOff(tx, expenseID)

    await tx
        .update(schema.expenses)
        .set(e)
        .where(
            and(
                eq(schema.expenses.id, expenseID),
                eq(schema.expenses.group_id, groupID),
            // NOTE: checking paid_by_user_id here paired with the assertion above checks that
            // the request does not maliciously change paid_by_user_id to edit another users expense
            // it does however fail silently (i.e. malicious user won't be identified)
                eq(schema.expenses.paid_by_user_id, e.paid_by_user_id),
            ),
        );

    if (prevSplit == null) {
        // NOTE: warn to be nice to user
        // if error was thrown they would be unable to fix what should be an impossible situation
        console.warn(`could not find split for expense with id: ${expenseID} while looking for one off`)
        return
    }
    assert(
        prevSplit.id !== args.splitId,
        "editing expense so that it has a one-off split when it didn't previously should be done with the expenseWithOneOffSplitEdit mutation"
    )
    // previous split was a one-off and therefore should be deleted
    await _splitDelete(tx, {id: prevSplit.id, groupId: groupID})
}

async function expenseWithOneOffSplitEdit(args: ExpenseWithOneOffSplit, userID: string) {
    await db.transaction(async tx => {
        const split = args.split

        const expenseID = args.id

        if (!split.isOneOff) {
            console.warn("expected split in expenseWithOneOff to be marked as a one off but it wasn't. proof: ", split)
            split.isOneOff = true
        }

        const prevSplit = await getExpenseSplitIfOneOff(tx, expenseID)
        const prevSplitWasOneOff = prevSplit != null

        let splitID = split.id
        if (prevSplitWasOneOff) {
            if (prevSplit.id !== splitID) {
                console.warn("split id changed despite previous split also being a one-off split", {prevSplit, split})
                splitID = prevSplit.id
            }
            // Delete previous one-off split
            assert(prevSplit != null, 'prevSplit != null')
            assert(prevSplit.groupId === split.groupId, "prevSplit.groupId === newSplit.groupId")
            await _splitDeletePortions(tx, splitID)
            await _splitCreatePortions(tx, splitID, split.portions)
        } else {
            // create the new one off split
            await _splitCreate(tx, split)
        }

        const expense = new Parser(args)
            .remove("split")
            .add("splitId", splitID)
            .value()
        console.log({expense})
        await _expenseEdit(tx, expense, userID)

    })
    return true
}

async function createSplit(args: Split) {
    await db.transaction(async (db) => {
        await _splitCreate(db, args);
    });
    return true;
}

async function _splitCreate(tx: Tx, args: Split) {
    const portions = { ...args.portions };
    const s = new Parser(args)
        .remove("portions")
        .rename("groupId", "group_id")
        .rename("isOneOff", "is_one_off")
        // FIXME: add created_at col
        .replace("createdAt", "created_at", (c) => new Date(c))
        .value();
    await tx.insert(schema.splits).values(s);
    await _splitCreatePortions(tx, args.id, portions)
}

async function _splitCreatePortions(tx: Tx, splitID: string, portions: Record<string, number>) {
    const portionEntries = Object.entries(portions)
        .filter(([_userID, parts]) => parts > 0)
        .map(([user_id, parts]) => ({
            user_id,
            parts,
            split_id: splitID,
        }));
    await tx.insert(schema.split_portion_def).values(portionEntries);
}

async function splitEdit(args: Split) {
    await db.transaction(async (tx) => {
        await _splitDelete(tx, args);
        await _splitCreate(tx, args);
    });
    return true;
}

async function _splitDeletePortions(tx: Tx,  splitID: string) {
    await tx
        .delete(schema.split_portion_def)
        .where(eq(schema.split_portion_def.split_id, splitID));
}

async function _splitDelete(tx: Tx, args: {id: string, groupId: string}) {
    await _splitDeletePortions(tx, args.id);
    await tx
        .delete(schema.splits)
        .where(
            and(
                eq(schema.splits.id, args.id),
                eq(schema.splits.group_id, args.groupId),
            ),
        );
}

async function createGroup(args: CreateGroupInput, userID: string) {
    await db.transaction(async (tx) => {
        const groupID = args.id;
        const ownerID = args.ownerId;
        assert(ownerID === userID, "Cannot create group owned by another user")
        const g = new Parser(args)
            .rename("ownerId", "owner_id")
            // FIXME: stop creating default splits
            .remove("defaultSplitId")
            .value();
        await tx.insert(schema.groups).values(g);
        await addUserToGroup(tx, groupID, ownerID);
    });
    return true;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function addUserToGroup(tx: Tx, groupId: string, userId: string) {
    await tx.insert(schema.users_to_group).values({
        user_id: userId,
        group_id: groupId,
    });
}

async function createInvite(args: Invite) {
    const invite = new Parser(args)
        .intToDate("createdAt")
        .rename("createdAt", "created_at")
        .or_undefined("created_at")
        .intToDate("acceptedAt")
        .rename("acceptedAt", "accepted_at")
        .rename("groupId", "group_id")
        .value();
    await db.insert(schema.invites).values(invite);
    return true;
}
async function acceptInvite(args: string, userID: string) {
    await db.transaction(async (tx) => {
        const inviteID = args;
        const invite = await tx.query.invites.findFirst({
            where: eq(schema.invites.id, inviteID),
        });
        assert(invite != null, `Invite with id: ${inviteID} not found`)

        const groupID = invite.group_id;

        const alreadyInGroup = await isUserMemberOfGroup(tx, groupID, userID);
        assert(!alreadyInGroup,`User: ${userID} is already a member of group: ${groupID}`)

        await addUserToGroup(tx, groupID, userID);
    });
    return true;
}

async function isUserMemberOfGroup(tx: Tx, groupID: string, userID: string) {
    const user = await tx.query.users_to_group.findFirst({
        where: and(
            eq(schema.users_to_group.group_id, groupID),
            eq(schema.users_to_group.user_id, userID),
        ),
    });
    return user != null;
}

async function groupEdit(args: Group, userID: string) {
    await db.transaction(async (tx) => {
        if (!(await isGroupOwner(tx, userID, args.id))) {
            throw new Error(`cannot edit a group you do not own`);
        }

        const group = new Parser({...args})
            .remove("ownerId")
            .remove("id")
            .remove("createdAt")
            .value()

        await tx
            .update(schema.groups)
            .set(group)
            .where(eq(schema.groups.id, args.id));
    });
    return true;
}

async function isGroupOwner(tx: Tx, userID: string, groupID: string) {
    const g = await tx.query.groups.findFirst({
        where: eq(schema.groups.id, groupID),
    });
    assert(g != null, `No group with id: ${groupID} found`)
    return g.owner_id === userID;
}


function assert(value: unknown, message?: string): asserts value {
    if (value)
        return
    console.assert(value, message)
    throw new Error(`Assertion Error: ${message ?? ""} -- ${value} is Falsy`)
}

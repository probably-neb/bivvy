import { and, db, eq, schema, sql } from "@paypals/db";
import { ClientGroupTable } from "lib/client-table";
import type { ReadonlyJSONValue } from "replicache";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import Parser from "util/parser";
import z from "zod";
import { calculatePortion, getTotalParts } from "./pull";

const NANOID_ID_LENGTH = 21;

// TODO: replace *Schema with z* for brevity
const zId = z.string().length(NANOID_ID_LENGTH);

export const zGroup = z.object({
    name: z.string(),
    id: zId,
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

const zUnixTime = z.number().int().min(0);

export const zExpense = z.object({
    id: zId,
    description: z.string(),
    paidBy: zUser.shape.id,
    amount: z.number().gt(0),
    status: z.enum(["paid", "unpaid"]),
    paidOn: zUnixTime.nullable().default(null),
    createdAt: zUnixTime,
    groupId: zGroup.shape.id,
    splitId: zId,
});
export type Expense = z.infer<typeof zExpense>;

export const zExpenseInput = zExpense.pick({
    description: true,
    amount: true,
    paidOn: true,
    splitId: true,
});
export type ExpenseInput = z.infer<typeof zExpenseInput>;

export const zDeleteExpenseInput = z.object({
    groupId: zGroup.shape.id,
    expenseId: zExpense.shape.id,
    userId: zUser.shape.id,
});

export type DeleteExpenseInput = z.infer<typeof zDeleteExpenseInput>;

const zPortion = z.number().gte(0.0);

const zHexString = z
    .string()
    .length(7)
    .regex(/^#[\da-fA-F]{6}/);

export const zSplit = z.object({
    name: z.string(),
    id: zId,
    portions: z.record(zUser.shape.id, zPortion),
    createdAt: zUnixTime,
    groupId: zGroup.shape.id,
    color: zHexString.nullable(),
});
export type Split = z.infer<typeof zSplit>;

export const zSplitInput = zSplit.pick({
    name: true,
    portions: true,
    color: true,
});

export type SplitInput = z.infer<typeof zSplitInput>;

const zCreateGroupInput = zGroup.extend({
    ownerId: zUser.shape.id,
    defaultSplitId: zSplit.shape.id,
});

type CreateGroupInput = z.infer<typeof zCreateGroupInput>;

export const zGroupInput = zGroup.pick({
    name: true,
});

export type GroupInput = z.infer<typeof zGroupInput>;

export const zInvite = z.object({
    id: zId,
    groupId: zGroup.shape.id,
    createdAt: zUnixTime,
    acceptedAt: zUnixTime.nullable(),
});

export type Invite = z.infer<typeof zInvite>;

export const zInviteInput = zInvite.pick({
    id: true,
    groupId: true,
});

export type InviteInput = z.infer<typeof zInviteInput>;

type MutationName = (typeof MUTATIONS)[number];
const MUTATIONS = [
    "addExpense",
    "deleteExpense",
    "createSplit",
    "createGroup",
    "createInvite",
    "acceptInvite",
] as const;

type ZodValidator = z.ZodType;

type Mutation = {
    clientID: string;
    id: number;
    name: MutationName;
    args: ReadonlyJSONValue;
    timestamp: number;
};

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
        mutationValidator("deleteExpense", zDeleteExpenseInput),
        mutationValidator("createSplit", zSplitInput),
        mutationValidator("createGroup", zGroupInput),
        mutationValidator("createInvite", zInviteInput),
        mutationValidator("acceptInvite", zInvite.shape.id),
    ])
    .and(zMutationBase);

type PushRequest = {
    pushVersion: 1;
    clientGroupID: string;
    mutations: Mutation[];
    profileID: string;
    schemaVersion: string;
};

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
    await handleMutations(body.data.mutations, opts);
});

async function handleMutations(
    mutations: Array<any>,
    opts: { userID: string; clientGroupID: string },
) {
    const cg = new ClientGroupTable(opts.clientGroupID);
    const found = await cg.get();
    if (!found) {
        cg.createNewClientGroup(opts.userID);
    }
    const processed = new Array<boolean>(mutations.length);

    for (let i = 0; i < mutations.length; i++) {
        const parsed = zMutation.safeParse(mutations[i]);
        if (!parsed.success) {
            console.error("Invalid mutation", parsed);
            processed[i] = true;
            continue;
        }
        const m = parsed.data;
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
                case "deleteExpense":
                    ok = await deleteExpense(m.args);
                    break;
                case "createSplit":
                    ok = await createSplit(m.args);
                    break;
                case "createGroup":
                    ok = await createGroup(m.args);
                    break;
                case "createInvite":
                    ok = await createInvite(m.args);
                    break;
                case "acceptInvite":
                    ok = await acceptInvite(m.args);
                    break;
                default:
                    let _ = m satisfies never;
                    console.error("Unknown mutation", _);
                    ok = true;
            }
        } catch (e) {
            // TODO: figure out errors that should be retried and
            // set ok to false in those cases
            console.error("Error processing mutation", e);
        }
        processed[i] = ok;
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
    const e = new Parser(args)
        .rename("splitId", "split_id")
        .rename("paidBy", "paid_by_user_id")
        .add("reiumbursed_at", null)
        .replace("paidOn", "paid_on", (d) => new Date(d))
        .rename("groupId", "group_id")
        .replace("createdAt", "created_at", (d) => new Date(d))
        .value();
    await db.insert(schema.expenses).values(e);
    return true;
}

async function deleteExpense(args: DeleteExpenseInput) {
    const ex = schema.expenses;
    const session = useSession();
    if (session.type !== "user") {
        throw new Error("Invalid session type");
    }
    if (session.properties.userId != args.userId) {
        throw new Error("Cannot delete another user's expense");
    }
    await db.delete(schema.expenses).where(
        and(
            eq(ex.id, args.expenseId),
            eq(ex.group_id, args.groupId),
            // By having this here and checking the
            // args.userId = session.userId we ensure
            // that the user can only delete their own
            // expenses without having to fech the
            // expense before deleting
            eq(ex.paid_by_user_id, args.userId),
        ),
    );
    return true;
}

async function createSplit(args: SplitInput) {
    return true;
}

async function createGroup(args: GroupInput) {
    return true;
}
async function createInvite(args: InviteInput) {
    return true;
}
async function acceptInvite(args: string) {
    return true;
}

import { alias, db, eq, schema, sql } from "@paypals/db";
import { ClientGroupTable } from "lib/client-table";
import type { ClientID, JSONValue, ReadonlyJSONValue } from "replicache";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import Parser from "util/parser";
import z from "zod";

/* type PullRequest = {
    pullVersion: 1;
    clientGroupID: string;
    cookie: number;
    profileID: string;
    schemaVersion: string;
}; */
const zPullRequest = z.object({
    // NOTE: should always be 1, but don't want to fail if it's not for now
    pullVersion: z.number(),
    clientGroupID: z.string(),
    cookie: z.number().gte(0).nullable(),
    ProfileID: z.string().optional(),
    schemaVersion: z.string(),
});

export type PullResponse =
    | PullResponseOK
    | ClientStateNotFoundResponse
    | VersionNotSupportedResponse;

export type PullResponseOK = {
    cookie: Cookie;
    lastMutationIDChanges: Record<ClientID, number> | Map<ClientID, number>;
    patch: PatchOperation[];
};

export type Cookie =
    | null
    | string
    | number
    | (ReadonlyJSONValue & { readonly order: number | string });

/**
 * In certain scenarios the server can signal that it does not know about the
 * client. For example, the server might have lost all of its state (this might
 * happen during the development of the server).
 */
export type ClientStateNotFoundResponse = {
    error: "ClientStateNotFound";
};

/**
 * The server endpoint may respond with a `VersionNotSupported` error if it does
 * not know how to handle the {@link pullVersion}, {@link pushVersion} or the
 * {@link schemaVersion}.
 */
export type VersionNotSupportedResponse = {
    error: "VersionNotSupported";
    versionType?: "pull" | "push" | "schema" | undefined;
};

type PatchOperation =
    | {
          op: "put";
          key: string;
          value: JSONValue;
      }
    | { op: "del"; key: string }
    | { op: "clear" };

const CLEAR_OP: PatchOperation = { op: "clear" };

function errResponse(body: any) {
    return {
        statusCode: 400,
        body: JSON.stringify(body),
        headers: {
            "content-type": "application/json",
        },
    };
}

function okResponse(body: PullResponse) {
    return {
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
            "content-type": "application/json",
        },
    };
}

const zBodyParser = z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(zPullRequest);

export const handler = ApiHandler(async (req) => {
    const body = zBodyParser.safeParse(req.body);
    if (!body.success) {
        console.error("Invalid body", body.error, body);
        return errResponse({ ok: false, error: "Invalid body" });
    }
    const session = useSession();
    if (session.type !== "user") {
        console.error("Invalid session", session);
        return errResponse({ ok: false, error: "Invalid session" });
    }
    const userID = session.properties.userId;

    const { clientGroupID, schemaVersion, cookie } = body.data;
    // TODO: check schema version

    const response: PullResponse = {
        cookie: calculateNextCookie(cookie),
        lastMutationIDChanges: await getLastMutations(clientGroupID, userID),
        patch: await constructPatches(userID),
    };

    return okResponse(response);
});

function calculateNextCookie(cookie: number | null) {
    if (cookie == null) {
        return 0;
    }
    return cookie + 1;
}

async function constructPatches(userID: string) {
    const getUsers = getUsersForUser(userID);
    const getExpenses = getExpensesForUser(userID);
    const getSplits = getSplitsForUser(userID);
    const getGroups = getGroupsForUser(userID);
    const [expenses, { unique: users, group: groupUsers }, splits, groups] =
        await Promise.all([getExpenses, getUsers, getSplits, getGroups]);

    let numPatches =
        expenses.length + users.length + splits.length + groups.length;
    for (const groupUserArr of groupUsers.values()) {
        numPatches += groupUserArr.length;
    }
    // 1 for the clear operation, 1 for the user id
    const numConstantPatches = 2

    const patches = new Array<PatchOperation>(numPatches + numConstantPatches)
        .fill(null as unknown as PatchOperation)
        .map(createEmptyPutPatch);

    // store constant patches
    // clear
    // @ts-ignore
    patches[0] = CLEAR_OP;
    // userID
    patches[1].key = "userID"
    patches[1].value = userID

    let i = 2;

    for (const expense of expenses) {
        const p = patches[i++];
        p.key = expenseKey(expense.groupId, expense.id);
        p.value = expense;
    }
    for (const split of splits) {
        const p = patches[i++];
        p.key = splitKey(split.groupId, split.id);
        p.value = split;
    }
    for (const user of users) {
        const p = patches[i++];
        p.key = userKey(user.id);
        p.value = user;
    }
    for (const [groupId, groupUserArr] of groupUsers) {
        for (const groupUser of groupUserArr) {
            const p = patches[i++];
            p.key = groupUserKey(groupId, groupUser.id);
            p.value = groupUser;
        }
    }
    for (const group of groups) {
        const p = patches[i++];
        p.key = groupKey(group.id);
        p.value = group;
    }
    console.assert(
        patches.every((p) => p != null && (p.op != "put" || p.key != null)),
        "forgot to include some patches or numPatches computed incorrectly",
    );

    return patches;
}

function createEmptyPutPatch() {
    return {
        op: "put",
        key: null as unknown as string,
        value: null as JSONValue,
    } satisfies PatchOperation;
}

function groupItemKey(groupId: string, type: string, item: string) {
    return `group/${groupId}/${type}/${item}`;
}

function expenseKey(groupId: string, expenseId: string) {
    return groupItemKey(groupId, "expense", expenseId);
}

function splitKey(groupId: string, splitId: string) {
    return groupItemKey(groupId, "split", splitId);
}

function userKey(userId: string) {
    return "user/" + userId;
}

function groupUserKey(groupId: string, userId: string) {
    return groupItemKey(groupId, "user", userId);
}

function groupKey(groupId: string) {
    return "groups/" + groupId;
}

async function getExpensesForUser(userID: string) {
    const rows = await db.query.users.findFirst({
        where: sql`${schema.users.id} = ${userID}`,
        columns: {},
        with: {
            user_to_group: {
                columns: {},
                with: {
                    group: {
                        columns: {},
                        with: {
                            expenses: true,
                        },
                    },
                },
            },
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }
    let numGroups = rows.user_to_group.length;
    let numExpenses = 0;
    for (let i = 0; i < numGroups; i++)
        numExpenses += rows.user_to_group[i].group.expenses.length;

    const expenses = new Array<ReturnType<typeof parseExpense>>(numExpenses);
    let i = 0;
    for (let j = 0; j < numGroups; j++) {
        const groupExpenses = rows.user_to_group[j].group.expenses;
        for (let k = 0; k < groupExpenses.length; k++) {
            expenses[i++] = parseExpense(groupExpenses[k]);
        }
    }
    return expenses;
}

function parseExpense(e: typeof schema.expenses.$inferSelect) {
    return new Parser(e)
        .replace("reimbursed_at", "status", () => "paid" as "paid" | "unpaid")
        .default("status", "unpaid")
        .rename("paid_by_user_id", "paidBy")
        .allDatesToUnixMillis()
        .allKeysToCamelCase()
        .value();
}

async function getUsersForUser(userID: string) {
    const user_groups_users_to_group = alias(
        schema.users_to_group,
        "group_users_to_group",
    );
    // TODO: figure out if (and how to fix) users being returned just a single
    // time with the amount owed across different groups
    const getRows = db
        .select({
            user: schema.users,
            groupID: user_groups_users_to_group.group_id,
        })
        .from(schema.users_to_group)
        .leftJoin(
            user_groups_users_to_group,
            eq(
                user_groups_users_to_group.group_id,
                schema.users_to_group.group_id,
            ),
        )
        .rightJoin(
            schema.users,
            eq(schema.users.id, user_groups_users_to_group.user_id),
        )
        .where(eq(schema.users_to_group.user_id, userID));

    const getOwed = getOwedForUser(userID);
    const [rows, owed] = await Promise.all([getRows, getOwed]);

    type GroupId = string;
    const numRows = rows.length;

    type ParsedRow = {
        owed: number;
        groupID: GroupId;
        user: ReturnType<typeof parseUser>;
    };
    const parsedRows: Array<ParsedRow> = new Array(numRows)
        .fill(null)
        .map(() => ({
            groupID: "",
            user: null as any,
            owed: 0,
        }));

    for (let i = 0; i < numRows; i++) {
        const row = rows[i];
        if (row.groupID == null) {
            console.error(`no group for user ${row.user.id}`);
            continue;
        }
        parsedRows[i].groupID = row.groupID;
        parsedRows[i].user = parseUser(row.user);
    }

    const uniqueUsers = new Map<string, User>();
    const groupUsers = new Map<GroupId, User[]>();

    for (let i = 0; i < numRows; i++) {
        const row = parsedRows[i];
        const groupID = row.groupID;
        const userID = row.user.id;
        const owedToUser = owed.perGroup.get(groupID)?.get(userID) ?? 0;
        const user = Object.assign(row.user, { owed: owedToUser });

        if (!groupUsers.has(groupID)) {
            groupUsers.set(groupID, []);
        }
        groupUsers.get(row.groupID)?.push(user);

        if (!uniqueUsers.has(user.id)) {
            uniqueUsers.set(user.id, user);
            continue;
        }
    }
    for (const [owedUserID, owedToUserAmount] of owed.total) {
        const owedUser = uniqueUsers.get(owedUserID);
        if (owedUser == null) {
            console.error("could not find owed user");
            continue;
        }
        // NOTE: important copy here
        uniqueUsers.set(owedUserID, Object.assign({}, owedUser, {owed: owedToUserAmount}))
    }
    const uniqueUsersArray = Array.from(uniqueUsers.values());
    const res = {
        unique: uniqueUsersArray,
        group: groupUsers,
    };
    return res;
}

type User = ReturnType<typeof parseUser> & { owed: number };

function parseUser(u: typeof schema.users.$inferSelect) {
    return new Parser(u).allDatesToUnixMillis().allKeysToCamelCase().value();
}

async function getSplitsForUser(userID: string) {
    const rows = await db.query.users.findFirst({
        where: eq(schema.users.id, userID),
        columns: {},
        with: {
            user_to_group: {
                columns: {},
                with: {
                    group: {
                        columns: {},
                        with: {
                            splits: {
                                with: {
                                    portions: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }
    let numSplits = 0;
    const numGroups = rows.user_to_group.length;
    for (let i = 0; i < numGroups; i++) {
        numSplits += rows.user_to_group[i].group.splits.length;
    }
    type Split = ReturnType<typeof parseSplit>
    const splits = new Array<Split>(numSplits);
    let i = 0;
    for (let j = 0; j < numGroups; j++) {
        const groupSplits = rows.user_to_group[j].group.splits;
        for (let k = 0; k < groupSplits.length; k++) {
            splits[i++] = parseSplit(groupSplits[k]);
        }
    }
    return splits;
}

type DBSplit = typeof schema.splits.$inferSelect & {
    portions: Array<typeof schema.split_portion_def.$inferSelect>;
};

function parseSplit(s: DBSplit) {
    return new Parser(s)
        .reassign("portions", (portions) =>
            Object.fromEntries(
                portions.map((p) => [p.user_id, p.parts]),
            ),
        )
        .rename("group_id", "groupId")
        .rename("is_one_off", "isOneOff")
        .value();
}

async function getGroupsForUser(userID: string) {
    const rows = await db.query.users.findFirst({
        where: eq(schema.users.id, userID),
        columns: {},
        with: {
            user_to_group: {
                columns: {},
                with: {
                    group: true,
                },
            },
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }
    type Group = ReturnType<typeof parseGroup>
    const nGroups = rows.user_to_group.length;
    const groups = new Array<Group>(nGroups);
    for (let i = 0; i < nGroups; i++) {
        groups[i] = parseGroup(rows.user_to_group[i].group);
    }
    return groups;
}

function parseGroup(g: typeof schema.groups.$inferSelect) {
    return new Parser(g)
        .allKeysToCamelCase()
        .allDatesToUnixMillis()
        .value()
}

async function getOwedForUser(userID: string) {
    const rows = await db.query.users_to_group.findMany({
        where: eq(schema.users_to_group.user_id, userID),
        with: {
            group: {
                columns: {id: true},
                with: {
                    expenses: {
                        columns: {
                            description: true,
                            id: true,
                            amount: true,
                            paid_by_user_id: true
                        },
                        with: {
                            split: {
                                with: {
                                    portions: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }

    type UserID = string;
    type GroupID = string;

    const total = new Map<UserID, number>();
    const perGroup = new Map<GroupID, Map<UserID, number>>();
    const updateTotal = (userID: string, amount: number) => {
        const totalOwed = total.get(userID) ?? 0;
        total.set(userID, totalOwed + amount);
    };
    const updatePerGroup = (
        groupID: string,
        userID: string,
        amount: number,
    ) => {
        const groupOwed = perGroup.get(groupID)!.get(userID) ?? 0;
        perGroup.get(groupID)!.set(userID, groupOwed + amount);
    };

    for (const row of rows) {
        const groupID = row.group.id;
        if (!perGroup.has(groupID)) {
            perGroup.set(groupID, new Map());
        }
        for (const expense of row.group.expenses) {
            const amount = expense.amount;
            const split = expense.split;
            if (split == null) {
                console.error(`split for expense ${JSON.stringify(expense)} is null`)
            }
            // FIXME: portions should never be null. Expenses should have a check to ensure
            // the split exists
            let portions = split == null ? [] : split.portions
            const paidByUserID = expense.paid_by_user_id;
            console.log(`=======\nEXPENSE: ${expense.description}`)
            const owed = calculateOwed(
                userID,
                paidByUserID,
                amount,
                portions,
            );

            for (const [owedUserID, owedAmount] of owed) {
                updatePerGroup(groupID, owedUserID, owedAmount);
                updateTotal(owedUserID, owedAmount);
            }
        }
    }
    return dbg({
        total,
        perGroup,
    });
}

export function calculatePortion(
    amount: number,
    partsOwed: number,
    totalParts: number,
) {
    return (amount * partsOwed) / totalParts;
}

export function getTotalParts(portions: Array<{ parts: number }>) {
    let total = 0;
    for (const p of portions) {
        total += p.parts;
    }
    console.assert(!isNaN(total), "total parts is NaN");
    console.assert(total > 0, "total parts is <= 0");
    if (total <= 0) {
        return 1;
    }
    return total;
}

function calculateOwed(
    userID: string,
    paidByUserID: string,
    amount: number,
    portionDefs: Array<{ parts: number; user_id: string }>,
) {
    const totalParts = getTotalParts(portionDefs);
    const owed = new Array<[string, number]>();

    let userParts = 0
    for (let i = 0; i<portionDefs.length; i++) {
        const pdef = portionDefs[i]
        if (pdef.user_id === userID) {
            userParts = pdef.parts
            break
        }
    }
    const userPortion = calculatePortion(amount, userParts, totalParts)

    const paidByUser = paidByUserID === userID;

    if (!paidByUser) {
        // If not paid by user and user owes nothing we don't care anymore
        if (userParts === 0) return owed

        // If another user paid for the expense they are owed the requesting
        // users portion and the requesting user is owed their portion less
        owed.push([paidByUserID, userPortion])
        owed.push([userID, -userPortion])
        return owed
    }

    // if the user paid for the expense they are owed the amount of the expense
    // minus their portion
    owed.push([userID, amount - userPortion])

    for (let i = 0; i < portionDefs.length; i++) {
        const pdef = portionDefs[i]

        const portionUserID = pdef.user_id
        if (portionUserID === userID) continue

        const portionParts = pdef.parts
        if (portionParts === 0) continue

        const portion = calculatePortion(amount, portionParts, totalParts)

        // if the user paid for the expense the other users are owed
        // their portion less
        owed.push([portionUserID, -portion])
    }
    return owed
}

function dbg<T>(val: T) {
    console.dir(val, {depth: null})
    return val
}

async function getLastMutations(clientGroupId: string, userId: string) {
    const ct = new ClientGroupTable(clientGroupId);
    await ct.get();
    const ctOwnerId = ct.ownerUserId;
    if (ctOwnerId != null && ctOwnerId !== userId) {
        throw new Error("client group does not belong to user");
    }
    const lastMutationsMap = ct.getLastMutations();
    const lastMutations = Object.fromEntries(lastMutationsMap);
    return lastMutations;
}

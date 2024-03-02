import { alias, and, db, eq, schema, sql } from "@paypals/db";
import { ClientGroupTable } from "lib/client-table";
import type { ClientID, JSONValue, ReadonlyJSONValue } from "replicache";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";
import Parser from "util/parser";
import z from "zod";

type PullRequest = {
    pullVersion: 1;
    clientGroupID: string;
    cookie: number;
    profileID: string;
    schemaVersion: string;
};

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

async function constructPatches(profileID: string) {
    const expenses = await getExpensesForUser(profileID);
    const { unique: users, group: groupUsers } =
        await getUsersForUser(profileID);
    const splits = await getSplitsForUser(profileID);
    const groups = await getGroupsForUser(profileID);

    let numPatches =
        expenses.length + users.length + splits.length + groups.length;
    for (const groupUserArr of groupUsers.values()) {
        numPatches += groupUserArr.length;
    }

    const patches = new Array<PatchOperation>(numPatches + 1);
    patches[0] = CLEAR_OP;

    let i = 1;
    for (const expense of expenses) {
        patches[i++] = expenseToPatch(expense);
    }
    for (const split of splits) {
        patches[i++] = splitToPatch(split);
    }
    for (const user of users) {
        patches[i++] = userToPatch(user);
    }
    for (const [groupId, groupUserArr] of groupUsers) {
        for (const groupUser of groupUserArr) {
            patches[i++] = groupUserToPatch(groupId, groupUser);
        }
    }
    for (const group of groups) {
        patches[i++] = groupToPatch(group);
    }
    console.assert(
        patches.every((p) => p != null),
        "forgot to include some patches or numPatches computed incorrectly",
    );

    return patches;
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

function groupKey(groupId: string) {
    return "groups/" + groupId;
}

function expenseToPatch(expense: ReturnType<typeof parseExpense>) {
    return {
        op: "put",
        key: expenseKey(expense.groupId, expense.id),
        value: expense,
    } satisfies PatchOperation;
}

function userToPatch(user: User) {
    return {
        op: "put",
        key: userKey(user.id),
        value: user,
    } satisfies PatchOperation;
}

function groupUserToPatch(groupId: string, user: User) {
    return {
        op: "put",
        key: groupItemKey(groupId, "user", user.id),
        value: user,
    } satisfies PatchOperation;
}

function splitToPatch(
    split: Awaited<ReturnType<typeof getSplitsForUser>>[number],
) {
    return {
        op: "put",
        key: splitKey(split.groupId, split.id),
        value: split,
    } satisfies PatchOperation;
}

function groupToPatch(
    group: Awaited<ReturnType<typeof getGroupsForUser>>[number],
) {
    return {
        op: "put",
        key: groupKey(group.id),
        value: group,
    } satisfies PatchOperation;
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
    return rows.user_to_group
        .flatMap((ug) => ug.group.expenses)
        .map(parseExpense);
}

function parseExpense(e: typeof schema.expenses.$inferSelect) {
    return new Parser(e)
        .replace("reimbursed_at", "status", () => "paid" as "paid" | "unpaid")
        .default("status", "unpaid")
        .rename("paid_by_user_id", "paidBy")
        .allDatesTOUnixMillis()
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
    const rows = await db
        .select({
            user: schema.users,
            owed: schema.owed.amount,
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
        .leftJoin(
            schema.owed,
            and(
                eq(schema.owed.from_user_id, schema.users.id),
                eq(schema.owed.to_user_id, userID),
                eq(schema.owed.group_id, schema.users_to_group.group_id),
            ),
        )
        .where(eq(schema.users_to_group.user_id, userID));

    const owed = await getOwedForUser(userID);

    type GroupId = string;
    const numRows = rows.length;

    type ParsedRow = {
        owed: number;
        groupID: GroupId;
        user: ReturnType<typeof parseUser>;
    };
    const parsedRows: Array<ParsedRow> = new Array(numRows);

    for (let i = 0; i < numRows; i++) {
        const row = rows[i];
        if (row.owed == null && row.user.id != userID) {
            console.error(
                `no owed between ${userID} and ${row.user.id} in ${row.groupID}`,
            );
        }
        if (row.groupID == null) {
            console.error(`no group for user ${row.user.id}`);
            continue;
        }
        const parsedRow = {
            groupID: row.groupID,
            user: parseUser(row.user),
            owed: 0,
        };
        parsedRows[i] = parsedRow;
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
        uniqueUsers.get(user.id)!.owed += user.owed;
    }
    for (const [owedUserID, owedToUserAmount] of owed.total) {
        const owedUser = uniqueUsers.get(owedUserID)
        if (owedUser == null) {
            console.error("could not find owed user")
            continue
        }
        owedUser.owed = owedToUserAmount
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
    return new Parser(u)
        .allDatesTOUnixMillis()
        .allKeysToCamelCase()
        .value()
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
    return rows.user_to_group.flatMap((r) => r.group.splits).map(parseSplit);
}

type DBSplit = typeof schema.splits.$inferSelect & {
    portions: Array<typeof schema.split_portion_def.$inferSelect>;
};

function parseSplit(s: DBSplit) {
    return new Parser(s)
        .reassign(
            "portions",
            (portions) => Object.fromEntries(portions.map((p) => [p.user_id, parseFloat(p.parts)])),
        )
        .rename("group_id", "groupId")
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
    return rows.user_to_group.map((r) => r.group);
}

async function getOwedForUser(userID: string) {
    const rows = await db.query.users_to_group.findMany({
        where: eq(schema.users_to_group.user_id, userID),
        with: {
            group: {
                with: {
                    expenses: {
                        with: {
                            split: {
                                with: {
                                    portions: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }

    type UserID = string
    type GroupID = string

    const total = new Map<UserID, number>();
    const perGroup = new Map<GroupID, Map<UserID, number>>();
    const updateTotal = (userID: string, amount: number) => {
        const totalOwed = total.get(userID) ?? 0
        total.set(userID, totalOwed + amount)
    }
    const updatePerGroup = (groupID: string, userID: string, amount: number) => {
        const groupOwed = perGroup.get(groupID)!.get(userID) ?? 0
        perGroup.get(groupID)!.set(userID, groupOwed + amount)
    }

    for (const row of rows) {
        const groupID = row.group.id
        if (!perGroup.has(groupID)) {
            perGroup.set(groupID, new Map())
        }
        for (const expense of row.group.expenses) {
            const amount = expense.amount;
            const split = expense.split
            const paidByUserID = expense.paid_by_user_id;
            const owed = calculateOwed(userID, paidByUserID, amount, split.portions)

            for (const [owedUserID, owedAmount] of owed) {
                updatePerGroup(groupID, owedUserID, owedAmount)
                updateTotal(owedUserID, owedAmount)
            }
        }
    }
    return {
        total,
        perGroup
    }
}

export function calculatePortion({amount, partsOwed, totalParts}: {amount: number, partsOwed: number, totalParts: number}) {
        return (amount * partsOwed) / totalParts
}

export function getTotalParts(portions: Array<{parts: string}>) {
    let total = 0;
    for (const p of portions) {
        total += parseFloat(p.parts);
    }
    console.assert(!isNaN(total), "total parts is NaN")
    console.assert(total > 0, "total parts is <= 0")
    if (total <= 0 ) {
        return 1
    }
    return total
}

function calculateOwed(userID: string, paidByUserID: string, amount: number, portionDefs: Array<{parts: string, user_id: string}>) {
    const totalParts = getTotalParts(portionDefs)
    const owed = new Array<[string, number]>(portionDefs.length)
    for (let i = 0; i < portionDefs.length; i++) {
        const pDef = portionDefs[i]
        const partsOwed = parseFloat(pDef.parts)

        // by default, portion equals to the amount owed by the current user
        // to another user who paid for the expense
        const portion = calculatePortion({amount, partsOwed, totalParts})


        const portionIsForUser = pDef.user_id === userID
        const paidByUser = paidByUserID === userID

        const doesNotInvolveCurrentUser = !portionIsForUser && !paidByUser
        const isPortionOfExpensePaidByCurUser = portionIsForUser && paidByUser
        const isOwedToAnotherUser = portionIsForUser && !paidByUser
        const isOwedToCurUser = !portionIsForUser && paidByUser

        let owedToUser = 0

        switch (true) {
            case isPortionOfExpensePaidByCurUser:
                // if the user paid for the expense and the portion is for the user
                // then the user is owed the full amount minus their portion
                owedToUser = amount - portion
                break
            case doesNotInvolveCurrentUser:
                // if the user didn't pay for the expense and the portion is not for the user
                // then we don't care!
                owedToUser = 0
                break
            case isOwedToAnotherUser:
                // if the user didn't pay for the expense and the portion is for the user
                // then the current users balance should be reduced by their portion
                owedToUser = -owedToUser
                break
            case isOwedToCurUser:
                // if the user paid for the expense and the portion is for another user
                // they owe the full portion
                owedToUser = portion
                break
        }

        owed[i] = [pDef.user_id, owedToUser]
    }
    return owed
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

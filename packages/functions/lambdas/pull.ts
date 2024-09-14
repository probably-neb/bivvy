import { alias, db, eq, schema, sql, drizzle } from "@paypals/db";
import { session as Session } from "auth/session";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ClientGroupTable } from "lib/client-table";
import type { ClientID, JSONValue, ReadonlyJSONValue } from "replicache";
// import { ApiHandler } from "sst/node/api";
// import { useSession } from "sst/node/auth";
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

type PutOperation = {
    op: "put";
    key: string;
    value: JSONValue;
};

type DelOperation = {
    op: "del";
    key: string;
};

type ClearOperation = {
    op: "clear";
};

type PatchOperation = PutOperation | DelOperation | ClearOperation;

const CLEAR_OP: PatchOperation = { op: "clear" };

function errResponse(body: any) {
    return {
        statusCode: 400,
        body: JSON.stringify(body),
        headers: {
            "content-type": "application/json",
        },
    } as const;
}

function okResponse(body: PullResponse) {
    return {
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
            "content-type": "application/json",
        },
    } as const;
}

const zBodyParser = z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(zPullRequest);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    const body = zBodyParser.safeParse(event.body);
    if (!body.success) {
        console.error("Invalid body", body.error, body);
        return errResponse({ ok: false, error: "Invalid Request" });
    }
    const session = await Session.verify(event.headers.authorization);
    if (session.type !== "user") {
        console.error("Invalid session", session);
        return errResponse({ ok: false, error: "Invalid session" });
    }
    const userID = session.properties.userId;
    console.log("user id", userID);

    const { clientGroupID, schemaVersion: _, cookie } = body.data;
    // TODO: check schema version
    console.log("client data", body.data);

    const lastMutations = (await getLastMutations(clientGroupID, userID)) ?? {};
    console.log("got last mutations", lastMutations);

    let patches: PatchOperation[];
    try {
        patches = await constructPatches(userID);
        console.log("constructed patches", patches.length);
    } catch (e) {
        console.error("failed to construct patches", e);
        patches = [];
    }

    const response: PullResponse = {
        cookie: cookie == null ? 0 : cookie + 1,
        lastMutationIDChanges: lastMutations,
        patch: patches,
    };

    return dbg(okResponse(response), "ok response");
};

async function constructPatches(userID: string) {
    const getUsers = getUsersForUser(userID);
    const getExpenses = getExpensesForUser(userID);
    const getSplits = getSplitsForUser(userID);
    const getGroups = getGroupsForUser(userID);

    let expenses: Awaited<typeof getExpenses>;
    let users: Awaited<typeof getUsers>["unique"];
    let groupUsers: Awaited<typeof getUsers>["group"];
    let groups: Awaited<typeof getGroups>;
    let splits: Awaited<typeof getSplits>;
    try {
        [expenses, { unique: users, group: groupUsers }, splits, groups] =
            await Promise.all([getExpenses, getUsers, getSplits, getGroups]);
    } catch (e) {
        console.error("failed to fetch data from db", e);
        return [];
    }

    let patchCount: number = 0;
    {
        // 1 for the clear operation, 1 for the user id
        const constPatchCount = 2;
        patchCount += constPatchCount;

        patchCount += expenses.length;
        patchCount += users.length;
        patchCount += splits.length;
        patchCount += groups.length;

        for (const groupUserArr of groupUsers.values()) {
            patchCount += groupUserArr.length;
        }
    }
    console.log("num patches", patchCount);

    const patches = new Array<PutOperation>(patchCount);

    for (let i = 0; i < patches.length; i++) {
        patches[i] = {
            op: "put",
            key: null as unknown as string,
            value: null as JSONValue,
        };
    }

    // store constant patches
    // clear
    // @ts-expect-error
    patches[0] = CLEAR_OP;
    // userID
    patches[1].key = "userID";
    patches[1].value = userID;

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
        "forgot to include some patches or numPatches computed incorrectly"
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

function groupUserKey(groupId: string, userId: string) {
    return groupItemKey(groupId, "user", userId);
}

function groupKey(groupId: string) {
    return "groups/" + groupId;
}

async function getExpensesForUser(userID: string) {
    const rows = await db
        .select({
            ...drizzle.getTableColumns(schema.expenses),
        })
        .from(schema.expenses)
        .leftJoin(
            schema.users_to_group,
            eq(schema.users_to_group.group_id, schema.expenses.group_id)
        )
        .where(
            drizzle.and(
                drizzle.eq(schema.users_to_group.user_id, userID)
            )
        );
    if (!rows) {
        throw new Error("User not found");
    }

    const expenses = Parser.all(rows)
        .replace("reimbursed_at", "status", () => "paid" as "paid" | "unpaid")
        .default("status", "unpaid")
        .rename("paid_by_user_id", "paidBy")
        .rename("paid_on", "paidOn")
        .rename("split_id", "splitId")
        .rename("created_at", "createdAt")
        .rename("group_id", "groupId")
        .expectNoSnakeCaseKeys()
        .toUnixMillis("paidOn", "createdAt")
        .value();

    return expenses;
}

async function getUsersForUser(userID: string) {
    const user_groups_users_to_group = alias(
        schema.users_to_group,
        "group_users_to_group"
    );
    // TODO: figure out if (and how to fix) users being returned just a single
    // time with the amount owed across different groups
    const getRows = db
        .select({
            user: {
                ...drizzle.getTableColumns(schema.users),
            },
            groupID: user_groups_users_to_group.group_id,
        })
        .from(schema.users_to_group)
        .leftJoin(
            user_groups_users_to_group,
            eq(
                user_groups_users_to_group.group_id,
                schema.users_to_group.group_id
            )
        )
        .rightJoin(
            schema.users,
            eq(schema.users.id, user_groups_users_to_group.user_id)
        )
        .where(eq(schema.users_to_group.user_id, userID));

    const getOwed = getOwedForUser(userID);
    const [rows, owed] = await Promise.all([getRows, getOwed]);

    const users = Parser.all(rows)
        .runParserOnNested("user", (p) =>
            p.toUnixMillis("created_at").rename("created_at", "createdAt")
        )
        .toUnixMillis()
        .add("owed", 0)
        .value();

    const userCount = users.length;

    console.dir({ rows, owed }, { depth: null });

    type User = typeof users[number]["user"] & { owed: number };

    const uniqueUsers = new Map<string, User>();
    const groupUsers = new Map<string, User[]>();

    for (let i = 0; i < userCount; i++) {
        const row = users[i];
        const groupID = row.groupID;
        const userID = row.user.id;
        if (groupID == null) {
            console.warn(
                "no groupID for user",
                userID,
                row.user.name,
                "... skipping"
            );
            continue;
        }
        const owedToUser = owed.perGroup.get(groupID)?.get(userID) ?? 0;
        const user = Object.assign(row.user, { owed: owedToUser });

        if (!groupUsers.has(groupID)) {
            groupUsers.set(groupID, []);
        }
        groupUsers.get(groupID)?.push(user);

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
        uniqueUsers.set(
            owedUserID,
            Object.assign({}, owedUser, { owed: owedToUserAmount })
        );
    }
    const uniqueUsersArray = Array.from(uniqueUsers.values());
    const res = {
        unique: uniqueUsersArray,
        group: groupUsers,
    };
    return res;
}

async function getSplitsForUser(userID: string) {
    const rows = await db
        .select({
            ...drizzle.getTableColumns(schema.splits),
            portions:
                drizzle.sql<string> // Record<string, number>
                `(SELECT JSON_GROUP_OBJECT(${schema.split_portion_def.user_id}, ${schema.split_portion_def.parts}) FROM ${schema.split_portion_def} WHERE ${schema.split_portion_def.split_id} = ${schema.splits.id})`.as(
                    "portions"
                ),
        })
        .from(schema.splits)
        .leftJoin(
            schema.users_to_group,
            drizzle.eq(schema.users_to_group.group_id, schema.splits.group_id)
        )
        .where(drizzle.eq(schema.users_to_group.user_id, userID));
    if (!rows) {
        throw new Error("User not found");
    }
    const splits = Parser.all(rows)
        .rename("group_id", "groupId")
        .rename("is_one_off", "isOneOff")
        .jsonDecode<"portions", Record<string, number>>("portions")
        .value();
    return splits;
}

async function getGroupsForUser(userID: string) {
    const rows = await db
        .select(drizzle.getTableColumns(schema.groups))
        .from(schema.groups)
        .leftJoin(
            schema.users_to_group,
            drizzle.and(
                drizzle.eq(schema.users_to_group.user_id, userID),
                drizzle.eq(schema.users_to_group.group_id, schema.groups.id)
            )
        );
    if (!rows) {
        throw new Error("User not found");
    }
    const groups = Parser.all(rows)
        .rename("owner_id", "ownerId")
        .rename("created_at", "createdAt")
        .toUnixMillis("createdAt")
        .value();
    return groups;
}

async function getOwedForUser(userID: string) {
    const rows = await db.query.users_to_group.findMany({
        where: eq(schema.users_to_group.user_id, userID),
        with: {
            group: {
                columns: { id: true },
                with: {
                    expenses: {
                        columns: {
                            description: true,
                            id: true,
                            amount: true,
                            paid_by_user_id: true,
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
        amount: number
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
                console.error(
                    `split for expense ${JSON.stringify(expense)} is null`
                );
            }
            // FIXME: portions should never be null. Expenses should have a check to ensure
            // the split exists
            let portions = split == null ? [] : split.portions;
            const paidByUserID = expense.paid_by_user_id;
            // console.log(`=======\nEXPENSE: ${expense.description}`);
            const owed = calculateOwed(userID, paidByUserID, amount, portions);

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
    totalParts: number
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
    portionDefs: Array<{ parts: number; user_id: string }>
) {
    const totalParts = getTotalParts(portionDefs);
    const owed = new Array<[string, number]>();

    let userParts = 0;
    for (let i = 0; i < portionDefs.length; i++) {
        const pdef = portionDefs[i];
        if (pdef.user_id === userID) {
            userParts = pdef.parts;
            break;
        }
    }
    const userPortion = calculatePortion(amount, userParts, totalParts);

    const paidByUser = paidByUserID === userID;

    if (!paidByUser) {
        // If not paid by user and user owes nothing we don't care anymore
        if (userParts === 0) return owed;

        // If another user paid for the expense they are owed the requesting
        // users portion and the requesting user is owed their portion less
        owed.push([paidByUserID, userPortion]);
        owed.push([userID, -userPortion]);
        return owed;
    }

    // if the user paid for the expense they are owed the amount of the expense
    // minus their portion
    owed.push([userID, amount - userPortion]);

    for (let i = 0; i < portionDefs.length; i++) {
        const pdef = portionDefs[i];

        const portionUserID = pdef.user_id;
        if (portionUserID === userID) continue;

        const portionParts = pdef.parts;
        if (portionParts === 0) continue;

        const portion = calculatePortion(amount, portionParts, totalParts);

        // if the user paid for the expense the other users are owed
        // their portion less
        owed.push([portionUserID, -portion]);
    }
    return owed;
}

function dbg<T>(val: T, label?: string) {
    if (label != null) {
        console.dir({ [label]: val }, { depth: null });
        return val;
    }
    console.dir(val, { depth: null });
    return val;
}

async function getLastMutations(
    clientGroupId: string,
    userId: string
): Promise<Record<string, number> | null> {
    const ct = new ClientGroupTable(clientGroupId);
    const ok = await ct.get();
    if (!ok) {
        return null;
    }
    const ctOwnerId = ct.ownerUserId;
    if (ctOwnerId != null && ctOwnerId !== userId) {
        throw new Error("client group does not belong to user");
    }
    const lastMutationsMap = ct.getLastMutations();
    const lastMutations = Object.fromEntries(lastMutationsMap);
    return lastMutations;
}

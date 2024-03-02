import { alias, and, db, eq, schema, sql } from "@paypals/db";
import type { ClientID, JSONValue, ReadonlyJSONValue } from "replicache";
import { ApiHandler, useHeader } from "sst/node/api";
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
    pullVersion: z.literal(1),
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
    lastMutationIDChanges: Record<ClientID, number>;
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
    const pullRequest = body.data;
    const patches = await constructPatches(session.properties.userId);
    const cookie = pullRequest.cookie != null ? pullRequest.cookie + 1 : 0;
    const response: PullResponse = {
        cookie,
        lastMutationIDChanges: {},
        patch: patches,
    };
    return okResponse(response);
});

async function constructPatches(profileID: string) {
    const expenses = await getExpensesForUser(profileID);
    const {unique: users, group: groupUsers} = await getUsersForUser(profileID)
    const splits = await getSplitsForUser(profileID);
    const groups = await getGroupsForUser(profileID);

    let numPatches = expenses.length + users.length + splits.length + groups.length
    for (const groupUserArr of groupUsers.values()) {
        numPatches += groupUserArr.length
    }

    const patches = new Array<PatchOperation>(numPatches + 1)
    patches[0] = CLEAR_OP

    let i = 0;
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
    console.assert(patches.every((p) => p != null), "forgot to include some patches or numPatches computed incorrectly")

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
        key: expenseKey(expense.group_id, expense.id),
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

function groupUsersToPatches(
    users: Awaited<ReturnType<typeof getUsersForUser>>["group"],
) {
    const patches = new Array<PatchOperation>();
    return patches;
}

function splitToPatch(
    split: Awaited<ReturnType<typeof getSplitsForUser>>[number],
) {
    return {
        op: "put",
        key: splitKey(split.group_id, split.id),
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
        .allDatesTOUnixMillis()
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

    type GroupId = string;
    const totalOwedPerGroup = new Map<GroupId, number>();
    function addOwed(groupID: GroupId, owed: number) {
        totalOwedPerGroup.set(
            groupID,
            (totalOwedPerGroup.get(groupID) ?? 0) + owed,
        );
    }

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
        const owed = row.owed ?? 0;
        if (row.groupID == null) {
            console.error(`no group for user ${row.user.id}`);
            continue;
        }
        addOwed(row.groupID, owed);
        const parsedRow = {
            owed,
            groupID: row.groupID,
            user: parseUser(row.user),
        };
        parsedRows[i] = parsedRow;
    }

    const uniqueUsers = new Map<string, User>();
    const groupUsers = new Map<GroupId, User[]>();

    for (let i = 0; i < numRows; i++) {
        const row = parsedRows[i];
        const groupId = row.groupID;
        const user = Object.assign(row.user, { owed: row.owed });
        if (user.id == userID) {
            user.owed = totalOwedPerGroup.get(groupId)!;
        }

        if (!groupUsers.has(groupId)) {
            groupUsers.set(groupId, []);
        }
        groupUsers.get(row.groupID)?.push(user);

        if (!uniqueUsers.has(user.id)) {
            uniqueUsers.set(user.id, user);
            continue;
        }
        uniqueUsers.get(user.id)!.owed += user.owed;
    }
    const uniqueUsersArray = Array.from(uniqueUsers.values());
    const res = {
        unique: uniqueUsersArray,
        group: groupUsers,
    };
    return res
}

type User = ReturnType<typeof parseUser> & { owed: number };

function parseUser(u: typeof schema.users.$inferSelect) {
    return new Parser(u).allDatesTOUnixMillis().value();
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
                            splits: true,
                        },
                    },
                },
            },
        },
    });
    if (!rows) {
        throw new Error("User not found");
    }
    return rows.user_to_group.flatMap((r) => r.group.splits);
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

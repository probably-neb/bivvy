import { alias, and, db, eq, schema, sql } from "@paypals/db";
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
    pullVersion: z.literal(1),
    clientGroupID: z.string(),
    cookie: z.number().positive(),
    ProfileID: z.string(),
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
    const response: PullResponse = {
        cookie: pullRequest.cookie + 1,
        lastMutationIDChanges: {},
        patch: patches,
    };
    return okResponse(response);
});

async function constructPatches(profileID: string) {
    const expenses = await getExpensesForUser(profileID).then((expenses) =>
        expenses.map(expenseToPatch),
    );
    const users = await getUsersForUser(profileID).then((users) => users.map(userToPatch));
    const splits = await getSplitsForUser(profileID).then((splits) => splits.map(splitToPatch));
    const groups = await getGroupsForUser(profileID).then((groups) => groups.map(groupToPatch));

    // @ts-ignore
    const patches: Array<PatchOperation> = expenses.concat(users).concat(splits).concat(groups);

    return patches
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

function userToPatch(user: ReturnType<typeof parseUser>) {
    return {
        op: "put",
        key: userKey(user.id),
        value: user,
    } satisfies PatchOperation;
}

function splitToPatch(split: Awaited<ReturnType<typeof getSplitsForUser>>[number]) {
    return {
        op: "put",
        key: splitKey(split.group_id, split.id),
        value: split,
    } satisfies PatchOperation;
}

function groupToPatch(group: Awaited<ReturnType<typeof getGroupsForUser>>[number]) {
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
    const user_groups_users = alias(schema.users, "group_users");
    // TODO: figure out if (and how to fix) users being returned just a single
    // time with the amount owed across different groups
    const rows = await db
        .select({
            user: user_groups_users,
            owed: schema.owed.amount,
        })
        .from(schema.users)
        .leftJoin(
            schema.users_to_group,
            eq(schema.users_to_group.user_id, userID),
        )
        .leftJoin(
            user_groups_users_to_group,
            eq(
                user_groups_users_to_group.group_id,
                schema.users_to_group.group_id,
            ),
        )
        .rightJoin(
            user_groups_users,
            eq(user_groups_users.id, user_groups_users_to_group.user_id),
        )
        .leftJoin(
            schema.owed,
            and(
                eq(schema.owed.from_user_id, schema.users.id),
                eq(schema.owed.to_user_id, userID),
                eq(schema.owed.group_id, user_groups_users_to_group.group_id),
            ),
        )
        .where(eq(schema.users.id, userID));

    let totalOwed = 0;
    const numRows = rows.length;

    const users: Array<ReturnType<typeof parseUser>> = new Array(numRows);

    for (let i = 0; i < numRows; i++) {
        const row = rows[i];
        if (row.owed == null && row.user.id != userID) {
            console.error(`no owed between ${userID} and ${row.user.id}`);
        }
        const owed = row.owed ?? 0;
        totalOwed += owed;
        const user = parseUser(row.user, owed);
        users[i] = user;
    }
    for (let i = 0; i < numRows; i++) {
        if (users[i].id == userID) {
            users[i].owed = totalOwed;
        }
    }
    return users;
}

function parseUser(u: typeof schema.users.$inferSelect, owed: number) {
    return new Parser(u).allDatesTOUnixMillis().add("owed", owed).value();
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

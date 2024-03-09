import { relations, sql} from "drizzle-orm";
import {
    sqliteTable as table,
    int,
    real as decimal,
    text,
    unique,
    index,
    primaryKey,
} from "drizzle-orm/sqlite-core";

function uint(name: string) {
    // return int(name, { unsigned: true });
    return int(name);
}

function _id(name: string) {
    return text(name, { length: 21 });
}

function id(name: string) {
    return _id(name).primaryKey();
}

function idRef(name: string) {
    return _id(name);
}

// the amount in cents
function ucents(name: string) {
    return uint(name);
}
function cents(name: string) {
    return int(name);
}

function parts(name: string) {
    // return decimal(name, { precision: 12, scale: 10 });
    return int(name);
}

function timestamp(name: string) {
    return int(name, {mode: "timestamp"})
}

function timestampDefaultNow(name: string) {
    return int(name, {mode: "timestamp"}).default(sql`(datetime('now'))`)
}

export const users = table(
    "users",
    {
        id: id("id"),
        name: text("name", { length: 255 }).notNull(),
        created_at: timestampDefaultNow("created_at"),
        email: text("email", { length: 255 }),
        profileUrl: text("profile_url", { length: 512 }),
    },
);

export const userRelations = relations(users, ({ many }) => ({
    user_to_group: many(users_to_group)
}));

export const users_to_group = table(
    "users_to_group",
    {
        user_id: idRef("user_id").notNull(),
        group_id: idRef("group_id").notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.user_id, t.group_id] }),
        gid_idx: index("utg_group_idx").on(t.group_id),
    }),
);

export const usersToGroupRelations = relations(users_to_group, ({ one }) => ({
    user: one(users, {
        fields: [users_to_group.user_id],
        references: [users.id],
    }),
    group: one(groups, {
        fields: [users_to_group.group_id],
        references: [groups.id],
    }),
}));

export const groups = table(
    "groups",
    {
        id: id("id"),
        name: text("name", { length: 255 }).notNull(),
    },
);

export const groupRelations = relations(groups, ({ many }) => ({
    users_to_group: many(users_to_group),
    expenses: many(expenses),
    splits: many(splits),
}))

export const expenses = table(
    "expenses",
    {
        id: id("id"),
        description: text("description").notNull(),
        created_at: timestampDefaultNow("created_at").notNull(),
        paid_on: timestamp("paid_on"),
        paid_by_user_id: idRef("paid_by_user_id").notNull(),
        amount: ucents("amount").notNull(),
        reimbursed_at: timestamp("reimbursed_at"),
        split_id: idRef("split_id").notNull(),
        group_id: idRef("group_id").notNull(),
    },
    (t) => ({
        group_idx: index("expense_group_idx").on(t.group_id),
    }),
);

export const expenseRelations = relations(expenses, ({ one, many}) => ({
    paid_by: one(users, {
        fields: [expenses.paid_by_user_id],
        references: [users.id],
    }),
    split: one(splits, {
        fields: [expenses.split_id],
        references: [splits.id],
    }),
    group: one(groups, {
        fields: [expenses.group_id],
        references: [groups.id],
    })
}));

export const splits = table(
    "splits",
    {
        id: id("id"),
        name: text("name", { length: 255 }).notNull(),
        group_id: idRef("group_id").notNull(),
        color: text("color", { length: 7 }),
    },
    (t) => ({
        group_idx: index("split_group_idx").on(t.group_id),
        name_un: unique("split_name_un").on(t.name, t.group_id),
    }),
);

export const splitRelations = relations(splits, ({many, one }) => ({
    group: one(groups, {
        fields: [splits.group_id],
        references: [groups.id],
    }),
    portions: many(split_portion_def)
}));

export const split_portion_def = table("split_portion_def", {
    split_id: idRef("split_id").notNull(),
    parts: parts("parts").notNull(),
    user_id: idRef("user_id").notNull(),
    total_parts: parts("total_parts").notNull().default(1.0),
});

export const splitPortionDefRelations = relations(
    split_portion_def,
    ({ one }) => ({
        user: one(users, {
            fields: [split_portion_def.user_id],
            references: [users.id],
        }),
        split: one(splits, {
            fields: [split_portion_def.split_id],
            references: [splits.id],
        }),
    }),
);

export const invites = table("invites", {
    id: id("id"),
    group_id: idRef("group_id").notNull(),
    created_at: timestampDefaultNow("created_at").notNull(),
    accepted_at: timestamp("accepted_at"),
})

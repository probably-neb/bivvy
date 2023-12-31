import { relations } from "drizzle-orm";
import {
    mysqlTable as table,
    varchar,
    timestamp,
    int,
    decimal,
    text,
    unique,
    index,
    primaryKey,
} from "drizzle-orm/mysql-core";

function uint(name: string) {
    return int(name, { unsigned: true });
}

function _id(name: string) {
    return varchar(name, { length: 21 });
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

function percentage(name: string) {
    return decimal(name, { precision: 12, scale: 10 }).notNull();
}

export const users = table(
    "users",
    {
        id: id("id"),
        name: varchar("name", { length: 255 }).notNull(),
        created_at: timestamp("created_at").defaultNow(),
    },
    (t) => ({
        pk_idx: index("pk_idx").on(t.id),
    }),
);

export const users_to_group = table("users_to_group", {
    user_id: idRef("user_id").notNull(),
    group_id: idRef("group_id").notNull(),
}, (t) => ({
    pk: primaryKey({columns: [t.user_id, t.group_id]}),
    pk_idx: index("utg_idx").on(t.user_id, t.group_id),
    gid_idx: index("gid_idx").on(t.group_id),
}));

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

// caches owed amounts between users to avoid having to calculate them
// constantly
//
// the usage is a bit tricky, but it's worth it to avoid having to calculate
// the `amount` corresponds to what `user_a_id` owes `user_b_id` and can be negative
// i.e. if `user_a` owes `user_b` then `amount` will be negative
// there will be two rows in the table, one for each direction and **should** always
// be the same magnitude but opposite sign
export const owed = table(
    "owed",
    {
        from_user_id: idRef("from_user_id").notNull(),
        to_user_id: idRef("to_user_id").notNull(),
        group_id: idRef("group_id").notNull(),
        amount: cents("amount").notNull(),
    },
    (t) => ({
        // all possible combinations of `from_user_id`, `to_user_id`, `group_id` should be unique
        owed_un: unique("owed_un").on(t.from_user_id, t.to_user_id, t.group_id),
        // when finding the amount owed by a single other user
        owed_idx: index("owed_idx").on(
            t.from_user_id,
            t.to_user_id,
            t.group_id,
        ),
        // when finding the amount owed by the other users in the group
        // always query using the `to_user_id` col
        owed_to_idx: index("owed_to_idx").on(t.to_user_id, t.group_id),
    }),
);

export const groups = table("groups", {
    id: id("id"),
    name: varchar("name", { length: 255 }).notNull(),
}, (t) => ({
    pk_idx: index("pk_idx").on(t.id),
}));

export const expenses_to_group = table("expenses_to_group", {
    expense_id: idRef("expense_id").notNull(),
    group_id: idRef("group_id").notNull(),
}, (t) => ({
    pk: primaryKey({columns: [t.expense_id, t.group_id]}),
    pk_idx: index("etg_idx").on(t.expense_id, t.group_id),
    gid_idx: index("gid_idx").on(t.group_id),
}));

export const expensesToGroupRelations = relations(
    expenses_to_group,
    ({ one }) => ({
        expense: one(expenses, {
            fields: [expenses_to_group.expense_id],
            references: [expenses.id],
        }),
        group: one(groups, {
            fields: [expenses_to_group.group_id],
            references: [groups.id],
        }),
    }),
);

export const expenses = table("expenses", {
    id: id("id"),
    description: text("description").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    paid_on: timestamp("paid_on"),
    paid_by_user_id: idRef("paid_by_user_id").notNull(),
    amount: ucents("amount").notNull(),
    reimbursed_at: timestamp("reimbursed_at"),
    split_id: idRef("split_id").notNull(),
}, (t) => ({
    pk_idx: index("pk_idx").on(t.id),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
    paid_by: one(users, {
        fields: [expenses.paid_by_user_id],
        references: [users.id],
    }),
    split: one(splits, {
        fields: [expenses.split_id],
        references: [splits.id],
    }),
}));

export const splits = table("splits", {
    id: id("id"),
    name: varchar("name", { length: 255 }).notNull(),
    group_id: idRef("group_id").notNull(),
});

export const splitRelations = relations(splits, ({ one }) => ({
    group: one(groups, {
        fields: [splits.group_id],
        references: [groups.id],
    }),
}));

export const split_portion_def = table("split_portion_def", {
    split_id: idRef("split_id").notNull(),
    percentage: percentage("percentage"),
    user_id: idRef("user_id"),
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

export const split_portion = table("split_portion", {
    split_id: idRef("split_id").notNull(),
    expense_id: idRef("expense_id").notNull(),
    user_id: idRef("user_id").notNull(),
    total_amount: ucents("total_amount").notNull(),
    reimbursed_amount: ucents("reimbursed_amount").default(0),
    reimbursed_at: timestamp("reimbursed_at"),
});

export const splitPortionRelations = relations(split_portion, ({ one }) => ({
    user: one(users, {
        fields: [split_portion.user_id],
        references: [users.id],
    }),
    split: one(splits, {
        fields: [split_portion.split_id],
        references: [splits.id],
    }),
    expense: one(expenses, {
        fields: [split_portion.expense_id],
        references: [expenses.id],
    }),
}));

export const payments = table("payments", {
    id: id("id"),
    timestamp: timestamp("timestamp").defaultNow(),
    from_user_id: idRef("from_user_id").notNull(),
    to_user_id: idRef("to_user_id").notNull(),
    group_id: idRef("group_id").notNull(),
    amount: ucents("amount").notNull(),
});

export const paymentRelations = relations(payments, ({ one }) => ({
    from_user: one(users, {
        fields: [payments.from_user_id],
        references: [users.id],
    }),
    to_user: one(users, {
        fields: [payments.to_user_id],
        references: [users.id],
    }),
    group: one(groups, {
        fields: [payments.group_id],
        references: [groups.id],
    }),
}));

export const payment_splits = table("payment_splits", {
    id: id("id"),
    payment_id: idRef("payment_id").notNull(),
    split_portion_id: idRef("split_portion_id").notNull(),
    amount: ucents("amount").notNull(),
});

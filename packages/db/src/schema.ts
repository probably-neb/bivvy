import { relations } from "drizzle-orm";
import {
    mysqlTable as table,
    varchar,
    timestamp,
    int,
    decimal,
    boolean,
} from "drizzle-orm/mysql-core";

function id(name: string) {
    return int(name, { unsigned: true }).autoincrement().primaryKey();
}

// the amount in cents
function amount() {
    return int("amount").notNull();
}

function percentage() {
    return decimal("percentage", { precision: 2, scale: 2 }).notNull();
}

export const users = table("users", {
    id: id("id"),
    name: varchar("name", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
});

export const users_to_group = table("users_to_group", {
    user_id: int("user_id").notNull(),
    group_id: int("group_id").notNull(),
});

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

export const groups = table("groups", {
    id: id("id"),
    name: varchar("name", { length: 255 }).notNull(),
});

export const expenses_to_group = table("expenses_to_group", {
    expense_id: int("expense_id").notNull(),
    group_id: int("group_id").notNull(),
});

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
    created_at: timestamp("created_at").defaultNow(),
    paid_on: timestamp("paid_on"),
    paid_by: int("paid_by").notNull(),
    amount: amount(),
    reimbursed_at: timestamp("reimbursed_at"),
    split_id: int("split_id").notNull(),
});

export const expenseRelations = relations(expenses, ({ one }) => ({
    paid_by: one(users, {
        fields: [expenses.paid_by],
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
    group_id: int("group_id").notNull(),
});

export const splitRelations = relations(splits, ({ one }) => ({
    group: one(groups, {
        fields: [splits.group_id],
        references: [groups.id],
    }),
}));

export const split_portion_def = table("split_portion_def", {
    split_id: int("split_id").notNull(),
    percentage: int("percentage", { unsigned: true }),
    user_id: int("user_id"),
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
    split_id: varchar("split_id", { length: 255 }).notNull(),
    expense_id: varchar("expense_id", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    amount: amount(),
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

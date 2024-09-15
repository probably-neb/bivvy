import { db, schema, sql } from "@paypals/db";

export async function handler() {
    const [info] = await db
        .select({
            total: sql<number>`sum(${schema.expenses.amount})`,
            avg: sql<number>`avg(${schema.expenses.amount})`,
            count: sql<number>`count(${schema.expenses.amount})`,
        })
        .from(schema.expenses);
    info.total /= 100.0;
    info.avg /= 100.0;
    console.dir(info, { depth: null });
}

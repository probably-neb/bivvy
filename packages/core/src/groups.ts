export * as Groups from './groups';

import { db, schema } from "@paypals/db"

export async function get(id: number) { }

export async function create(name: string, owner_id: number) { }

export async function remove(id: number) { }

export async function rename(id: number, name: string) { }

export async function addMember(id: number, user_id: number) { }

export async function removeMember(id: number, user_id: number) { }

export async function members(id: number) { }

export async function getInviteUrl(id: number) { }

export async function acceptInvite(url: string) { }

export async function listInvites(id: number) { }

export async function expenses(id: number) {
    const expenses = await db.select().from(schema.expenses)
    return expenses
}

export async function addExpense(group_id: number, user_id: number, amount: number, description: string, split_id: number) { }

export async function removeExpense(id: number) { }

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {TiUserOutline} from "solid-icons/ti";
import { Expense, useExpense } from "@/lib/rep";

export function ViewExpenseCard({expenseId}: {expenseId: Expense["id"]}) {
    const expense = useExpense(expenseId);
    console.log(expense());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="flex items-center space-x-4">
                    <TiUserOutline />
                    <div>
                        <div class="font-bold text-lg">{expense()?.payer}</div>
                        <div class="text-gray-500">Amount: ${expense()?.amount}</div>
                        <div class="text-gray-500">Status: {expense()?.status}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {TiUserOutline} from "solid-icons/ti";

export function ViewExpenseCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="flex items-center space-x-4">
                    <TiUserOutline />
                    <div>
                        <div class="font-bold text-lg">Jane Doe</div>
                        <div class="text-gray-500">Amount: $300</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


import { For } from "solid-js";
import { TbUser } from "solid-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewCard() {
    return (
        <Card class="pt-4">
            <CardContent class="flex justify-between items-center">
                <div class="flex flex-col gap-2">
                <div class="text-lg font-bold">Total Owed: $500</div>
                    <For each={[{name: "John Doe", amount: 200}, {name: "Jane Doe", amount: 300}]}>
                        {(user) => (
                            <div class="flex gap-2 items-center">
                                <TbUser /> <span>{user.name}</span> <span>${user.amount}</span>
                            </div>
                        )}
                    </For>
                </div>
                <Button variant="outline">Pay Now</Button>
            </CardContent>
        </Card>
    );
}

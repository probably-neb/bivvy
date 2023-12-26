import { For, createMemo } from "solid-js";
import { Card, CardContent } from "@/components/ui/card";
import { useOwed } from "@/lib/rep";
import { MoneyRenderer, Render, UserRenderer } from "@/components/renderers";

export function OverviewCard() {
    const owed = useOwed();
    const label = createMemo(() => {
        const total = owed()?.total;
        if (total === undefined) {
            return "Loading...";
        }
        if (total === 0) {
            return "All even!";
        }
        if (total > 0) {
            return "You Are Owed";
        }
        return "You Owe";
    })
    const otherUsers = createMemo(() => {
        const owe = owed();
        if (owe === undefined) {
            return [];
        }
        return Array.from(owe.to.keys());
    })
    // FIXME: subtotals are not updating when expenses are added
    return (
        <Card class="pt-4">
            <CardContent class="flex justify-between items-center">
                <div class="flex flex-col gap-2">
                <div class="text-lg font-bold">{label()}: ${owed()?.total}</div>
                    <For each={otherUsers()}>
                        {(user) => (
                            <div class="grid grid-cols-2 gap-2">
                                <UserRenderer userId={user} />  <Render value={owed()?.to.get(user)} c={MoneyRenderer} key="amount" />
                            </div>
                        )}
                    </For>
                </div>
            </CardContent>
        </Card>
    );
}

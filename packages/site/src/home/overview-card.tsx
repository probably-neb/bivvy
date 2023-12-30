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
        console.log("owed changed", owe)
        if (owe === undefined) {
            return [];
        }
        return Array.from(Object.keys(owe.to));
    })
    const total = createMemo(() => {
        const t = owed()?.total
        console.log("total changed", t)
        return t;
    })
    // FIXME: subtotals are not updating when expenses are added
    // FIXME: Total is not displaying
    return (
        <Card class="pt-4">
            <CardContent class="flex justify-between items-center">
                <div class="flex flex-col gap-2">
                <div class="text-lg font-bold"><span>{label()}:</span><Render value={total()} c={MoneyRenderer} key="amount" /></div>
                    <For each={otherUsers()}>
                        {(user) => (
                            <div class="grid grid-cols-2 gap-2">
                                <UserRenderer userId={user} />  <Render value={owed()?.to[user]} c={MoneyRenderer} key="amount" />
                            </div>
                        )}
                    </For>
                </div>
            </CardContent>
        </Card>
    );
}

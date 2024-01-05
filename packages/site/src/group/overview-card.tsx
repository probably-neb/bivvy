import { For, ParentProps, createMemo, Show, JSX, createSignal } from "solid-js";
import { As } from "@kobalte/core";
import { TbSelector } from "solid-icons/tb";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyRenderer, Render, UserRenderer } from "@/components/renderers";
import { useQueries } from "@/lib/device";
import { Owed, useOwed } from "@/lib/rep";

export function OverviewCard() {
    const device = useQueries();

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
    });

    const title = () => <OverviewTitle label={label()} total={owed()?.total} />;
    return (
        <Card class="pt-4">
            <CardContent>
                <Show
                    when={!device.isAtLeastMd()}
                    fallback={<CardInner title={title} owed={owed()} />}
                >
                    <ExpandableCard title={title}>
                        <CardInner owed={owed()} />
                    </ExpandableCard>
                </Show>
            </CardContent>
        </Card>
    );
}

function ExpandableCard(props: ParentProps<{ title: () => JSX.Element }>) {
    const [isOpen, setIsOpen] = createSignal(false);

    // FIXME: inner content showing while expanding
    return (
        <Collapsible
            open={isOpen()}
            onOpenChange={setIsOpen}
            class="w-350px space-y-2"
        >
            <div class="flex items-center justify-between space-x-4 px-4">
                <props.title />
                <CollapsibleTrigger asChild>
                    <As
                        component={Button}
                        variant="ghost"
                        size="sm"
                        class="w-9 p-0"
                    >
                        <TbSelector class="w-4 h-4" />
                        <span class="sr-only">Toggle</span>
                    </As>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent class="space-y-2">
                {props.children}
            </CollapsibleContent>
        </Collapsible>
    );
}

function OverviewTitle(props: { label: string; total?: number }) {
    return (
        <div class="text-lg font-bold flex gap-2">
            <span>{props.label}:</span>
            <Render value={props.total} c={MoneyRenderer} key="amount" />
        </div>
    );
}

function CardInner(props: { title?: () => JSX.Element; owed?: Owed }) {
    const otherUsers = createMemo(() => {
        const owe = props.owed;
        if (owe === undefined) {
            return [];
        }
        return Array.from(Object.keys(owe.to));
    });
    return (
        <div class="flex justify-between items-center">
            <div class="flex flex-col gap-2">
                <Show when={props.title}>{props.title}</Show>
                <For each={otherUsers()}>
                    {(user) => (
                        <div class="grid grid-cols-2 gap-2">
                            <UserRenderer userId={user} />{" "}
                            <Render
                                value={props.owed?.to[user]}
                                c={MoneyRenderer}
                                key="amount"
                            />
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}

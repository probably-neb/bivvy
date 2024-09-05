import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group, useGroups, useNumUsers } from "@/lib/rep";
import { routes } from "@/routes";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import { CreateGroupForm, CreateGroupModal } from "./create-group";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TiPlus, TiUserOutline } from "solid-icons/ti";
import { Pattern, randomPattern } from "@/lib/patterns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Groups() {
    const groups = useGroups();

    // TODO: overview card with total owed in all groups
    return (
        <div class="w-full h-full bg-background p-8 lg:p-16 ring-2 ring-foreground">
            <div class="flex flex-wrap gap-4 lg:gap-32 h-min w-full gap-y-8 lg:gap-y-16">
                <Show when={groups()} fallback={<LoadingCard />}>
                    {(groups) => (
                        <>
                            <For each={groups()}>
                                {(group) => <GroupCard group={group} />}
                            </For>
                            <NewGroupCard />
                        </>
                    )}
                </Show>
            </div>
        </div>
    );
}

function GroupCard(props: { group: Group }) {
    const groupId = createMemo(() => props.group.id);
    // TODO: useTotalOwed in this card here
    const otherUsers = useNumUsers(groupId);
    const randomPatternForGroup = randomPattern();
    console.log(props.group);
    return (
        <A href={routes.group(props.group.id)} class="bg-stone-300 h-32 w-64 lg:scale-125">
            <Card class="transition duration-100 ease-in transform hover:-translate-x-2 hover:-translate-y-2 border-none w-64 h-32 grow-0 shrink-0 relative rounded-none shadow-none ring-2 ring-foreground">
                <CardTitle class="absolute top-0 left-4 -translate-y-1/2 bg-background p-1 ring-2 ring-foreground max-w-48 text-ellipsis">
                    {props.group.name}
                </CardTitle>
                <CardHeader class="w-full h-16 p-0 border-b-2 border-b-foreground">
                    <Pattern
                        name={props.group.pattern ?? randomPatternForGroup}
                        color={props.group.color ?? undefined}
                    />
                </CardHeader>
                <CardContent class="pt-2 px-2 grid grid-cols-2 w-full">
                    <span>MEMBERS:</span>
                    <span class="text-right">{otherUsers()}</span>
                    <span>CREATED:</span>
                    <span class="text-right">
                        {new Date(props.group.createdAt).toLocaleString(
                            undefined,
                            {
                                dateStyle: "short",
                            }
                        )}
                    </span>
                </CardContent>
            </Card>
        </A>
    );
}

function NewGroupCard() {
    const [createGroupModalOpen, setCreateGroupModalOpen] = createSignal(false);
    return (
        <>
            <div class="w-64 h-32 bg-stone-300 lg:scale-125">
                <Card
                    onClick={[setCreateGroupModalOpen, true]}
                    class="transition duration-100 ease-in transform hover:-translate-x-2 hover:-translate-y-2 w-64 h-32 grow-0 shrink-0 bg-background ring-2 ring-foreground flex items-center justify-center relative rounded-none"
                >
                    <CardTitle class="absolute top-0 left-4 -translate-y-1/2 bg-background p-1 ring-2 ring-foreground max-w-48 text-ellipsis">
                        NEW GROUP
                    </CardTitle>
                    <TiPlus size={50} color="#000000" />
                    <Show when={createGroupModalOpen()}>
                        <CreateGroupModal
                            open={createGroupModalOpen}
                            setOpen={(open) => {
                                console.log(
                                    "open",
                                    open,
                                    createGroupModalOpen()
                                );
                                setCreateGroupModalOpen(open);
                            }}
                        />
                    </Show>
                </Card>
            </div>
        </>
    );
}

function LoadingCard() {
    return (
        <Card class="w-64 h-32 grow-0 shrink-0 col-span-full hover:scale-105 border-2 border-white flex items-center justify-center bg-white/50">
            <Skeleton class="w-full h-full" />
        </Card>
    );
}

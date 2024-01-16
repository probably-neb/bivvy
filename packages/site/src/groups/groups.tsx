import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group, useGroups, useNumUsers } from "@/lib/rep";
import { routes } from "@/routes";
import { A } from "@solidjs/router";
import {
    Accessor,
    For,
    createEffect,
    createMemo,
    createSignal,
} from "solid-js";
import { CreateGroupForm } from "./create-group";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TiPlus, TiUserOutline } from "solid-icons/ti";
import { Pattern, randomPattern } from "@/lib/patterns";

export default function Groups() {
    const groups = useGroups();
    // TODO: overview card with total owed in all groups
    return (
        <div class="flex flex-wrap gap-4">
            <For each={groups()}>{(group) => <GroupCard group={group} />}</For>
            <NewGroupCard />
        </div>
    );
}

function GroupCard(props: { group: Group }) {
    const groupId = createMemo(() => props.group.id);
    // TODO: useTotalOwed in this card here
    const otherUsers = useNumUsers(groupId);
    const pattern = randomPattern();
    console.log(pattern, props.group.name)
    return (
        <Card class="hover:scale-105 border-none w-64 h-32 grow-0 shrink-0">
            <A href={routes.group(props.group.id)}>
                <CardHeader
                    class="w-full h-16 p-0 rounded-t-xl"
                >
                    <Pattern name={pattern} />
                </CardHeader>
                <CardContent class="pt-2 px-2 flex items-center justify-between">
                    <CardTitle class="text-xl whitespace-nowrap">
                        {props.group.name}
                    </CardTitle>
                    <div class="flex items-center text-slate-600">
                        <TiUserOutline />
                        <span>{otherUsers()}</span>
                    </div>
                </CardContent>
            </A>
        </Card>
    );
}

function NewGroupCard() {
    const [createGroupModalOpen, setCreateGroupModalOpen] = createSignal(false);
    const onClick = (open: boolean) => {
        setCreateGroupModalOpen(open);
    };
    return (
        <>
            <Card
                onClick={[onClick, true]}
                class="w-64 h-32 grow-0 shrink-0 col-span-full hover:scale-105 border-2 border-white flex items-center justify-center bg-white/50"
            >
                <TiPlus size={50} color="#FFFFFF" />
            </Card>
            <CreateGroupModal
                open={createGroupModalOpen}
                setOpen={setCreateGroupModalOpen}
            />
        </>
    );
}

function CreateGroupModal(props: {
    open: Accessor<boolean>;
    setOpen: (open: boolean) => void;
}) {
    return (
        <Dialog open={props.open()} onOpenChange={props.setOpen}>
            <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                <DialogTitle>Create Group</DialogTitle>
                <CreateGroupForm onSubmit={() => props.setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

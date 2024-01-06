import { UserRenderer } from "@/components/renderers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Group, useGroups, useOtherUsers } from "@/lib/rep"
import { routes } from "@/routes"
import { A } from "@solidjs/router"
import { Accessor, For, createEffect, createMemo, createSignal } from "solid-js"
import {CreateGroupForm} from "./create-group"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function Groups() {
    const groups = useGroups()
    const [createGroupModalOpen, setCreateGroupModalOpen] = createSignal(false);
    // TODO: overview card with total owed in all groups
    return <div>
        Groups
        <Button onClick={[setCreateGroupModalOpen, true]}>Create Group</Button>
        <CreateGroupModal open={createGroupModalOpen} setOpen={setCreateGroupModalOpen} />
        <For each={groups()}>
            {group => <GroupCard group={group} />}
        </For>
    </div>
}

function GroupCard(props: {group: Group}) {
    const groupId = createMemo(() => props.group.id)
    // TODO: useOwed instead and show owed (mimick overview card in groups page)
    const otherUsers = useOtherUsers(groupId)
    createEffect(() => console.log("other users", otherUsers()?.map(u => u.name)))
    return <Card class="max-w-sm">
        <CardContent class="pt-2">
            <CardTitle class="text-xl"><A href={routes.group(props.group.id)}>{props.group.name}</A></CardTitle>
            <For each={otherUsers()}>
                {user => <UserRenderer userId={user.id} groupId={groupId} />}
            </For>
        </CardContent>
    </Card>
}

function CreateGroupModal(props: {open: Accessor<boolean>, setOpen: (open: boolean) => void}) {
        return (<Dialog
            open={props.open()}
            onOpenChange={props.setOpen}
        >
            <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                <DialogTitle>Create Group</DialogTitle>
                <CreateGroupForm onSubmit={() => props.setOpen(false)} />
            </DialogContent>
        </Dialog>)
}

import { UserRenderer } from "@/components/renderers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Group, useGroups, useOtherUsers, useUsers } from "@/lib/rep"
import { routes } from "@/routes"
import { A } from "@solidjs/router"
import { For, createEffect, createMemo } from "solid-js"

export default function Groups() {
    const groups = useGroups()
    return <div>
        Groups
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

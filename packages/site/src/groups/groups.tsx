import { useGroups } from "@/lib/rep"
import { For } from "solid-js"

export default function Groups() {
    const groups = useGroups()
    return <div>
        Groups
        <For each={groups()}>
            {group => <div>{group.name}</div>}
        </For>
    </div>
}

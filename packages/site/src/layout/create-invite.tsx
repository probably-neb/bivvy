import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import { Api } from "@/lib/api";
import {
    Group,
    InviteInput,
    inviteInputSchema,
    useMutations,
} from "@/lib/rep";
import { OcCopy3 } from "solid-icons/oc";
import { TbClipboardCopy } from "solid-icons/tb";
import { createResource, createSignal, Show} from "solid-js";

export function CreateInviteForm(props: { onSubmit: () => void, groupId: Group["id"]}) {
    const mutations = useMutations();
    const [shouldGenerate, setShouldGenerate] = createSignal(false);

    async function generate() {
        const groupId = props.groupId
        const key = await Api.getInviteKey(groupId)
        // await mutations.createInvite({ key, groupId })
        return inviteUrl(key)
    }
    const [invite] = createResource(shouldGenerate, generate)

    return <div>
        <Show when={invite()} fallback={<GenerateInviteButton generate={() => setShouldGenerate(true)} />}>
            <TextField class="flex gap-4 items-center">
                <TextFieldInput disabled class="disabled:opacity-100" value={invite()!} />
                <OcCopy3 size={"1.5rem"}/>
            </TextField>
        </Show>
    </div>
}

function GenerateInviteButton(props: { generate: () => void }) {
    return <Button variant="outline" onClick={props.generate}>Generate</Button>
}


function inviteUrl(key: string) {
    return `${window.location.origin}/invite?key=${key}`
}

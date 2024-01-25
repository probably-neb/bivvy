import { Button } from "@/components/ui/button";
import {
    TextField,
    TextFieldInput,
} from "@/components/ui/textfield";
import { Api } from "@/lib/api";
import { Group } from "@/lib/rep";
import { OcCheckcircle3, OcCopy3 } from "solid-icons/oc";
import { createResource, createSignal, Match, Show, Switch } from "solid-js";

export function CreateInviteForm(props: {
    onSubmit: () => void;
    groupId: Group["id"];
}) {
    const [shouldGenerate, setShouldGenerate] = createSignal(false);

    async function generate() {
        const groupId = props.groupId;
        const token = await Api.getInviteToken(groupId);
        // await mutations.createInvite({ key, groupId })
        return inviteUrl(token);
    }
    const [invite] = createResource(shouldGenerate, generate);

    return (
        <div>
            <Switch>
                <Match when={!shouldGenerate()}>
                    <GenerateInviteButton
                        generate={() => setShouldGenerate(true)}
                    />
                </Match>
                <Match when={invite.loading}>
                    <div>Generating...</div>
                </Match>
                <Match when={invite.error}>
                    <div>Failed to generate invite</div>
                </Match>
                <Match when={invite()}>
                    <TextField class="flex gap-4 items-center">
                        <TextFieldInput
                            disabled
                            class="disabled:opacity-100"
                            value={invite()!}
                        />
                        <CopyToClipboardButton url={invite()!} />
                    </TextField>
                </Match>
            </Switch>
        </div>
    );
}

function GenerateInviteButton(props: { generate: () => void }) {
    return (
        <Button variant="outline" onClick={props.generate}>
            Generate
        </Button>
    );
}

function inviteUrl(key: string) {
    return `${window.location.origin}/invite?token=${key}`;
}

function CopyToClipboardButton(props: { url: string }) {
    const [clicked, setClicked] = createSignal(false);
    return (
        <Button
            disabled={clicked()}
            variant="ghost"
            onClick={() => {
                navigator.clipboard.writeText(props.url);
                setClicked(true);
            }}
        >
            <Show when={!clicked()} fallback={<OcCheckcircle3 size="1.5rem" />}>
                <OcCopy3 size={"1.5rem"} />
            </Show>
        </Button>
    );
}

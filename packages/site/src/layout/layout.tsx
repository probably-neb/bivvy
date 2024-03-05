import { ParentProps, createSignal } from "solid-js";
import { fade } from "@/lib/fade";
import { useRep } from "@/lib/rep";
import { Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { dropAllDatabases } from "replicache";
import { CreateInviteForm } from "@/layout/create-invite";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCurrentGroupId } from "@/lib/group";
import { BreadCrumbs } from "./breadcrumbs";
import { isDev } from "@/lib/utils";

const NAME = "Bivvy";

export default function Layout({ children }: ParentProps) {
    // TODO: current user hook (and store current user at known key in rep)
    // for profile at top right

    // TODO: breadcrumbs in title bar
    return (
        <>
            <main class={`min-h-screen bg-gradient-to-br ${fade}`}>
                <div class="flex flex-row justify-between items-center px-4 pt-4">
                    <div class="text-white flex items-baseline">
                        <h1 class="text-4xl font-bold">{NAME}</h1>
                        <BreadCrumbs />
                    </div>
                    <div class="flex justify-evenly gap-2">
                        <CreateInviteButton />
                        <DevButtons />
                    </div>
                </div>
                <div class="p-6">{children}</div>
            </main>
        </>
    );
}
// TODO: consider rebranding as "sync" and including in non-local
function ForcePullButton() {
    const rep = useRep();
    const onClick = async () => {
        if (!rep()) {
            console.error("rep not initialized");
        }
        await rep()?.pull({ now: true });
    };
    return (
        <Show when={rep()}>
            <Button variant="outline" onClick={onClick}>
                Pull
            </Button>
        </Show>
    );
}

function DropDataButton() {
    // TODO: reinit rep after drop
    const onClick = async () => {
        const dropped = await dropAllDatabases();
        console.log("dropped", dropped.dropped);
        if (dropped.errors.length > 0) {
            console.error("errors", dropped.errors);
        }
        location.reload();
    };
    return (
        <Button variant="outline" onClick={onClick}>
            Drop
        </Button>
    );
}

function CreateInviteButton() {
    const groupId = useCurrentGroupId()
    const [open, setOpen] = createSignal(false);
    return (
        <Show when={Boolean(groupId())}>
            <Button variant="outline" onClick={[setOpen, true]}>New Invite</Button>
            <Dialog open={open()} onOpenChange={setOpen}>
                <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                    <DialogTitle>Invite</DialogTitle>
                    <CreateInviteForm onSubmit={() => setOpen(false)} groupId={groupId()!} />
                </DialogContent>
            </Dialog>
        </Show>
    );
}

function DevButtons() {
    return (
        <Show when={isDev()}>
            <ForcePullButton />
            <DropDataButton />
        </Show>
    );
}

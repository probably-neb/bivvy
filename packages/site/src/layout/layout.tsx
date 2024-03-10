import { ParentProps, createSignal } from "solid-js";
import { fade } from "@/lib/fade";
import { useCurrentUser, useRep, useUser } from "@/lib/rep";
import { Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { dropAllDatabases } from "replicache";
import { CreateInviteForm } from "@/layout/create-invite";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCurrentGroupId } from "@/lib/group";
import { BreadCrumbs } from "./breadcrumbs";
import { isDev } from "@/lib/utils";
import { useSession } from "@/lib/session";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroupLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRenderer } from "@/components/renderers";

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
                    <div class="flex justify-evenly gap-2 items-center">
                        <CreateInviteButton />
                        <Profile />
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
            <Button variant="ghost" onClick={onClick}>
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
        <Button variant="ghost" onClick={onClick}>
            Drop
        </Button>
    );
}

function Profile() {
    const user = useCurrentUser();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Show when={user()}>
                    {(user) => (
                        <div class="text-primary-foreground text-xl bg-primary-foreground/20 hover:bg-primary-foreground/10 px-4 py-2 rounded-lg">
                            <UserRenderer userId={user().id} />
                        </div>
                    )}
                </Show>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <Show when={isDev()}>
                    <DropdownMenuItem>
                        <ForcePullButton />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                </Show>
                <Show when={isDev()}>
                    <DropdownMenuItem>
                        <DropDataButton />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                </Show>
                <DropdownMenuItem>
                    <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LogoutButton() {
    const [_, session] = useSession();
    return (
        <Show when={session.isValid()}>
            <Button variant="ghost" onClick={session.logout}>
                Logout
            </Button>
        </Show>
    );
}

function CreateInviteButton() {
    const groupId = useCurrentGroupId();
    const [open, setOpen] = createSignal(false);
    return (
        <Show when={Boolean(groupId())}>
            <Button variant="outline" onClick={[setOpen, true]}>
                New Invite
            </Button>
            <Dialog open={open()} onOpenChange={setOpen}>
                <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                    <DialogTitle>Invite</DialogTitle>
                    <CreateInviteForm
                        onSubmit={() => setOpen(false)}
                        groupId={groupId()!}
                    />
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

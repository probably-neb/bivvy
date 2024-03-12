import { useCurrentUser, useRep } from "@/lib/rep";
import { Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { dropAllDatabases } from "replicache";
import { isDev } from "@/lib/utils";
import { useSession } from "@/lib/session";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRenderer } from "@/components/renderers";

export function Profile() {
    const user = useCurrentUser();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Show when={user()}>
                    {(user) => (
                        <div class="text-primary-foreground text-xl bg-primary-foreground/20 hover:bg-primary-foreground/40 px-4 py-2 rounded-lg">
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



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
                        <div class="ring-2 ring-foreground relative bg-background">
                            <div class="-translate-y-1/2 px-2 absolute top-0 left-4 bg-background z-0 ring-2 ring-foreground md:ring-0 text-sm md:text-default">
                                USER
                            </div>
                            <div class="relative text-foreground whitespace-nowrap md:text-xl bg-primary-foreground/20 z-10 hover:bg-primary-foreground/40 px-2 md:px-4 py-2 rounded-lg">
                                <UserRenderer userId={user().id} />
                            </div>
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

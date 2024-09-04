import { ParentProps } from "solid-js";
import { fade } from "@/lib/fade";
import { BreadCrumbs } from "./breadcrumbs";
import { Profile } from "./profile";

const NAME = "BIVVY";

export default function Layout({ children }: ParentProps) {
    // TODO: current user hook (and store current user at known key in rep)
    // for profile at top right

    // TODO: breadcrumbs in title bar
    return (
        <>
            <main class={`h-screen w-full min-h-screen bg-gradient-to-br ${fade} pt-6`}>
                <div class="flex flex-row justify-between items-center mx-8 ring-2 ring-foreground px-4 pt-4 h-[8%] bg-background">
                    <div class="text-white flex items-baseline overflow-x-hidden">
                        <h1 class="text-3xl font-bold text-foreground">{NAME}</h1>
                        <BreadCrumbs />
                    </div>
                    <div class="flex justify-evenly gap-2 items-center">
                        <Profile />
                    </div>
                </div>
                <div class="p-8 w-full h-[92%]">{children}</div>
            </main>
        </>
    );
}

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
                <div class="flex flex-row justify-between items-center mx-8 ring-2 ring-foreground px-4 pt-4 h-[6%] bg-background">
                    <div class="text-white flex items-baseline overflow-x-hidden">
                        <h1 class="text-3xl font-bold text-foreground">{NAME}</h1>
                        <BreadCrumbs />
                    </div>
                    <div class="flex justify-evenly gap-2 h-full items-center translate-x-8 -translate-y-1/4 md:translate-x-0 md:translate-y-0 bg-background">
                        <Profile />
                    </div>
                </div>
                <div class="p-8 px-2 lg:px-8 w-full h-[94%]">{children}</div>
            </main>
        </>
    );
}

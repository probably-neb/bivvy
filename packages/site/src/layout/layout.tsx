import { ParentProps } from "solid-js";
import { fade } from "@/lib/fade";
import { BreadCrumbs } from "./breadcrumbs";
import { Profile } from "./profile";

const NAME = "Bivvy";

export default function Layout({ children }: ParentProps) {
    // TODO: current user hook (and store current user at known key in rep)
    // for profile at top right

    // TODO: breadcrumbs in title bar
    return (
        <>
            <main class={`min-h-screen bg-gradient-to-br ${fade}`}>
                <div class="flex flex-row justify-between items-center px-4 pt-4">
                    <div class="text-white flex items-baseline overflow-x-hidden">
                        <h1 class="text-3xl font-bold">{NAME}</h1>
                        <BreadCrumbs />
                    </div>
                    <div class="flex justify-evenly gap-2 items-center">
                        <Profile />
                    </div>
                </div>
                <div class="p-6">{children}</div>
            </main>
        </>
    );
}

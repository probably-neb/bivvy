import { ParentProps } from "solid-js";
import { fade } from "@/lib/fade";

export default function Layout({ children }: ParentProps) {
    return (
        <>
            <main class={`min-h-screen bg-gradient-to-br ${fade}`}>
                {children}
            </main>
        </>
    );
}

import { routes } from "@/routes";
import { useMatch } from "@solidjs/router";
import { createMemo, on } from "solid-js";

export function useCurrentGroupId() {
    const groupMatch = useMatch(() => routes.group(":id") + "/*");
    const id = createMemo(on(groupMatch, (match) => {
        if (!match) return null;
        return match.params.id;
    }))
    return id
}

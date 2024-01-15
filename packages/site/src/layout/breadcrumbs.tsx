import { useGroup } from "@/lib/rep";
import { routes } from "@/routes";
import { A, useMatch } from "@solidjs/router";
import { For,  Show, createMemo, on } from "solid-js";

export function BreadCrumbs() {
    const crumbs = useCrumbs();
    return (
        <div class="flex flex-row pl-2 text-slate-200 text-2xl">
            <For each={crumbs()}>
                {(Crumb, i) => (
                    <>
                        <Show when={i() === 0}>
                            <Divider />
                        </Show>
                        <Crumb />
                        <Show when={i() !== crumbs().length - 1}>
                            <Divider />
                        </Show>
                    </>
                )}
            </For>
        </div>
    );
}

function Divider() {
    return <span>/</span>;
}

function useCrumb(path: string) {
    const match = useMatch(() => path);
    const params = createMemo(() => match()?.params);
    return params;
}

const groupsCrumb = () => <Crumb name="Groups" path={routes.groups} />;
const loginCrumb = () => <Crumb name="Login" path={routes.auth} />;

const groupCrumb = (props: {id: string, name: () => string | undefined}) => () => (
    <Crumb name={props.name() ?? ""} path={routes.group(props.id)} />
);

function useCrumbs() {
    const login = useCrumb(routes.auth + "/*");
    const groups = useCrumb(routes.groups);
    const groupMatch = useCrumb(routes.group(":id"));
    const group = createMemo(on(groupMatch, (groupMatch) => {
        if (!groupMatch) return;
        if (!groupMatch.id) {
            console.error("group match has no id", groupMatch)
            return;
        }

        const group = useGroup(() => groupMatch.id);
        return {
            id: groupMatch.id,
            name: () => group()?.name,
        }
    }))

    const crumbs = createMemo(
        on([login, groups, group], ([login, groups, group]) => {
            switch (true) {
                case !!login:
                    return [loginCrumb];
                case !!group:
                    return [groupsCrumb, groupCrumb({id: group.id, name: group.name})];
                case !!groups:
                    return [groupsCrumb];
                default:
                    return [];
            }
        }),
    );
    console.log(crumbs());
    return crumbs;
}

function Crumb(props: { name: string; path: string }) {
    return (
        <A href={props.path} class="px-2 rounded-md hover:bg-white/10 hover:text-white">{props.name}</A>
    );
}

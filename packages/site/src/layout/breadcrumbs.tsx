import { useGroup } from "@/lib/rep";
import { routes } from "@/routes";
import { A, useMatch } from "@solidjs/router";
import { For, Show, createMemo, on } from "solid-js";

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

function useCrumbWithParam<Param extends string, Res>(fn: (param: string) => string, val: Param, mapFn: (paramVal: string) => Res) {
    const param = ":" + val;
    const crumb = useCrumb(fn(param));
    const res = createMemo(on(crumb, (crumb) => {
        if (!crumb) return;
        if (!crumb[val]) {
            console.error("crumb has no " + val, crumb);
            return
        }
        return mapFn(crumb[val])
    }))
    return res
}

const groupsCrumb = () => <Crumb name="Groups" path={routes.groups} />;
const loginCrumb = () => <Crumb name="Login" path={routes.auth} />;

const groupCrumb =
    (props: { id: string; name: () => string | undefined }) => () => (
        <Crumb name={props.name() ?? ""} path={routes.group(props.id)} />
    );

const scanCrumb = (props: {id: string}) => () => <Crumb name="Upload" path={routes.scanReceipt(props.id)} />

function getGroupInfo(groupId: string) {
    const group = useGroup(() => groupId);
    return {
        id: groupId,
        name: () => group()?.name,
    }
}

function useCrumbs() {
    const login = useCrumb(routes.auth + "/*");
    const groups = useCrumb(routes.groups);
    const group = useCrumbWithParam(routes.group, "id" as const, getGroupInfo)
    const scanReceipt = useCrumbWithParam(routes.scanReceipt, "id" as const, getGroupInfo)
    const scanSpreadsheet = useCrumbWithParam(routes.scanSpreadsheet, "id" as const, getGroupInfo)

    const crumbs = createMemo(
        on([login, groups, group, scanReceipt, scanSpreadsheet], ([login, groups, group, scanReceipt, scanSpreadsheet]) => {
            switch (true) {
                case !!login:
                    return [loginCrumb];
                case !!scanSpreadsheet:
                case !!scanReceipt:
                    const scan = scanReceipt ?? scanSpreadsheet!
                    return [
                        groupsCrumb,
                        groupCrumb(scan),
                        scanCrumb(scan)
                    ]
                case !!group:
                    return [
                        groupsCrumb,
                        groupCrumb(group),
                    ];
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
        <A
            href={props.path}
            class="px-2 rounded-md hover:bg-white/10 hover:text-white"
        >
            {props.name}
        </A>
    );
}

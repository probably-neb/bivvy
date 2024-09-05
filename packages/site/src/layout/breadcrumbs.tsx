import { useGroup } from "@/lib/rep";
import { routes } from "@/routes";
import { A, useMatch } from "@solidjs/router";
import { Accessor, For, Show, createMemo, on } from "solid-js";

export function BreadCrumbs() {
    const crumbs = useCrumbs();
    return (
        <div class="flex flex-row pl-2 text-foreground text-2xl">
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
    if (!path.endsWith("/*")) {
        if (!path.endsWith("/")) {
            path += "/";
        }
        path += "*";
    }
    const match = useMatch(() => path);
    const params = createMemo(() => match()?.params);
    return params;
}

function useCrumbWithParam<Param extends string, Res>(
    fn: (param: string) => string,
    val: Param,
    mapFn: (paramVal: string) => Res,
) {
    const param = ":" + val;
    const path = fn(param);
    const crumb = useCrumb(path);
    const res = createMemo(
        on(crumb, (crumb) => {
            if (!crumb) return;
            if (!crumb[val]) {
                console.error("crumb has no " + val, crumb);
                return;
            }
            return mapFn(crumb[val]);
        }),
    );
    return res;
}

function getGroupInfo(groupId: string) {
    const group = useGroup(() => groupId);
    return {
        id: groupId,
        name: () => group()?.name,
    };
}

function useCrumbs() {
    const ID = "id" as const;
    const r = routes;
    const ggi = getGroupInfo;

    const login = useCrumb(r.auth + "/*");
    const groups = useCrumb(r.groups + "/*");
    const group = useCrumbWithParam(r.group, ID, ggi);
    const groupUsers = useCrumbWithParam(r.groupUsers, ID, ggi);
    const groupSplits = useCrumbWithParam(r.groupSplits, ID, ggi);
    const groupInfo = useCrumbWithParam(r.groupInfo, ID, ggi);
    const scanReceipt = useCrumbWithParam(r.scanReceipt, ID, ggi);
    const scanSpreadsheet = useCrumbWithParam(r.scanSpreadsheet, ID, ggi);

    const crumbs = createMemo(() => {
        const cs = [];
        switch (true) {
            case login() != null:
                cs.push(CRUMB.Login);
                break;
            case groups() != null:
                cs.push(CRUMB.Groups);
                const g = group();
                if (g != null) {
                    cs.push(CRUMB.GROUP.Group(g.name, g.id));
                    switch (true) {
                        case groupUsers() != null:
                            cs.push(CRUMB.GROUP.Users(g.id));
                            break;
                        case groupSplits() != null:
                            cs.push(CRUMB.GROUP.Splits(g.id));
                            break;
                        case groupInfo() != null:
                            cs.push(CRUMB.GROUP.Info(g.id))
                            break
                        case scanReceipt() != null:
                            cs.push(CRUMB.GROUP.ScanReceipt(g.id));
                            break;
                        case scanSpreadsheet() != null:
                            cs.push(CRUMB.GROUP.ScanSpreadsheet(g.id));
                            break;
                    }
                }
        }
        return cs;
    });
    return crumbs;
}

function Crumb(props: { name: string; path: string }) {
    return (
        <A
            href={props.path}
            class="px-2 hover:underline "
        >
            {props.name}
        </A>
    );
}

const CRUMB = {
    Login: () => <Crumb name="LOGIN" path={routes.auth} />,
    Groups: () => <Crumb name="GROUPS" path={routes.groups} />,
    GROUP: {
        Group: (name: Accessor<string | undefined>, groupId: string) => () => (
            <Crumb name={name() ?? "GROUP"} path={routes.group(groupId)} />
        ),
        Users: (groupId: string) => () => (
            <Crumb name="MEMBERS" path={routes.groupUsers(groupId)} />
        ),
        Splits: (groupId: string) => () => (
            <Crumb name="SPLITS" path={routes.groupSplits(groupId)} />
        ),
        Info: (groupId: string) => () => (
            <Crumb name="INFO" path={routes.groupInfo(groupId)} />
        ),
        ScanReceipt: (groupId: string) => () => (
            <Crumb name="UPLOAD" path={routes.scanReceipt(groupId)} />
        ),
        ScanSpreadsheet: (groupId: string) => () => (
            <Crumb name="UPLOAD" path={routes.scanSpreadsheet(groupId)} />
        ),
    },
};

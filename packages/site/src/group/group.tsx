import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Switch,
    Show,
    createMemo,
    createSignal,
    Match,
    ParentProps,
    For,
    createEffect,
    Accessor,
} from "solid-js";
import { OverviewCard } from "@/group/overview-card";
import { ExpensesTable } from "@/group/expenses-table";
import { AddExpenseCard } from "@/group/add-expense";
import { ViewExpenseCard } from "@/group/view-expense";
import {
    Expense,
    Split,
    User,
    useCurrentGroup,
    useExpense,
    useGroup,
    useMutations,
    useOwnsCurrentGroup,
    useSortedSplits,
    useSortedUsers,
    useSplits,
    useUsers,
} from "@/lib/rep";
import { useQueries } from "@/lib/device";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { TiTrash } from "solid-icons/ti";
import { useUserId } from "@/lib/session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SplitRenderer, UserRenderer } from "@/components/renderers";
import { CreateSplit } from "./create-split";
import { BiRegularEdit } from "solid-icons/bi";
import { useLocation, useNavigate, useParams } from "@solidjs/router";
import { useCurrentGroupId } from "@/lib/group";
import { CreateInviteForm } from "@/layout/create-invite";
import { CreateGroupModal } from "@/groups/create-group";

type ExpenseCardView = { mode: "view"; id: Expense["id"] };
type ExpenseCardEdit = { mode: "edit"; expense: Expense; id?: undefined };
// TODO:
// type AsideCardEdit = { mode: "edit"; id: Expense["id"] };
type ExpenseCardMode =
    | { mode: "add"; id?: undefined }
    | ExpenseCardView
    | ExpenseCardEdit;

const [expenseCardMode, _setExpenseCardMode] = createSignal<ExpenseCardMode>({
    mode: "add",
});
export { expenseCardMode as asideCardMode };

const [expenseCardOpen, setExpenseCardOpen] = createSignal(false);

export function setExpenseCardMode(mode: ExpenseCardMode) {
    _setExpenseCardMode(mode);
    // modal only exists on small devices but just setting it here
    // always and keeping logic elsewhere is simpler
    setExpenseCardOpen(true);
}

export type ViewExpense = (expenseId: Expense["id"]) => void;

function getAddExpenseButtonProps() {
    const device = useQueries();
    const disabled = createMemo(() => {
        // if the expense card will be shown in a modal,
        // don't disable the button when the modal isn't open
        if (!expenseCardOpen() && !device.isAtLeastLg()) {
            return false;
        }
        return expenseCardMode().mode === "add";
    });
    const onClick = () => setExpenseCardMode({ mode: "add" });
    return {
        disabled,
        onClick,
    };
}

export default function GroupPage() {
    // TODO: move header to layout
    const loc = useLocation();
    const params = useParams();
    const TABS = ["users", "expenses", "splits", "group"];
    const tab = createMemo(() => {
        let tabParam = params.tab;
        if (!TABS.includes(tabParam)) {
            tabParam = "expenses";
        }
        return tabParam;
    });
    const navigate = useNavigate();
    const onChange = (newTab: string) => {
        let path = loc.pathname;
        const oldTab = tab();
        if (oldTab !== "expenses") {
            path = path.replace(new RegExp(`/${oldTab}$`), "");
        }
        if (newTab !== "expenses") {
            path = path + `/${newTab}`;
        }
        navigate(path);
    };
    return (
        <Tabs
            defaultValue="expenses"
            value={tab()}
            onChange={onChange}
            class="shadow-none w-full h-full bg-background ring-2 ring-foreground pt-4 relative"
        >
            <div class="absolute top-0 -translate-y-1/2 w-full">
                <TabsList class="justify-center rounded-none h-[2rem] md:h-[3rem] p-4 text-sm md:text-default lg:text-lg ring-2 ring-foreground bg-background ">
                    <TabsTrigger class="text-md" value="expenses">
                        EXPENSES
                    </TabsTrigger>
                    <TabsTrigger class="text-md" value="users">
                        MEMBERS
                    </TabsTrigger>
                    <TabsTrigger class="text-md" value="splits">
                        SPLITS
                    </TabsTrigger>
                    <TabsTrigger class="text-md" value="group">
                        GROUP
                    </TabsTrigger>
                </TabsList>
            </div>
            <div class="md:h-[calc(100%-3rem)] h-[calc(100%-2rem)]">
                <TabsContent value="expenses">
                    <ExpensesTab />
                </TabsContent>
                <TabsContent value="splits">
                    <SplitsTab />
                </TabsContent>
                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>
                <TabsContent value="group">
                    <GroupTab />
                </TabsContent>
            </div>
        </Tabs>
    );
}

function ExpensesTab() {
    const viewExpense = (id: Expense["id"]) => {
        setExpenseCardMode({ mode: "view", id });
    };

    // wrap in tracking scope
    const addExpenseButtonProps = createMemo(getAddExpenseButtonProps);
    return (
        <div class="flex flex-col h-full justify-center lg:flex-row">
            <aside class="w-full h-full flex flex-col justify-start lg:w-1/3 lg:order-last lg:border-l-2 lg:border-dashed lg:border-l-foreground lg:pl-6">
                <ExpenseCardWrapper />
            </aside>
            <section class="w-full lg:w-2/3 h-full pr-4">
                <ExpensesTable
                    viewExpense={viewExpense}
                    addExpenseButtonProps={addExpenseButtonProps()}
                />
            </section>
        </div>
    );
}

function SplitsTab() {
    const splits = useSortedSplits();
    const users = useSortedUsers();
    const [editingSplit, setEditingSplit] = createSignal<Split | null>(null);
    return (
        <div class="flex flex-col justify-between lg:flex-row gap-6 h-full">
            <aside class="w-full flex flex-col h-1/3 lg:h-full justify-start gap-6 lg:w-1/3 lg:order-last">
                <Card class="p-4 max-w-fit">
                    <Show
                        when={editingSplit()}
                        fallback={<CreateSplit />}
                        keyed
                    >
                        {(split) => (
                            <CreateSplit
                                split={split}
                                onSubmit={() => setEditingSplit(null)}
                            />
                        )}
                    </Show>
                </Card>
            </aside>
            <section class="w-full lg:w-2/3 min-h-0 h-1/3 lg:h-full overflow-y-auto scrollbar-none">
                <div class="flex flex-wrap gap-6 lg:gap-y-8 overflow-y-auto p-2 pt-4 lg:pt-6">
                    <For each={splits()}>
                        {(split) => (
                            <SplitCard
                                split={split}
                                users={users()}
                                editSplit={() => {
                                    if (split.id == editingSplit()?.id) {
                                        setEditingSplit(null);
                                        return;
                                    }
                                    setEditingSplit(split);
                                }}
                            />
                        )}
                    </For>
                </div>
            </section>
        </div>
    );
}

function SplitCard(props: {
    split: Split;
    editSplit: () => void;
    users?: Array<User>;
}) {
    const total = createMemo(() => {
        let total = 0;
        for (const portion of Object.values(props.split.portions)) {
            total += portion;
        }
        return total;
    });
    return (
        <Card class="min-w-min max-h-min p-0 ring-2 ring-foreground relative">
            <div class="absolute top-0 left-4 -translate-y-1/2 ring-2 ring-foreground h-min">
                <SplitRenderer
                    class={"font-medium text-lg shrink"}
                    splitId={props.split.id}
                />
            </div>
            <Button
                variant="ghost"
                onClick={props.editSplit}
                class="absolute top-0 right-4 -translate-y-1/2 ring-2 ring-foreground h-min w-min p-2 py-0 bg-background"
            >
                EDIT
            </Button>
            <CardContent class="size-max pt-6">
                <SplitCardPortions
                    users={props.users}
                    total={total()}
                    portions={props.split.portions}
                />
            </CardContent>
        </Card>
    );
}

function SplitCardPortions(props: {
    users?: Array<User>;
    total: number;
    portions: Record<string, number>;
}) {
    return (
        <div class="flex">
            <div class="shrink grid grid-cols-3 items-center gap-4">
                <For each={props.users}>
                    {(user) => {
                        const portion = createMemo(
                            () => props.portions[user.id] ?? 0
                        );
                        return (
                            <Show when={portion() !== 0}>
                                <span class="w-32">
                                    <UserRenderer userId={user.id} />
                                </span>
                                <span class="inline-flex justify-center">{`${portion()}/${
                                    props.total
                                }`}</span>
                                <PercentagePreview
                                    total={props.total}
                                    value={portion()}
                                />
                            </Show>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}

function PercentagePreview(props: { total: number; value: number }) {
    const percent = createMemo(() => {
        const value = (props.value / props.total) * 100;
        const isWholeNumber = value % 1 === 0;
        const decimals = isWholeNumber ? 0 : 2;
        return value.toFixed(decimals);
    });
    return <div class="text-slate-600 italic">{`${percent()}%`}</div>;
}

function UsersTab() {
    return <OverviewCard />;
}

function GroupTab() {
    // TODO: Leave group button
    // group info:
    //  - num expenses
    //  - total transacted
    //  - created
    // if owner:
    //  archive group button
    const isOwner = useOwnsCurrentGroup();
    return (
        <div>
            {/* FIXME: move to users tab */}
            <CreateInviteButton />
            <Show when={isOwner()}>
                <EditGroupButton />
            </Show>
        </div>
    );
}

function dbgSignal(s: Accessor<unknown>, label?: string) {
    createEffect(() => {
        console.log(label ?? "value:", s());
    });
}

function EditGroupButton() {
    const group = useCurrentGroup();

    const [open, setOpen] = createSignal(false);

    return (
        <>
            <Button variant="outline" onClick={[setOpen, !open()]}>
                Edit
            </Button>
            <Show when={group()} keyed>
                {(group) => (
                    <CreateGroupModal
                        open={open}
                        setOpen={setOpen}
                        group={group}
                    />
                )}
            </Show>
        </>
    );
}

function CreateInviteButton() {
    const groupId = useCurrentGroupId();
    const [open, setOpen] = createSignal(false);
    return (
        <Show when={Boolean(groupId())}>
            <Button variant="outline" onClick={[setOpen, true]}>
                New Invite
            </Button>
            <Dialog open={open()} onOpenChange={setOpen}>
                <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                    <DialogTitle>Invite</DialogTitle>
                    <CreateInviteForm
                        onSubmit={() => setOpen(false)}
                        groupId={groupId()!}
                    />
                </DialogContent>
            </Dialog>
        </Show>
    );
}
function ExpenseCardWrapper() {
    const device = useQueries();
    const title = createMemo(() => {
        switch (expenseCardMode().mode) {
            case "add":
                return "New Expense";
            case "edit":
                return "Edit Expense";
            case "view":
                return "Expense Details";
        }
    });

    return (
        <Show
            when={device.isAtLeastLg()}
            fallback={<ExpenseCardModal title={title()} />}
        >
            <ExpenseCard title={title()} />
        </Show>
    );
}

function ExpenseCardModal(props: { title: string }) {
    return (
        <Dialog open={expenseCardOpen()} onOpenChange={setExpenseCardOpen}>
            <DialogContent class="sm:max-w-[425px] max-w-[80%] ring-2 ring-foreground">
                <DialogTitle class="absolute top-0 left-4 -translate-y-1/2 px-2 ring-2 ring-foreground bg-background uppercase text-md">
                    {props.title}
                </DialogTitle>
                <ExpenseCardInner />
                <Show when={expenseCardMode().mode === "view"}>
                    <DialogFooter>
                        <ViewExpenseCardFooter
                            expenseId={expenseCardMode().id!}
                        />
                    </DialogFooter>
                </Show>
            </DialogContent>
        </Dialog>
    );
}

function ExpenseCard(props: { title: string }) {
    return (
        <Card class="relative pt-4">
            <CardTitle class="absolute top-0 left-4 -translate-y-1/2 bg-background uppercase py-1 px-2">
                {props.title}
            </CardTitle>
            <CardContent class="px-10">
                <ExpenseCardInner />
            </CardContent>
            <Show when={expenseCardMode().mode === "view"} keyed>
                <ViewExpenseCardFooter expenseId={expenseCardMode().id!} />
            </Show>
        </Card>
    );
}

function ExpenseCardHeader(props: ParentProps) {
    return (
        <Show
            when={expenseCardMode().mode === "view"}
            fallback={props.children}
        >
            <div class="flex justify-between items-center">
                {props.children}
            </div>
        </Show>
    );
}

function ViewExpenseCardFooter(props: { expenseId: Expense["id"] }) {
    return (
        <>
            <div class="absolute top-0 right-28 -translate-y-1/2 min-w-12 bg-background ring-2 ring-foreground">
                <DeleteExpenseButton expenseId={props.expenseId} />
            </div>
            <div class="absolute top-0 right-4 -translate-y-1/2 min-w-12 bg-background ring-2 ring-foreground">
                <EditExpenseButton expenseId={props.expenseId} />
            </div>
        </>
    );
}

function DeleteExpenseButton(props: { expenseId: Expense["id"] }) {
    const { deleteExpense } = useMutations();

    const userId = useUserId();
    const expense = useExpense(() => props.expenseId);
    const allowed = createMemo(() => userId() === expense()?.paidBy);

    const onClickDelete = async () => {
        // TODO: show confirmation dialog
        await deleteExpense(props.expenseId);
        setExpenseCardMode({ mode: "add" });
        setExpenseCardOpen(false);
    };
    return (
        <Show when={allowed()}>
            <Button variant="destructive" onClick={onClickDelete} class="py-0 px-2 h-7 bg-destructive text-foreground">
                DELETE
            </Button>
        </Show>
    );
}

function EditExpenseButton(props: { expenseId: Expense["id"] }) {
    const userId = useUserId();
    const expense = useExpense(() => props.expenseId);
    const allowed = createMemo(() => userId() === expense()?.paidBy);
    return (
        <Show when={allowed()}>
            <Button
                variant="ghost"
                onClick={[
                    setExpenseCardMode,
                    { mode: "edit", expense: expense()! },
                ]}
                class="py-0 px-2 h-7 bg-background text-foreground"
            >
                EDIT
            </Button>
        </Show>
    );
}

function ExpenseCardInner() {
    const modeIs = <Mode extends "add" | "view" | "edit">(mode: Mode) => {
        if (expenseCardMode().mode === mode) {
            return expenseCardMode() as ReturnType<typeof expenseCardMode> & {
                mode: Mode;
            };
        }
        return null;
    };
    return (
        <Switch>
            <Match when={modeIs("add")} keyed>
                {(_expenseCardMode) => {
                    console.log("adding", _expenseCardMode);
                    return (
                        <AddExpenseCard
                            onSubmit={() => {
                                setExpenseCardMode({ mode: "add" });
                                setExpenseCardOpen(false);
                            }}
                        />
                    );
                }}
            </Match>
            <Match when={modeIs("view")} keyed>
                {(expenseCardMode) => (
                    <ViewExpenseCard expenseId={expenseCardMode.id} />
                )}
            </Match>
            <Match when={modeIs("edit")} keyed>
                {(expenseCardMode) => (
                    <AddExpenseCard
                        onSubmit={() => {
                            setExpenseCardMode({ mode: "add" });
                            setExpenseCardOpen(false);
                        }}
                        expense={dbg("expense", expenseCardMode.expense)}
                    />
                )}
            </Match>
        </Switch>
    );
}

function dbg<T>(label: string, v: T) {
    console.log(label, v);
    return v;
}

type Maybe<T> = T | null | undefined;

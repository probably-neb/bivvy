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
} from "solid-js";
import { OverviewCard } from "@/group/overview-card";
import { ExpensesTable } from "@/group/expenses-table";
import { AddExpenseCard } from "@/group/add-expense";
import { ViewExpenseCard } from "@/group/view-expense";
import {
    Expense,
    Split,
    User,
    useExpense,
    useMutations,
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

type ExpenseCardView = { mode: "view"; id: Expense["id"] };
type ExpenseCardEdit = { mode: "edit"; expense: Expense; id?: undefined };
// TODO:
// type AsideCardEdit = { mode: "edit"; id: Expense["id"] };
type ExpenseCardMode =
    | { mode: "add"; id?: undefined }
    | ExpenseCardView
    | ExpenseCardEdit;

const [expenseCardMode, _setExpenseCardMode] = createSignal<ExpenseCardMode>(
    {
        mode: "add",
    },
    {
        equals: (a, b) => a.mode === b.mode && a.id === b.id,
    }
);
export { expenseCardMode as asideCardMode };

const [expenseCardOpen, setExpenseCardOpen] = createSignal(false);

export function setExpenseCardMode(mode: ExpenseCardMode) {
    console.log("setting mode", mode);
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
    const loc = useLocation()
    const params = useParams();
    const TABS = ["users", "expenses", "splits", "group"]
    const tab = createMemo(() => {
        let tabParam = params.tab
        if (!TABS.includes(tabParam)) {
            tabParam="expenses"
        }
        return tabParam
    })
    const navigate = useNavigate();
    const onChange = (newTab: string) => {
        let path = loc.pathname
        const oldTab = tab()
        if (oldTab !== "expenses") {
            path = path.replace(new RegExp(`/${oldTab}$`), "")
        }
        if (newTab !== "expenses") {
            path = path + `/${newTab}`
        }
        navigate(path)
    }
    return (
        <Tabs defaultValue="expenses" value={tab()} onChange={onChange} class="shadow-none">
            <TabsList class="justify-center">
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="users">Members</TabsTrigger>
                <TabsTrigger value="splits">Splits</TabsTrigger>
                <TabsTrigger value="group">Group</TabsTrigger>
            </TabsList>
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
        <div class="flex flex-col justify-center lg:flex-row gap-6 lg:gap-12">
            <aside class="w-full flex flex-col justify-start gap-6 lg:w-1/3 lg:order-last">
                <ExpenseCardWrapper />
            </aside>
            <section class="w-full lg:w-2/3">
                <ExpensesTable
                    viewExpense={viewExpense}
                    addExpenseButtonProps={addExpenseButtonProps()}
                />
            </section>
        </div>
    );
}

function SplitsTab() {
    const splits = useSplits();
    const users = useUsers();
    const [editingSplit, setEditingSplit] = createSignal<Split | null>(null);
    return (
        <div class="flex flex-col justify-center lg:flex-row gap-6">
            <aside class="w-full flex flex-col justify-start gap-6 lg:w-1/3 lg:order-last">
                <Card class="p-4 max-w-fit">
                    <Show when={editingSplit()} fallback={<CreateSplit />} keyed>
                        {(split) => (
                            <CreateSplit
                                split={split}
                                onSubmit={() => setEditingSplit(null)}
                            />
                        )}
                    </Show>
                </Card>
            </aside>
            <section class="w-full lg:w-2/3 min-h-0 max-h-[80vh] overflow-y-auto scrollbar-none">
                <div class="flex flex-wrap gap-4">
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
        <Card class="min-w-min max-h-min p-0">
            <CardHeader>
                <div class="w-full flex justify-between align-center">
                    <div class="shrink">
                        <SplitRenderer
                            class={"font-medium text-lg shrink"}
                            splitId={props.split.id}
                        />
                    </div>
                    <Button variant="ghost" onClick={props.editSplit}>
                        <BiRegularEdit size="1.5em" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent class="size-max">
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
                            <>
                                <UserRenderer userId={user.id} />
                                <span class="inline-flex justify-center">{`${portion()}/${
                                    props.total
                                }`}</span>
                                <PercentagePreview
                                    total={props.total}
                                    value={portion()}
                                />
                            </>
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
    return <div>
        Groups
        {/* FIXME: move to users tab */}
        <CreateInviteButton />
    </div>
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
            <DialogContent class="sm:max-w-[425px] max-w-[80%]">
                <ExpenseCardHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                </ExpenseCardHeader>
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
        <Card>
            <CardHeader>
                <ExpenseCardHeader>
                    <CardTitle>{props.title}</CardTitle>
                </ExpenseCardHeader>
            </CardHeader>
            <CardContent class="px-10">
                <ExpenseCardInner />
            </CardContent>
            <Show when={expenseCardMode().mode === "view"}>
                <CardFooter>
                    <ViewExpenseCardFooter expenseId={expenseCardMode().id!} />
                </CardFooter>
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
        <div class="w-full flex justify-evenly">
            <DeleteExpenseButton expenseId={props.expenseId} />
            <EditExpenseButton expenseId={props.expenseId} />
        </div>
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
            <Button variant="destructive" onClick={onClickDelete}>
                <TiTrash
                    size="1.5em"
                    class="fill-destructive-foreground bg-red"
                />
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
                variant="default"
                onClick={[
                    setExpenseCardMode,
                    { mode: "edit", expense: expense()! },
                ]}
            >
                <BiRegularEdit size="1.5em" class="fill-background" />
            </Button>
        </Show>
    );
}

function ExpenseCardInner() {
    return (
        <Switch>
            <Match when={expenseCardMode().mode === "add"}>
                <AddExpenseCard onSubmit={() => setExpenseCardOpen(false)} />
            </Match>
            <Match when={expenseCardMode().mode === "view"}>
                <ViewExpenseCard expenseId={expenseCardMode().id!} />
            </Match>
            <Match when={expenseCardMode().mode === "edit"}>
                <AddExpenseCard
                    onSubmit={() => setExpenseCardOpen(false)}
                    expense={dbg(
                        "expense",
                        (expenseCardMode() as ExpenseCardEdit).expense
                    )}
                />
            </Match>
        </Switch>
    );
}

function dbg<T>(label: string, v: T) {
    console.log(label, v);
    return v;
}

type Maybe<T> = T | null | undefined;

function check<T>(arg: Maybe<T>, fn: (v: T) => Maybe<boolean>) {
    if (arg == null) {
        return null;
    }
    const res = fn(arg);
    if (res == null || !res) {
        return null;
    }
    return arg;
}

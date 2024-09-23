import { createStore } from "solid-js/store";
import { ReceiptInfo, ReceiptInfoItem } from "./receipt";
import {
    Accessor,
    Index,
    ParentProps,
    Setter,
    Show,
    batch,
    createSignal,
    onMount,
} from "solid-js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LabeledInput from "@/components/ui/labeled-input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button, DepressButton } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle";
import { AddExpenseCard } from "@/group/add-expense";
import { useCurrentGroupId } from "@/lib/group";

type ReceiptInfoGroup = {
    splitID: string | null;
    items: Array<ReceiptInfoItem>;
};

export function ReceiptInfoEdit(props: ParentProps<{ info: ReceiptInfo }>) {
    const [items, setItems] = createStore<ReceiptInfoItem[]>(props.info.items);
    const [groups, setGroups] = createStore<ReceiptInfoGroup[]>([]);

    let formRef!: HTMLFormElement;

    const [paidOn, setPaidOn] = createSignal<number>(
        new Date(props.info.date.value).getTime()
    );

    return (
        <>
            <div class="h-[10%] space-x-4">
                {props.children}
                <Show when={items.length > 1}>
                    <GroupCreateDialog
                        items={items}
                        setItems={setItems}
                        setGroups={setGroups}
                    />
                </Show>
            </div>
            <section class="h-[90%] overflow-y-auto w-full ">
                <form
                    ref={formRef}
                    class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] auto-rows-auto grid-flow-dense gap-2.5 p-2 w-full"
                >
                    <Index each={groups}>
                        {(group) => <Group group={group()} paidOn={paidOn} />}
                    </Index>
                    <Index each={items}>
                        {(item) => {
                            return (
                                <Card class="w-72 h-36">
                                    <CardContent class="space-y-8 p-4">
                                        <LabeledInput
                                            value={item().name.value}
                                            label="ITEM"
                                            rightLabel={null}
                                            rightLabelClass={confidenceIndicatorClass(
                                                item().name.confidence
                                            )}
                                        />
                                        <LabeledInput
                                            value={item().price.value}
                                            label="PRICE"
                                            rightLabel={null}
                                            rightLabelClass={confidenceIndicatorClass(
                                                item().price.confidence
                                            )}
                                        />
                                        <SplitSelect
                                    </CardContent>
                                </Card>
                            );
                        }}
                    </Index>
                </form>
            </section>
        </>
    );
}

function createList<T>(defaultValue?: Array<T>): {
    items: readonly T[];
    length: number;
    set(i: number, v: T): void;
    clear(): void;
} {
    const [arr, setArr] = createStore<Array<T>>(defaultValue ?? []);

    return {
        items: arr,
        length: arr.length,
        set: setArr,
        clear: () => setArr([]),
    };
}

function confidenceIndicatorClass(
    confidence: number,
    touched: boolean = false
) {
    let color = "bg-green-500";
    if (!touched) {
        if (confidence < 1 && confidence > 0) {
            confidence = confidence * 100;
        }

        if (confidence < 25) {
            color = "bg-red-500";
        } else if (confidence < 50) {
            color = "bg-orange-500";
        } else if (confidence < 75) {
            color = "bg-yellow-500";
        }
    }

    return (
        "w-2 h-2 p-0 rounded-full -translate-y-1/2 -translate-x-1/2 left-0 top-1/2 " +
        color
    );
}

function GroupCreateDialog(props: {
    items: Array<ReceiptInfoItem>;
    setItems: Setter<Array<ReceiptInfoItem>>;
    setGroups: Setter<Array<ReceiptInfoGroup>>;
}) {
    const selected = createList<boolean>(props.items.map(() => false));
    const [open, setOpen] = createSignal(false);

    function createGroupFromSelected() {
        if (selected.items.length <= 1) return;
        const selectedItems = props.items.filter((_, i) => selected.items[i]);
        const unselectedItems = props.items.filter(
            (_, i) => !selected.items[i]
        );
        const group = {
            splitID: null,
            items: selectedItems,
        };

        batch(() => {
            props.setGroups((groups) => [...groups, group]);
            props.setItems(unselectedItems);
            selected.clear();
            setOpen(false);
        });
    }
    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger disabled={props.items.length <= 1}>
                <DepressButton>CREATE GROUP</DepressButton>
            </DialogTrigger>
            <DialogContent class="max-w-[80%] lg:max-w-md h-64 ring-2 ring-foreground">
                <DialogTitle variant="label">
                    <Button
                        variant="ghost"
                        disabled={selected.length <= 1}
                        onClick={createGroupFromSelected}
                    >
                        CREATE
                    </Button>
                </DialogTitle>
                <div class="h-full w-full overflow-y-scroll space-y-2">
                    <Index each={props.items}>
                        {(item, i) => (
                            <ToggleButton
                                class="w-full flex flex-row data-[pressed]:bg-background data-[pressed]:ring-2 data-[pressed]:ring-foreground data-[pressed]:ring-inset gap-x-2"
                                pressed={selected.items[i]}
                                onChange={(pressed) => selected.set(i, pressed)}
                            >
                                <span>{item().name.value}</span>
                                <span>{item().price.value}</span>
                            </ToggleButton>
                        )}
                    </Index>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Group(props: { group: ReceiptInfoGroup; paidOn: Accessor<string> }) {
    const [total, setTotal] = createSignal<number>(0);
    const [digitCount, setDigitCount] = createSignal<number>(0);

    let contentRef!: HTMLDivElement;

    function calculateTotal() {
        if (!contentRef) return;
        const priceElems = contentRef.querySelectorAll("[data-price]");

        let total = 0;
        let maxDigitCount = 0;
        for (const elem of priceElems) {
            const value = (elem as HTMLInputElement).value;
            const valueAsNumber = Number.parseFloat(value);
            if (
                !Number.isNaN(valueAsNumber) &&
                Number.isFinite(valueAsNumber)
            ) {
                total += valueAsNumber;

                const digitCount =
                    valueAsNumber.toString().split(".").at(1)?.length ?? 0;
                if (digitCount > maxDigitCount) {
                    maxDigitCount = digitCount;
                }
            }
        }
        console.log("total", total);
        batch(() => {
            setTotal(total);
            setDigitCount(maxDigitCount);
        });
    }

    onMount(calculateTotal);

    return (
        <Card
            class="w-72"
            style={{
                "grid-row": "span " + props.group.items.length,
            }}
        >
            <CardHeader>
                <LabeledInput label="DESCRIPTION" />
                <div class="flex w-min flex-nowrap gap-x-2 justify-between">
                    <span>TOTAL</span>
                    <span>{total().toFixed(digitCount())}</span>
                </div>
            </CardHeader>
            <CardContent
                class="flex flex-col gap-y-6 divide-y-2 divide-dashed"
                ref={contentRef}
                onInput={(e) => {
                    const isPrice = (e.target as HTMLInputElement)?.dataset
                        ?.price;
                    if (isPrice == null) {
                        return;
                    }

                    calculateTotal();
                }}
            >
                <Index each={props.group.items}>
                    {(item) => (
                        <div class="flex flex-col gap-y-4 pt-6">
                            <LabeledInput
                                value={item().name.value}
                                label="ITEM"
                                rightLabel={null}
                                rightLabelClass={confidenceIndicatorClass(
                                    item().name.confidence
                                )}
                            />
                            <LabeledInput
                                value={item().price.value}
                                label="PRICE"
                                data-price
                                rightLabel={null}
                                rightLabelClass={confidenceIndicatorClass(
                                    item().price.confidence
                                )}
                            />
                        </div>
                    )}
                </Index>
            </CardContent>
        </Card>
    );
}

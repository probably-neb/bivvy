import { createStore, SetStoreFunction, StoreSetter } from "solid-js/store";
import { ReceiptInfo } from "./receipt";
import {
    Accessor,
    Index,
    ParentProps,
    Setter,
    Show,
    batch,
    createMemo,
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
import { Form } from "@/lib/forms";
import { z } from "zod";
import { SplitSelect } from "@/components/split-select";
import * as R from "remeda";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { attrWhen } from "@/lib/utils";

type ReceiptInfoItem = ReceiptInfo["items"][number] & {
    grouped?: boolean;
};

type ReceiptInfoGroup = {
    splitID: string | null;
    items: Array<ReceiptInfoItem>;
};

export const ReceiptInfoEdit = Form.wrap(
    {
        validator: z.object({
            items: z.array(
                z.object({
                    name: z.string().min(1, "item name is required"),
                    price: z.number({
                        invalid_type_error: "Not a number",
                        coerce: true
                    }),
                    split: SplitSelect.Validator,
                })
            ),
            groups: z
                .array(
                    z.object({
                        items: z.array(
                            z.object({
                                name: z.string().min(1),
                                price: z.coerce.number(),
                            })
                        ),
                        split: SplitSelect.Validator,
                    })
                )
                .default([]),
        }),
        onSubmit: console.log.bind(null, "on submit"),
        class: "w-full h-full",
        allTouched: true,
    },
    (props: ParentProps<{ info: ReceiptInfo }>) => {
        console.log("reciept");
        const ctx = Form.use();
        console.log(ctx.state.touched);
        const [items, setItems] = createStore<Array<ReceiptInfoItem>>(
            props.info.items
        );
        const [groups, setGroups] = createStore<ReceiptInfoGroup[]>([]);

        // TODO: input for paid on
        // @ts-expect-error unused
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
                            groupCount={groups.length}
                        />
                    </Show>
                    <Form.SubmitButton />
                </div>
                <section class="h-[90%] overflow-y-auto w-full">
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] auto-rows-auto grid-flow-dense gap-2.5 p-2 w-full">
                        <Index each={groups}>
                            {(group, index) => (
                                <Group
                                    group={group()}
                                    index={index}
                                    paidOn={paidOn}
                                />
                            )}
                        </Index>
                        <Index each={items}>
                            {(item, i) => {
                                const itemName = Form.joinNames("items", i);

                                const nameFieldName = Form.joinNames(
                                    itemName,
                                    "name"
                                );
                                const priceFieldName = Form.joinNames(
                                    itemName,
                                    "price"
                                );

                                return (
                                    <Show when={!item().grouped}>
                                        <Card class="w-72">
                                            <CardContent class="space-y-8 p-4">
                                                <LabeledInput
                                                    value={item().name.value}
                                                    label="ITEM"
                                                    name={nameFieldName}
                                                    rightLabel={
                                                        <OkIndicator
                                                            for={nameFieldName}
                                                        />
                                                    }
                                                    rightLabelClass="text-xs"
                                                >
                                                    <ConfidenceIndicatorClass
                                                        confidence={
                                                            item().name
                                                                .confidence
                                                        }
                                                        touched={Form.isTouched(
                                                            nameFieldName
                                                        )}
                                                    />
                                                </LabeledInput>
                                                <LabeledInput
                                                    value={item().price.value}
                                                    label="PRICE"
                                                    name={Form.joinNames(
                                                        itemName,
                                                        "price"
                                                    )}
                                                    rightLabel={
                                                        <OkIndicator
                                                            for={priceFieldName}
                                                        />
                                                    }
                                                    rightLabelClass="text-xs"
                                                >
                                                    <ConfidenceIndicatorClass
                                                        confidence={
                                                            item().price
                                                                .confidence
                                                        }
                                                        touched={Form.isTouched(
                                                            priceFieldName
                                                        )}
                                                    />
                                                </LabeledInput>
                                                <SplitSelect
                                                    prefix={Form.joinNames(
                                                        itemName,
                                                        "split"
                                                    )}
                                                />
                                                <Form.MultiFieldError
                                                    for={Form.joinNames(
                                                        itemName,
                                                        "split"
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Show>
                                );
                            }}
                        </Index>
                    </div>
                </section>
            </>
        );
    }
);

function OkIndicator(props: { for: string }) {
    const fieldError = Form.useFieldError(props.for);
    const [open, setOpen] = createSignal(false);
    const state = createMemo(() => {
        return fieldError() == null ? "ok" : "err";
    });
    return (
        <Tooltip open={open()} closeDelay={5000}>
            <TooltipTrigger
                onClick={() => setOpen((open: boolean) => !open)}
                disabled={state() == "ok"}
                data-err={attrWhen(state() == "err")}
                class="text-sm text-foreground uppercase bg-green-500 data-[err]:bg-destructive w-full h-full px-2 h-4"
            >
                <Show when={state() == "ok"} fallback="ERROR">
                    OK
                </Show>
            </TooltipTrigger>
            <TooltipContent
                class="bg-background ring-2 ring-foreground text-foreground rounded-none"
                onPointerDownOutside={() => setOpen((open: boolean) => !open)}
            >
                {fieldError()}
            </TooltipContent>
        </Tooltip>
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

function ConfidenceIndicatorClass(props: {
    confidence: number;
    touched?: Accessor<boolean>;
}) {
    const className = createMemo(() => {
        let color = "bg-green-500";
        let confidence = props.confidence;
        if (!props.touched?.()) {
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

            return (
                "absolute w-2 h-2 p-0 rounded-full -translate-y-1/2 -translate-x-1/2 left-0 top-1/2 " +
                color
            );
        }
    });

    return <div class={className()} />;
}

function GroupCreateDialog(props: {
    items: Array<ReceiptInfoItem>;
    setItems: SetStoreFunction<Array<ReceiptInfoItem>>;
    setGroups: SetStoreFunction<Array<ReceiptInfoGroup>>;
    groupCount: number;
}) {
    const selected = createList<boolean>(props.items.map(R.constant(false)));
    const [open, setOpen] = createSignal(false);

    function createGroupFromSelected() {
        if (selected.items.length <= 1) return;
        const selectedItems = props.items.filter((_, i) => selected.items[i]);
        const group = {
            splitID: null,
            items: selectedItems,
        };

        batch(() => {
            props.setGroups(props.groupCount, group);
            props.setItems((_item, i) => selected.items[i], "grouped", true);
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
                            <Show when={!item().grouped}>
                                <ToggleButton
                                    class="w-full flex flex-row data-[pressed]:bg-background data-[pressed]:ring-2 data-[pressed]:ring-foreground data-[pressed]:ring-inset gap-x-2"
                                    pressed={selected.items[i]}
                                    onChange={(pressed) =>
                                        selected.set(i, pressed)
                                    }
                                >
                                    <span>{item().name.value}</span>
                                    <span>{item().price.value}</span>
                                </ToggleButton>
                            </Show>
                        )}
                    </Index>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Group(props: {
    group: ReceiptInfoGroup;
    paidOn: Accessor<number>;
    index: number;
}) {
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

    const groupName = createMemo(() => Form.joinNames("groups", props.index));

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
                    <span>${total().toFixed(digitCount())}</span>
                </div>
                <SplitSelect prefix={Form.joinNames(groupName(), "split")} />
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
                    {(item, itemIndex) => {
                        const itemName = createMemo(() =>
                            Form.joinNames(
                                groupName(),
                                "items",
                                itemIndex,
                                "name"
                            )
                        );
                        const itemNameName = createMemo(() =>
                            Form.joinNames(itemName(), "name")
                        );
                        const itemPriceName = createMemo(() =>
                            Form.joinNames(itemName(), "price")
                        );

                        return (
                            <div class="flex flex-col gap-y-4 pt-6">
                                <LabeledInput
                                    value={item().name.value}
                                    label="ITEM"
                                    name={Form.joinNames(
                                        groupName(),
                                        "items",
                                        itemIndex,
                                        "name"
                                    )}
                                    rightLabel={
                                        <OkIndicator for={itemNameName()} />
                                    }
                                    rightLabelClass="text-xs"
                                >
                                    <ConfidenceIndicatorClass
                                        confidence={item().name.confidence}
                                        touched={Form.isTouched(itemNameName())}
                                    />
                                </LabeledInput>
                                <LabeledInput
                                    value={item().price.value}
                                    label="PRICE"
                                    name={itemPriceName()}
                                    data-price
                                    rightLabel={
                                        <OkIndicator for={itemPriceName()} />
                                    }
                                    rightLabelClass="text-xs"
                                >
                                    <ConfidenceIndicatorClass
                                        confidence={item().price.confidence}
                                        touched={Form.isTouched(
                                            itemPriceName()
                                        )}
                                    />
                                </LabeledInput>
                            </div>
                        );
                    }}
                </Index>
            </CardContent>
        </Card>
    );
}

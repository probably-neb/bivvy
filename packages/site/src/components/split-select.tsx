import { useSplit, useSplits, useUsers } from "@/lib/rep";
import { For, Show, batch, createMemo, createSignal, onMount } from "solid-js";
import { SplitRenderer, UserRenderer } from "./renderers";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
    ComboboxTriggerMode,
} from "./ui/combobox";
import { TextFieldLabel } from "./ui/textfield";
import { createFilter } from "@kobalte/core";
import { ToggleButton } from "./ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Form } from "@/lib/forms";
import { z } from "zod";
import * as R from "remeda";

type SplitMode = "existing" | "new";

type SplitOrOneOff =
    | {
          mode: "existing";
          id: string;
      }
    | {
          mode: "new";
          portions: Record<string, number>;
      };

export function SplitSelect(props: { prefix?: string }) {
    const [prevSplitID, setPrevSplitID] = createSignal<string | null>(null);

    const ExistingTab = (
        <ExistingSplitSelect
            prefix={props.prefix}
            onSelect={(id) => setPrevSplitID(id)}
        />
    );
    const NewTab = (
        <CreateNewOneOffSplit
            prevSplitID={prevSplitID()}
            prefix={props.prefix}
        />
    );
    const prevSplit = useSplit(() => prevSplitID() ?? "/");
    const defaultValue = createMemo(() => {
        if (prevSplitID == null) return "existing" as const;
        const split = prevSplit();
        if (split === undefined) return null;
        if (split === null) return "existing" as const;

        if (split.isOneOff) {
            return "new" as const;
        }
        return "existing" as const;
    });

    const [mode, setMode] = createSignal<SplitMode>(
        defaultValue() ?? "existing"
    );

    return (
        <Show when={defaultValue()}>
            <>
                <input
                    type="hidden"
                    name={Form.joinNames(props.prefix, "mode")}
                    value={mode()}
                />
                <Tabs
                    defaultValue={mode()}
                    class="h-32"
                    onChange={(value) => setMode(value as SplitMode)}
                >
                    <TabsList class="justify-center">
                        <TabsTrigger
                            class="text-muted-foreground"
                            value="existing"
                        >
                            SPLIT
                        </TabsTrigger>
                        <TabsTrigger class="text-muted-foreground" value="new">
                            ONE OFF SPLIT
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing" class="px-0">
                        {ExistingTab}
                    </TabsContent>
                    <TabsContent value="new" class="px-0">
                        {NewTab}
                    </TabsContent>
                </Tabs>
            </>
        </Show>
    );
}

export namespace SplitSelect {
    export const Validator = z.discriminatedUnion("mode", [
        z.object({
            mode: z.literal("new"),
            portions: z
                .record(z.string().min(1, "invalid split"), z.coerce.number())
                .superRefine((portions, ctx) => {
                    const isEmpty = R.isEmpty(portions)
                    const portionCount = R.pipe(portions, R.values(), R.sum())
                    const hasNoPortions = portionCount == 0

                    console.log('portions ok', isEmpty, portionCount)
                    if (isEmpty || hasNoPortions) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: "at least one portion is required",
                        });
                    }
                }),
        }),
        z.object({
            mode: z.literal("existing"),
            id: z
                .string({ required_error: "split is required" })
                .min(1, "split is required"),
        }),
    ]);
}

function ExistingSplitSelect(props: {
    onSelect: (id: string | null) => void;
    prefix?: string;
}) {
    const splits = useSplits();
    const allOptions = createMemo(() =>
        (splits() ?? []).map((split) => ({
            name: split.name,
            id: split.id,
            element: () => <SplitRenderer splitId={split.id} />,
        }))
    );
    type Option = typeof allOptions extends () => Array<infer O> ? O : never;

    const [searchValue, setSearchValue] = createSignal("");
    const filter = createFilter({ sensitivity: "base" });
    const options = createMemo(() => {
        if (searchValue() === "") {
            return allOptions();
        }
        return allOptions().filter((option) =>
            filter.contains(option.name, searchValue())
        );
    });

    const [isSelecting, setIsSelecting] = createSignal(false);
    const onOpenChange = (
        isOpen: boolean,
        triggerMode?: ComboboxTriggerMode
    ) => {
        if (isOpen && triggerMode === "manual") {
            setSearchValue("");
        }
        setIsSelecting(isOpen);
    };
    const splitIDName = Form.joinNames(props.prefix, "id");

    const [selectedID, setSelectedID] = createSignal(
        Form.useDefaultValueFor<string>(splitIDName)
    );

    const selected = createMemo(() => {
        const id = selectedID();
        if (id == null || id === "") {
            return undefined;
        }
        return allOptions().find((o) => o.id === id);
    });

    let inputRef!: HTMLInputElement;

    return (
        <Combobox<Option>
            value={selected()}
            options={options()}
            onInputChange={(value) => setSearchValue(value)}
            onChange={(selected) => {
                setSelectedID(selected?.id);
                props.onSelect(selected?.id ?? null);
                inputRef.dispatchEvent(
                    new Event("change", {
                        bubbles: true,
                        cancelable: true,
                    })
                );
            }}
            onOpenChange={onOpenChange}
            optionTextValue="name"
            optionValue="id"
            optionLabel="name"
            itemComponent={(props) => (
                <ComboboxItem item={props.item}>
                    <props.item.rawValue.element />
                </ComboboxItem>
            )}
        >
            <TextFieldLabel>SPLIT</TextFieldLabel>
            <ComboboxTrigger class="relative">
                <Show when={!isSelecting() && selected()}>
                    {(selected) => (
                        <div class="absolute">{selected().element()}</div>
                    )}
                </Show>
                {/*
                 * `data-[closed]:text-card` hides the text by setting it to the same color as the card
                 * so there is no risk of some peeking out from behind the selected elem overlay
                 */}
                <ComboboxInput
                    class="data-[closed]:text-card"
                    ref={inputRef}
                    name={splitIDName}
                />
            </ComboboxTrigger>
            <ComboboxContent />
        </Combobox>
    );
}

function CreateNewOneOffSplit(props: {
    prevSplitID?: string | null;
    prefix?: string;
}) {
    const users = useUsers();

    const prevSplit = useSplit(() => props.prevSplitID ?? "/");
    const prevPortions = createMemo(() => {
        if (props.prevSplitID == null) {
            // if not editing use default state
            return {};
        }
        const split = prevSplit();

        // returning null will cause the field to delay rendering until split isn't undefined (undefined === loading)
        if (split === undefined) return null;

        // if a split with the id isn't found or the split isn't a one off, use the default
        // state for creating a one-off split
        if (split === null || !split.isOneOff) return {};

        // return the previous one-off split portions!
        return split.portions;
    });

    return (
        <div>
            <Show when={prevPortions()}>
                {(prevPortions) => {
                    return (
                        <For each={users()}>
                            {(user) => {
                                const name = Form.joinNames(
                                    props.prefix,
                                    "portions",
                                    user.id
                                );
                                const defaultValue =
                                    Form.useDefaultValueFor<number>(name);
                                const [value, setValue] = createSignal(
                                    prevPortions()?.[user.id] ??
                                        defaultValue ??
                                        0
                                );
                                let inputRef!: HTMLInputElement;
                                return (
                                    <ToggleButton
                                        pressed={value() > 0}
                                        onChange={(pressed) => {
                                            setValue(pressed ? 1 : 0);
                                            inputRef.dispatchEvent(
                                                new Event("change", {
                                                    bubbles: true,
                                                    cancelable: true,
                                                })
                                            );
                                        }}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="hidden"
                                            name={name}
                                            value={value()}
                                        />
                                        <UserRenderer userId={user.id} />
                                    </ToggleButton>
                                );
                            }}
                        </For>
                    );
                }}
            </Show>
        </div>
    );
}

export function addSpacesToKeys(obj: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [` ${k} `, v])
    );
}

export function removeSpacesFromKeys(obj: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k.trim(), v])
    );
}

import { useSplit, useSplits, useUsers } from "@/lib/rep";
import { FormApi } from "@tanstack/solid-form";
import { For, Show, createMemo, createSignal } from "solid-js";
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

type SplitMode = "existing" | "new";

type SplitOrOneOff =
    | {
          mode: "existing";
          splitId: string;
      }
    | {
          mode: "new";
          split: {
              portions: Record<string, number>;
          };
      };

type AnyForm = FormApi<any, any>;

export function SplitSelect<Form extends AnyForm>(props: {
    form: Form;
    prefix?: string;
}) {
    const [prevSplitID, setPrevSplitID] = createSignal<string | null>(null);

    const ExistingTab = (
        <ExistingSplitSelect form={props.form} onSelect={setPrevSplitID} />
    );
    const NewTab = (
        <CreateNewOneOffSplit form={props.form} prevSplitID={prevSplitID()} />
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

    return (
        <Show when={defaultValue()}>
            {(defaultValue) => (
                <props.form.Field name={joinNames(props.prefix, "mode")} defaultValue={defaultValue()}>
                    {(field) => (
                        <Tabs
                            defaultValue={field().state.value}
                            class="h-32"
                            onChange={(value) =>
                                field().handleChange(value as SplitMode)
                            }
                        >
                            <TabsList class="justify-center">
                                <TabsTrigger
                                    class="text-muted-foreground"
                                    value="existing"
                                >
                                    SPLIT
                                </TabsTrigger>
                                <TabsTrigger
                                    class="text-muted-foreground"
                                    value="new"
                                >
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
                    )}
                </props.form.Field>
            )}
        </Show>
    );
}

function ExistingSplitSelect<Form extends AnyForm>(props: {
    form: Form;
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

    return (
        <props.form.Field name={joinNames(props.prefix, "splitId") as any}>
            {(field) => {
                const selectedId = createMemo(() => field().state.value);
                const selected = createMemo(() => {
                    const id = selectedId();
                    if (id == null || id === "") {
                        return undefined;
                    }
                    return allOptions().find((o) => o.id === id);
                });
                return (
                    <Combobox<Option>
                        value={selected()}
                        options={options()}
                        onInputChange={(value) => setSearchValue(value)}
                        onChange={(opt) => {
                            field().handleChange(opt?.id ?? null);
                            props.onSelect(opt?.id ?? null);
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
                                    <div class="absolute">
                                        {selected().element()}
                                    </div>
                                )}
                            </Show>
                            {/*
                             * `data-[closed]:text-card` hides the text by setting it to the same color as the card
                             * so there is no risk of some peeking out from behind the selected elem overlay
                             */}
                            <ComboboxInput class="data-[closed]:text-card" />
                        </ComboboxTrigger>
                        <ComboboxContent />
                    </Combobox>
                );
            }}
        </props.form.Field>
    );
}

function CreateNewOneOffSplit<Form extends FormApi<SplitOrOneOff, any>>(props: {
    form: Form;
    prevSplitID?: string | null;
    prefix?: string;
}) {
    const users = useUsers();

    const prevSplit = useSplit(() => props.prevSplitID ?? "/");
    const portions = createMemo(() => {
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
            <Show when={portions()}>
                {(portions) => (
                    <For each={users()}>
                        {(user) => (
                            <props.form.Field
                                name={joinNames(props.prefix, `split.portions. ${user.id} `) as any}
                                defaultValue={portions()[user.id] ?? 0}
                            >
                                {(field) => (
                                    <ToggleButton
                                        pressed={field().state.value > 0}
                                        onChange={(pressed) =>
                                            field().handleChange(
                                                pressed ? 1 : 0
                                            )
                                        }
                                    >
                                        <UserRenderer userId={user.id} />
                                    </ToggleButton>
                                )}
                            </props.form.Field>
                        )}
                    </For>
                )}
            </Show>
        </div>
    );
}

function joinNames(...names: Array<string | undefined>): string {
    return names.filter(Boolean).join(".");
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

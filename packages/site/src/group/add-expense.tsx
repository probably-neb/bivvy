import {
    Accessor,
    For,
    Match,
    Show,
    Switch,
    createEffect,
    createMemo,
    createSignal,
} from "solid-js";
import { Button } from "@/components/ui/button";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import {
    Combobox,
    ComboboxItem,
    ComboboxTrigger,
    ComboboxContent,
    ComboboxInput,
    ComboboxTriggerMode,
} from "@/components/ui/combobox";
import { createFilter } from "@kobalte/core";
import { createForm, FormApi, FormState } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import {
    useMutations,
    zExpenseInput as zBaseExpenseInput,
    zExpenseWithOneOffSplitInput,
    useSplits,
    Expense,
    useUsers,
    useSplit,
} from "@/lib/rep";
import { SplitRenderer, UserRenderer } from "@/components/renderers";
import {
    NumberField,
    NumberFieldErrorMessage,
    NumberFieldInput,
    NumberFieldLabel,
} from "@/components/ui/numberfield";
import z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleButton } from "@/components/ui/toggle";
import { deepClone } from "@/lib/utils";
import { removeSpacesFromKeys } from "@/components/split-select";

type SplitMode = "existing" | "new";
const zExpenseInput = z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("existing"), ...zBaseExpenseInput.shape }),
    z.object({
        mode: z.literal("new"),
        ...zExpenseWithOneOffSplitInput.shape,
        split: zExpenseWithOneOffSplitInput.shape.split
            .omit({ portions: true })
            .and(z.object({ portions: z.record(z.number().int().min(0)) })),
    }),
]);
type ExpenseInput = z.infer<typeof zExpenseInput>;
type Form = FormApi<ExpenseInput, typeof zodValidator>;

export function AddExpenseCard(props: {
    onSubmit?: () => void;
    expense?: Partial<Expense>;
}) {
    const mutations = useMutations();

    const expenseToEdit = props.expense;
    const isEditing = expenseToEdit != null;

    // this has the nice beneifit of making these values non-reactive so they for sure won't
    // update if the expense changes while editing
    const defaultValues = expenseToEdit && {
        description: expenseToEdit.description,
        amount: expenseToEdit.amount ?? 0 / 100 + 0.0,
        paidOn: expenseToEdit.paidOn,
        splitId: expenseToEdit.splitId,
        // NOTE: required otherwise @tanstack/form fails to clean up after itself
        split: { id: expenseToEdit.splitId, portions: {} },
        mode: "existing" as const,
    };
    let prevSplitWasOneOff = false;

    const form: Form = createForm<ExpenseInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            // copy so the following changes are not reflected in the visible form state
            value = deepClone(value);
            // convert to cents, since thats what we store everywhere else
            value.amount *= 100;
            if (value.mode === "new") {
                value.split.portions = removeSpacesFromKeys(
                    value.split.portions
                );
            }
            if (value.mode === "existing") {
                // FIXME: server side validation here so that errors can be displayed
                console.log("submit", value);
                try {
                    if (isEditing) {
                        const e = Object.assign({}, expenseToEdit, value);
                        await mutations.expenseEdit(e);
                    } else {
                        await mutations.addExpense(value);
                    }
                } catch (e) {
                    // TODO: call props.onSubmit anyway and display error message
                    // in toast (at least until I can come up with something better)
                    console.error(e);
                }
                return;
            }
            try {
                if (isEditing) {
                    const e = Object.assign({}, expenseToEdit, value, {
                        prevSplitWasOneOff,
                    });
                    await mutations.expenseWithOneOffSplitEdit(e);
                } else {
                    await mutations.expenseWithOneOffSplitCreate(value);
                }
            } catch (e) {
                console.error(e);
            }
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (props) => {
            console.error(
                "invalid",
                props.value,
                zExpenseInput.safeParse(props.value)
            );
        },
        defaultValues,
        validators: {
            onSubmit: zExpenseInput,
        },
    }));

    // dbgFormValue(form, "portions", (f) => f.values.split);

    return (
        <form.Provider>
            <form
                class="flex flex-col gap-4"
                lang="en"
                onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("submit", form.state.values);
                    try {
                        await form.handleSubmit();
                        props.onSubmit?.();
                        console.log("submitted expense");
                    } catch (e) {
                        console.error(e);
                    }
                }}
            >
                <Field
                    name="description"
                    label="DESCRIPTION"
                    placeholder="SPARKLING APPLE CIDER"
                    type="text"
                    validator={zBaseExpenseInput.shape.description}
                    form={form}
                />
                <MoneyField
                    name="amount"
                    label="AMOUNT"
                    placeholder="10.00"
                    validator={zBaseExpenseInput.shape.amount}
                    step="any"
                    form={form}
                />
                <SplitField
                    form={form}
                    editingID={expenseToEdit?.splitId}
                    setPrevWasOneOff={() => (prevSplitWasOneOff = true)}
                />
                <Field
                    name="paidOn"
                    label="PAID ON"
                    placeholder="2021-01-01"
                    type="date"
                    validator={zBaseExpenseInput.shape.paidOn}
                    parse={parseDate}
                    form={form}
                />

                <SaveButton form={form} isEditing={isEditing} />
            </form>
        </form.Provider>
    );
}


function SaveButton(props: { form: Form; isEditing: boolean }) {
    enum State {
        AddingCanSubmit,
        AddingCannotSubmit,
        EditingCannotSubmit,
        EditingNotTouched,
        EditingTouched,
        EditingSaved,
    }
    const canSubmit = useFormValue(props.form, (f) => f.canSubmit);
    const isSubmitted = useFormValue(props.form, (f) => f.isSubmitted);
    const isTouched = useFormValue(props.form, (f) => f.isTouched);
    const state = createMemo(() => {
        if (props.isEditing) {
            if (!canSubmit()) {
                return State.EditingCannotSubmit;
            }
            // FIXME: this should be isSubmitted && isDirty, but there is no isDirty
            if (isSubmitted() && !isTouched()) {
                return State.EditingSaved;
            }
            if (isTouched()) {
                return State.EditingTouched;
            }
            return State.EditingNotTouched;
        }
        if (canSubmit()) {
            return State.AddingCanSubmit;
        }
        return State.AddingCannotSubmit;
    });
    const disabled = createMemo(() => {
        const s = state();
        return (
            s === State.AddingCannotSubmit ||
            s === State.EditingNotTouched ||
            s === State.EditingSaved
        );
    });

    return (
        <Button type="submit" disabled={disabled()}>
            <Switch fallback={"Save"}>
                <Match
                    when={
                        state() == State.AddingCannotSubmit ||
                        state() === State.AddingCanSubmit
                    }
                >
                    Add
                </Match>
                <Match
                    when={
                        state() === State.EditingTouched ||
                        state() === State.EditingNotTouched
                    }
                >
                    Save
                </Match>
                <Match when={state() === State.EditingSaved}>Saved</Match>
            </Switch>
        </Button>
    );
}

function useFormValue<V>(
    form: Form,
    selector: (f: FormState<ExpenseInput>) => V
) {
    const formState = form.useStore();
    const value = createMemo(() => selector(formState()));
    return value;
}

function dbg<T>(label: string, val: T) {
    console.log(label, val);
    return val;
}

function dbgFormValue<V>(
    form: Form,
    label: string,
    selector: (f: FormState<ExpenseInput>) => V
) {
    const value = useFormValue(form, selector);
    createEffect(() => {
        console.log(label, value());
    });
}

function SplitField(props: {
    form: Form;
    editingID?: string;
    setPrevWasOneOff: (val: true) => void;
}) {
    const ExistingTab = <SplitSelect form={props.form} />;
    const NewTab = (
        <CreateNewOneOffSplit form={props.form} editingID={props.editingID} />
    );
    const editingID = props.editingID;
    const prevSplit = useSplit(() => editingID ?? "/");
    const defaultValue = createMemo(() => {
        if (editingID == null) return "existing" as const;
        const split = prevSplit();
        if (split === undefined) return null;
        if (split === null) return "existing" as const;
        if (split.isOneOff) {
            props.setPrevWasOneOff(true);
            return "new" as const;
        }
        return "existing" as const;
    });
    return (
        <Show when={defaultValue()}>
            {(defaultValue) => (
                <props.form.Field name="mode" defaultValue={defaultValue()}>
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
                                    Split
                                </TabsTrigger>
                                <TabsTrigger
                                    class="text-muted-foreground"
                                    value="new"
                                >
                                    One Off Split
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

function SplitSelect(props: { form: Form }) {
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
        <props.form.Field name="splitId">
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
                        onChange={(opt) =>
                            field().handleChange(opt?.id ?? null)
                        }
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
                        <TextFieldLabel>Split</TextFieldLabel>
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

function CreateNewOneOffSplit(props: { form: Form; editingID?: string }) {
    const users = useUsers();

    const editingID = props.editingID;
    const prevSplit = useSplit(() => editingID ?? "/");
    const portions = createMemo(() => {
        if (props.editingID == null) {
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
                                name={`split.portions. ${user.id} `}
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

function parseDate(value: string) {
    const date = new Date(value);
    return date.getTime();
}

type FieldProps = {
    validator: Zod.ZodType;
    name: keyof ExpenseInput;
    label: string;
    placeholder: string;
    type: "text" | "number" | "password" | "email" | "tel" | "date";
    form: Form;
    parse?: (value: string) => any;
    step?: string;
};

// TODO: move to components
export function Field(props: FieldProps) {
    const { validator, name, label, type, form, step, placeholder } = props;
    const field = form.createField(() => ({ name, validator }));
    return (
        <TextField
            validationState={
                field().getMeta().touchedErrors.length > 0 ? "invalid" : "valid"
            }
        >
            <TextFieldLabel>{label}</TextFieldLabel>
            <TextFieldInput
                type={type}
                placeholder={placeholder}
                step={step}
                value={
                    type === "date"
                        ? formatDate(field().getValue())
                        : field().getValue() ?? ""
                }
                onChange={(e) =>
                    field().handleChange(
                        props.parse?.(e.target.value) ?? e.target.value
                    )
                }
            />
            <TextFieldErrorMessage>
                <For each={field().state.meta.errors}>
                    {(error) => <div class="text-red-500">{error}</div>}
                </For>
            </TextFieldErrorMessage>
        </TextField>
    );
}

function formatDate(date: number | string | null) {
    if (date == null) {
        return undefined;
    }
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

export function MoneyField(props: Omit<FieldProps, "type">) {
    // TODO: use step
    const { validator, name, label, form, step, placeholder } = props;
    const transformValue = (value: string | number | null) => {
        const fVal = value;
        let nVal;
        if (typeof fVal === "string") {
            nVal = parseFloat(fVal);
        } else {
            nVal = fVal;
        }
        if (nVal == null || isNaN(nVal)) {
            nVal = undefined;
        }
        return nVal;
    };
    return (
        <form.Field
            name={name}
            validators={{
                onChange: validator,
            }}
        >
            {(field) => {
                const rawValue = createMemo(() =>
                    transformValue(field().state.value)
                );
                return (
                    <NumberField
                        rawValue={rawValue()}
                        onRawValueChange={(value) => {
                            if (isNaN(value)) {
                                // @ts-expect-error used to get "Required" error instead of "got nan" error when no value
                                value = undefined;
                            }
                            field().handleChange(value);
                        }}
                        validationState={
                            field().getMeta().touchedErrors.length > 0
                                ? "invalid"
                                : "valid"
                        }
                        format
                        formatOptions={{
                            style: "currency",
                            currency: "USD",
                        }}
                    >
                        <NumberFieldLabel>{label}</NumberFieldLabel>
                        <NumberFieldInput placeholder={placeholder} />
                        <NumberFieldErrorMessage>
                            <For each={field().state.meta.errors}>
                                {(error) => (
                                    <div class="text-red-500">{error}</div>
                                )}
                            </For>
                        </NumberFieldErrorMessage>
                    </NumberField>
                );
            }}
        </form.Field>
    );
}

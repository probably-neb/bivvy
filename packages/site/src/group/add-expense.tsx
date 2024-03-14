import { For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
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
} from "@/lib/rep";
import {
    SplitRenderer,
    UserProfileRenderer,
    UserRenderer,
} from "@/components/renderers";
import {
    NumberField,
    NumberFieldErrorMessage,
    NumberFieldInput,
    NumberFieldLabel,
} from "@/components/ui/numberfield";
import z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleButton } from "@/components/ui/toggle";
import { assert, deepClone } from "@/lib/utils";

type SplitMode = "existing" | "new";
const zExpenseInput = z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("existing"), ...zBaseExpenseInput.shape }),
    z.object({
        mode: z.literal("new"),
        ...zExpenseWithOneOffSplitInput.shape,
        split: zExpenseWithOneOffSplitInput.shape.split
            .omit({ portions: true })
            .and(z.object({portions: z.record(z.number().int().min(0))})),
    }),
]);
type ExpenseInput = z.infer<typeof zExpenseInput>;
type Form = FormApi<ExpenseInput, typeof zodValidator>;

export function AddExpenseCard(props: {
    onSubmit?: () => void;
    expense?: Expense;
}) {
    const mutations = useMutations();

    const expenseToEdit = props.expense;
    const isEditing = expenseToEdit != null;

    // this has the nice beneifit of making these values non-reactive so they for sure won't
    // update if the expense changes while editing
    const defaultValues = expenseToEdit && {
        description: expenseToEdit.description,
        amount: expenseToEdit.amount / 100 + 0.0,
        paidOn: expenseToEdit.paidOn,
        splitId: expenseToEdit.splitId,
        // NOTE: required otherwise @tanstack/form fails to clean up after itself
        split: {portions: {}},
        mode: "existing" as const,
    };

    const form: Form = createForm<ExpenseInput, typeof zExpenseInput>(() => ({
        onSubmit: async ({ value }) => {
            // copy so the following changes are not reflected in the visible form state
            value = deepClone(value)
            // convert to cents, since thats what we store everywhere else
            value.amount *= 100;
            if (value.mode ==="new") {
                value.split.portions = removeSpacesFromKeys(value.split.portions);
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
                    const e = Object.assign({}, expenseToEdit, value);
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
            console.error("invalid", props.value, zExpenseInput.safeParse(props.value));
        },
        defaultValues,
        validators: {
            onSubmit: zExpenseInput,
        },
    }));

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
                        await form
                            .handleSubmit()
                        props.onSubmit?.();
                        console.log("submitted expense")
                    } catch (e) {
                        console.error(e)
                    }
                }}
            >
                <Field
                    name="description"
                    label="Description"
                    placeholder="Sparkling Apple Cider"
                    type="text"
                    validator={zBaseExpenseInput.shape.description}
                    form={form}
                />
                <MoneyField
                    name="amount"
                    label="Amount"
                    placeholder="10.00"
                    validator={zBaseExpenseInput.shape.amount}
                    step="any"
                    form={form}
                />
                <SplitSelect form={form} />
                <Field
                    name="paidOn"
                    label="Paid On"
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

function addSpacesToKeys(obj: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [` ${k} `, v])
    );
}

function removeSpacesFromKeys(obj: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k.trim(), v])
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
    console.log(label, val)
    return val
}

function SplitSelect(props: { form: Form }) {
    const ExistingTab = <ExistingSplitSelect form={props.form} />;
    const NewTab = <CreateNewOneOffSplit form={props.form} />;
    return (
        <props.form.Field name="mode" defaultValue="existing">
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
                        <TabsTrigger class="text-muted-foreground" value="new">
                            One Off Split
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing">{ExistingTab}</TabsContent>
                    <TabsContent value="new">{NewTab}</TabsContent>
                </Tabs>
            )}
        </props.form.Field>
    );
}

function ExistingSplitSelect(props: { form: Form }) {
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

function CreateNewOneOffSplit(props: { form: Form }) {
    const users = useUsers();
    return (
        <div>
            <For each={users()}>
                {(user) => (
                    <props.form.Field name={`split.portions. ${user.id} `} defaultValue={0}>
                        {(field) => (
                            <ToggleButton
                                onChange={(pressed) =>
                                    field().handleChange(pressed ? 1 : 0)
                                }
                            >
                                <UserRenderer userId={user.id} />
                            </ToggleButton>
                        )}
                    </props.form.Field>
                )}
            </For>
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
    return (
        <form.Field
            name={name}
            validators={{
                onChange: validator,
            }}
        >
            {(field) => (
                <TextField
                    validationState={
                        field().getMeta().touchedErrors.length > 0
                            ? "invalid"
                            : "valid"
                    }
                >
                    <TextFieldLabel>{label}</TextFieldLabel>
                    <TextFieldInput
                        type={type}
                        placeholder={placeholder}
                        step={step}
                        value={
                            type === "date"
                                ? formatDate(field().state.value!)
                                : field().state.value ?? ""
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
            )}
        </form.Field>
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
        // console.log({ fVal, nVal });
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
                const rawValue = createMemo(() => transformValue(field().state.value))
                return <NumberField
                    rawValue={rawValue()}
                    onRawValueChange={(value) => {
                        if (isNaN(value)) {
                            // @ts-ignore used to get "Required" error instead of "got nan" error when no value
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
                            {(error) => <div class="text-red-500">{error}</div>}
                        </For>
                    </NumberFieldErrorMessage>
                </NumberField>
            }}
        </form.Field>
    );
}

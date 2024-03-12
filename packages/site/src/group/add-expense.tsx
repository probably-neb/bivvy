import { For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    ExpenseInput,
    useMutations,
    expenseInputSchema,
    useSplits,
    Expense,
} from "@/lib/rep";
import { SplitRenderer } from "@/components/renderers";

type Form = FormApi<ExpenseInput, typeof zodValidator>;

export function AddExpenseCard(props: {
    onSubmit?: () => void;
    expense?: Expense;
}) {
    const { addExpense, expenseEdit } = useMutations();

    const expenseToEdit = props.expense;
    const isEditing = expenseToEdit != null;

    // this has the nice beneifit of making these values non-reactive so they for sure won't
    // update if the expense changes while editing
    const defaultValues = expenseToEdit && {
        description: expenseToEdit.description,
        amount: expenseToEdit.amount / 100 + 0.0,
        paidOn: expenseToEdit.paidOn,
        splitId: expenseToEdit.splitId,
    };

    const form: Form = createForm(() => ({
        onSubmit: async ({ value, formApi }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            // convert to cents, since thats what we store everywhere else
            // spread so the change is not reflected in the visible form state
            value = { ...value, amount: value.amount * 100 };
            try {
                if (isEditing) {
                    const e = Object.assign({}, expenseToEdit, value);
                    await expenseEdit(e);
                    formApi.state.isTouched = false
                } else {
                    await addExpense(value);
                }
                props.onSubmit?.();
            } catch (e) {
                console.error(e);
            }
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        defaultValues,
        validators: {
            onSubmit: expenseInputSchema,
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
                    await form
                        .handleSubmit()
                        .then(() => console.log("submitted"));
                    // void form.validate("submit");
                    // await addExpense(form.state.values);
                }}
            >
                <Field
                    name="description"
                    label="Description"
                    placeholder="Sparkling Apple Cider"
                    type="text"
                    validator={expenseInputSchema.shape.description}
                    form={form}
                />
                <Field
                    name="amount"
                    label="Amount"
                    placeholder="10.00"
                    validator={expenseInputSchema.shape.amount}
                    type="number"
                    step="any"
                    parse={parseAmount}
                    form={form}
                />
                <SplitSelect form={form} />
                <Field
                    name="paidOn"
                    label="Paid On"
                    placeholder="2021-01-01"
                    type="date"
                    validator={expenseInputSchema.shape.paidOn}
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
        <Button type="submit" disabled={disabled()} >
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
    selector: (f: FormState<ExpenseInput>) => V,
) {
    const formState = form.useStore();
    const value = createMemo(() => selector(formState()));
    return value;
}

function SplitSelect(props: { form: Form }) {
    const splits = useSplits();
    const allOptions = createMemo(() =>
        (splits() ?? []).map((split) => ({
            name: split.name,
            id: split.id,
            element: () => <SplitRenderer splitId={split.id} />,
        })),
    );
    type Option = typeof allOptions extends () => Array<infer O> ? O : never;

    const [value, setValue] = createSignal("");
    const filter = createFilter({ sensitivity: "base" });
    const options = createMemo(() => {
        if (value() === "") {
            return allOptions();
        }
        return allOptions().filter((option) =>
            filter.contains(option.name, value()),
        );
    });
    const selectedId = useFormValue(
        props.form,
        (f) => f.values.splitId as string | undefined,
    );
    const selected = createMemo(() => {
        const id = selectedId();
        if (id == null || id === "") {
            return undefined;
        }
        return allOptions().find((o) => o.id === id);
    });
    const onChange = (value: Option | null) => {
        if (!value) {
            return;
        }
        console.log("setting field", value);
        props.form.setFieldValue("splitId", value.id, {touch: true});
    };

    const onOpenChange = (
        isOpen: boolean,
        triggerMode?: ComboboxTriggerMode,
    ) => {
        if (isOpen && triggerMode === "manual") {
            setValue("");
        }
    };
    return (
        <Combobox<Option>
            value={selected()}
            options={options()}
            onInputChange={(value) => setValue(value)}
            onChange={onChange}
            onOpenChange={onOpenChange}
            optionTextValue="name"
            optionValue="id"
            optionLabel="name"
            itemComponent={(props) => {
                return (
                    <ComboboxItem item={props.item}>
                        <props.item.rawValue.element />
                    </ComboboxItem>
                );
            }}
        >
            <TextFieldLabel>Split</TextFieldLabel>
            <ComboboxTrigger>
                {/*
                    FIXME: this looks ok but basically just makes it a select. Need to figure out how to
                           restore combobox functionality (search by typing)
                */}
                <Show when={selected()} fallback={<div class="w-full"></div>}>
                    {selected()!.element()}
                </Show>
                {/* selected()?.element() ?? <div class="w-full"></div> */}
                <ComboboxInput hidden />
            </ComboboxTrigger>
            <ComboboxContent />
        </Combobox>
    );
}

function parseAmount(value: string) {
    const v = parseFloat(value);
    if (isNaN(v)) {
        return undefined;
    }
    return v;
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
                        value={type === "date" ? formatDate(field().state.value!) : field().state.value ?? ""}
                        onChange={(e) =>
                            field().handleChange(
                                props.parse?.(e.target.value) ?? e.target.value,
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
        return undefined
    }
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

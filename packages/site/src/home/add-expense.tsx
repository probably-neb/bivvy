import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { ExpenseInput, addExpense, expenseInputSchema } from "@/lib/rep";
import { For } from "solid-js";

export function AddExpenseCard() {
    const form = createForm<ExpenseInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            try {
                await addExpense(value);
            } catch (e) {
                console.error(e)
            }
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors)
        },
        validators: {
            onSubmit: expenseInputSchema,
        },
    }));


    return (
        <Card>
            <CardHeader>
                <CardTitle>New Expense</CardTitle>
            </CardHeader>
            <CardContent>
                <form.Provider>
                    <form
                        class="flex flex-col gap-4"
                        lang="en"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // console.log("submit", form.state.values)
                            await form.handleSubmit().then(() => console.log("submitted"));
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
                        <Field
                            name="paidOn"
                            label="Paid On"
                            placeholder="2021-01-01"
                            type="date"
                            validator={expenseInputSchema.shape.paidOn}
                            parse={parseDate}
                            form={form}
                        />
                        <Button type="submit" disabled={!form.state.canSubmit}>
                            Add
                        </Button>
                    </form>
                </form.Provider>
            </CardContent>
        </Card>
    );
}

function parseAmount (value: string) {
    const v = parseFloat(value);
    if (isNaN(v)) {
        return undefined;
    }
    // convert to cents, since thats what we store everywhere else
    return v * 100;
}

function parseDate(value: string) {
    console.log("parse date", value)
    const date = new Date(value);
    return date.getTime();
}

type FieldProps = {
    validator: Zod.ZodType;
    name: keyof ExpenseInput;
    label: string;
    placeholder: string;
    type: "text" | "number" | "password" | "email" | "tel" | "date";
    form: FormApi<ExpenseInput, typeof zodValidator>;
    parse?: (value: string) => any;
    step?: string;
};

// TODO: move to components
export function Field(props: FieldProps) {
    const { validator, name, label, type, form, step, placeholder} = props;
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
                        onChange={(e) =>
                            field().handleChange(props.parse?.(e.target.value) ?? e.target.value)
                        }
                    />
                    <TextFieldErrorMessage>
                        <For each={[field().state.meta.errors]}>
                            {(error) => <div class="text-red-500">{error}</div>}
                        </For>
                    </TextFieldErrorMessage>
                </TextField>
            )}
        </form.Field>
    );
}

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
import { ExpenseInput, expenseInputSchema, addExpense } from "@/lib/rep";
import { For } from "solid-js";

export function AddExpenseCard() {
    const form = createForm<ExpenseInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            await addExpense(value);
        },
        validatorAdapter: zodValidator,
        validators: {
            onSubmit: expenseInputSchema,
        },
    }));

    const parseAmount = (value: string) => {
        const v = parseFloat(value);
        if (isNaN(v)) {
            return undefined;
        }
        return v;
    }
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
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void form.handleSubmit();
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
                            parse={(value) => new Date(value)}
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

function Field(props: FieldProps) {
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

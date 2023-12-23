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
import { ExpenseInput, ExpenseInputSchema, addExpense } from "@/lib/rep";
import { For } from "solid-js";
import z from "zod";

export function AddExpenseCard() {
    const form = createForm<ExpenseInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            await addExpense(value);
        },
        validatorAdapter: zodValidator,
        validators: {
            onSubmit: ExpenseInputSchema,
        },
    }));
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
                <form.Provider>
                    <form
                        class="flex flex-col gap-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void form.handleSubmit();
                        }}
                    >
                        <Field
                            form={form}
                            label="Name"
                            name="payer"
                            validator={ExpenseInputSchema.shape.payer}
                            type="text"
                        />
                        <Field
                            form={form}
                            label="Amount"
                            name="amount"
                            validator={ExpenseInputSchema.shape.amount}
                            type="number"
                            step="0.01"
                            parse={parseFloat}
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
    type: "text" | "number" | "password" | "email" | "tel";
    parse?: (x: string) => any;
    form: FormApi<ExpenseInput, typeof zodValidator>;
    step?: string;
};
function Field(props: FieldProps) {
    const { validator, name, label, type, form, step } = props;
    const parse = props.parse ?? ((x) => x);
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
                        step={step}
                        placeholder={label}
                        onChange={(e) =>
                            field().handleChange(parse(e.target.value))
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

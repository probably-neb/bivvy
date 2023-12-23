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
                            form={form}
                            label="Name"
                            name="payer"
                            validator={ExpenseInputSchema.shape.payer}
                            type="text"
                        />
                        {/* HACK: copying generated html until kobalte fixes it's inputs handling of floats */}
                        <form.Field
                            name="amount"
                            validators={{
                                onChange: ExpenseInputSchema.shape.amount,
                            }}
                        >
                            {(field) => (
                                <div role="group" id="textfield-cl-18">
                                    <label
                                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        id="textfield-cl-18-label"
                                        for="textfield-cl-18-input"
                                    >
                                        Amount
                                    </label>
                                    <input
                                        id="textfield-cl-18-input"
                                        name="textfield-cl-18"
                                        type="number"
                                        step="any"
                                        min="0"
                                        inputmode="decimal"
                                        placeholder="10.00"
                                        class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-labelledby="textfield-cl-18-label"
                                        aria-invalid="true"
                                        aria-describedby="textfield-cl-18-error-message"
                                        onChange={(e) =>
                                            isNaN(e.target.valueAsNumber)
                                                ? field().handleChange(
                                                      undefined as any,
                                                  )
                                                : field().handleChange(
                                                      e.target.valueAsNumber,
                                                  )
                                        }
                                    />
                                    <For each={[field().state.meta.errors]}>
                                        {(error) => (
                                            <div class="text-red-500">
                                                {error}
                                            </div>
                                        )}
                                    </For>
                                </div>
                            )}
                        </form.Field>
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
    form: FormApi<ExpenseInput, typeof zodValidator>;
};

function Field(props: FieldProps) {
    const { validator, name, label, type, form } = props;
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
                        as="input"
                        type={type}
                        placeholder={label}
                        onChange={(e) =>
                            field().handleChange(e.target.valueAsNumber)
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

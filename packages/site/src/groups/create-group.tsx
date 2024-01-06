import { For } from "solid-js";
import { Button } from "@/components/ui/button";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import {
    useMutations,
    expenseInputSchema,
    GroupInput,
    groupInputSchema,
} from "@/lib/rep";

type Form = FormApi<GroupInput, typeof zodValidator>;

export function CreateGroupForm(props: {onSubmit?: () => void}) {
    const { createGroup } = useMutations();
    const form: Form = createForm(() => ({
        onSubmit: async ({ value, formApi}) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            try {
                await createGroup(value.name);
                formApi.reset();
                props.onSubmit?.();
            } catch (e) {
                console.error(e);
            }
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        validators: {
            onSubmit: groupInputSchema,
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
                }}
            >
                <Field
                    name="name"
                    label="Name"
                    placeholder="Vacation to Hawaii"
                    type="text"
                    validator={groupInputSchema.shape.name}
                    form={form}
                />
                <Button type="submit" disabled={!form.state.canSubmit}>
                    Create
                </Button>
            </form>
        </form.Provider>
    );
}

type FieldProps = {
    validator: Zod.ZodType;
    name: keyof Form["state"]["values"];
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

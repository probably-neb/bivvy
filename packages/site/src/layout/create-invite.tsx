import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import {
    InviteInput,
    inviteInputSchema,
    splitInputSchema,
    useMutations,
} from "@/lib/rep";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { For } from "solid-js";
import z from "zod";

type InviteForm = FormApi<InviteInput, typeof zodValidator>;

export function CreateInviteForm(props: { onSubmit: () => void }) {
    const { createInvite } = useMutations();
    const form = createForm<InviteInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value, formApi }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            await createInvite(value);
            formApi.reset();
            props.onSubmit?.();
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        validators: {
            onSubmit: inviteInputSchema,
        },
        defaultState: {
            canSubmit: false,
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
                    console.log(
                        "values",
                        inviteInputSchema.safeParse(form.state.values),
                    );
                    await form.handleSubmit();
                }}
            >
                <Field
                    name="email"
                    label="Email"
                    placeholder="party@my.house"
                    validator={inviteInputSchema.shape.email}
                    type="email"
                    form={form}
                />
                <Button type="submit" disabled={!form.state.canSubmit}>
                    Invite
                </Button>
            </form>
        </form.Provider>
    );
}

type FieldOf<Form extends FormApi<any, any>> = Form["fieldInfo"] extends Record<
    infer Field,
    any
>
    ? Field
    : never;

type ZodForm<Validator extends Zod.ZodTypeAny> = FormApi<
    z.infer<Validator>,
    typeof zodValidator
>;

type FieldProps<
    Validator extends Zod.ZodTypeAny,
    Form extends ZodForm<Validator> = ZodForm<Validator>,
> = {
    validator: Zod.ZodType;
    name: FieldOf<Form>;
    label: string;
    placeholder: string;
    type: "text" | "number" | "password" | "email" | "tel" | "date";
    form: Form;
    parse?: (value: string) => any;
    step?: string;
};

// TODO: move to components
export function Field(props: FieldProps<typeof inviteInputSchema>) {
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
                        <For each={[field().state.meta.errors]}>
                            {(error) => <div class="text-red-500">{error}</div>}
                        </For>
                    </TextFieldErrorMessage>
                </TextField>
            )}
        </form.Field>
    );
}

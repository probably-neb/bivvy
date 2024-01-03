import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import { SplitInput, createSplit, splitInputSchema, useUsers } from "@/lib/rep";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { For, createMemo, onMount } from "solid-js";
import z from "zod";
import { createEffect, on } from "solid-js";
import { UserRenderer } from "@/components/renderers";
import { BlockPicker, ColorResult } from "solid-color";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SplitForm = FormApi<SplitInput, typeof zodValidator>;

export function CreateSplit() {
    const form = createForm<SplitInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            await createSplit(value);
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        validators: {
            onSubmit: splitInputSchema,
        },
        defaultState: {
            canSubmit: false,
        },
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Split</CardTitle>
            </CardHeader>
            <CardContent>
                <form.Provider>
                    <form
                        class="flex flex-col gap-4"
                        lang="en"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("values", splitInputSchema.safeParse(form.state.values))
                            await form.handleSubmit();
                        }}
                    >
                        <div class="flex flex-row gap-4 items-end">
                            <Field
                                name="name"
                                label="Name"
                                placeholder="Utilities"
                                validator={splitInputSchema.shape.name}
                                type="text"
                                form={form}
                            />
                            <SplitColorPick form={form} />
                        </div>
                        <UserPortions form={form} />
                        <Button type="submit" disabled={!form.state.canSubmit}>
                            Create
                        </Button>
                    </form>
                </form.Provider>
            </CardContent>
        </Card>
    );
}

const colors = [
        '#D9E3F0',
        '#F47373',
        '#697689',
        '#37D67A',
        '#2CCCE4',
        '#555555',
        '#dce775',
        '#ff8a65',
        '#ba68c8',
]

function randomHexColor() {
    return `#${colors[Math.floor(Math.random() * colors.length)]}`;
}

function SplitColorPick(props: { form: SplitForm }) {
    return (
        <props.form.Field name="color">
            {(field) => {
                const color = createMemo(
                    () => field().state.value || randomHexColor(),
                );
                onMount(
                    on(color, (color) => {
                        console.log("color", color);
                        field().setValue(color, { touch: false });
                    }),
                );
                const onChange = (color: ColorResult) => {
                    field().setValue(color.hex, { touch: true });
                };

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div
                                class="h-[2rem] w-[3rem] ring-1 ring-gray-400 rounded-md"
                                style={{ background: color() }}
                            ></div>
                        <For each={field().state.meta.errors}>
                            {(error) => <div class="text-red-500">{error}</div>}
                        </For>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <BlockPicker
                                colors={colors}
                                color={color()}
                                onChangeComplete={onChange}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }}
        </props.form.Field>
    );
}

function UserPortions(props: { form: SplitForm }) {
    const users = useUsers();
    const numUsers = createMemo(
        on(users, (users) => {
            if (!users || users.length === 0) {
                return 1;
            }
            return users.length;
        }),
    );
    const portion = createMemo(() => 1.0 / numUsers());
    const portionPercent = createMemo(() => `${portion() * 100}%`);

    return (
        <div class="grid grid-cols-[max-content_max-content] gap-x-4">
            <For each={users()}>
                {(user) => (
                    <props.form.Field
                        name={`portions.${user.id}`}
                        validators={{
                            onChange: splitInputSchema.shape.portions.element,
                        }}
                    >
                        {(field) => {
                            createEffect(
                                on(portion, (p) => {
                                    field().setValue(p, { touch: false });
                                }),
                            );
                            return (
                                <>
                                    <UserRenderer userId={user.id} />{" "}
                                    <span>{portionPercent()}</span>
                                </>
                            );
                        }}
                    </props.form.Field>
                )}
            </For>
        </div>
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
export function Field(props: FieldProps<typeof splitInputSchema>) {
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

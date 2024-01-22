import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import {
    SplitInput,
    splitInputSchema,
    useMutations,
    useUsers,
} from "@/lib/rep";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { For, Setter, createMemo, createSignal, onMount } from "solid-js";
import z from "zod";
import { createEffect, on } from "solid-js";
import { UserRenderer } from "@/components/renderers";
import { BlockPicker, ColorResult } from "solid-color";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./no-spinners.css";
import { AiOutlineMinus, AiOutlinePlus } from "solid-icons/ai";

type SplitForm = FormApi<SplitInput, typeof zodValidator>;

export function CreateSplitDialog(props: {
    open: boolean;
    setOpen: (b: boolean) => void;
}) {
    return (
        <Dialog open={props.open} onOpenChange={props.setOpen}>
            <DialogContent>
                <DialogTitle>New Split</DialogTitle>
                <CreateSplit onSubmit={() => props.setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export function CreateSplit(props: { onSubmit?: () => void }) {
    const { createSplit } = useMutations();
    const form = createForm<SplitInput, typeof zodValidator>(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            await createSplit(value);
            props.onSubmit?.();
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
        <form.Provider>
            <form
                class="flex flex-col gap-4"
                lang="en"
                onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                        "values",
                        splitInputSchema.safeParse(form.state.values),
                    );
                    await form.handleSubmit();
                }}
            >
                <div class="flex flex-row gap-4 items-end">
                    {/* FIXME: when `required` shows up split color pick stays centered */}
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
                <PortionParts form={form} />
                <Button type="submit" disabled={!form.state.canSubmit}>
                    Create
                </Button>
            </form>
        </form.Provider>
    );
}

const colors = [
    "#D9E3F0",
    "#F47373",
    "#697689",
    "#37D67A",
    "#2CCCE4",
    "#555555",
    "#dce775",
    "#ff8a65",
    "#ba68c8",
];

function randomHexColor() {
    return `#${colors[Math.floor(Math.random() * colors.length)]}`;
}

function SplitColorPick(props: { form: SplitForm }) {
    return (
        <props.form.Field name="color">
            {(field) => (
                <ColorPicker
                    value={field().state.value}
                    set={field().setValue}
                />
            )}
        </props.form.Field>
    );
}

function ColorPicker(props: {
    set: (color: string | null, opts: { touch: boolean }) => void;
    value: string | null;
    errors?: string[];
}) {
    const color = createMemo(() => props.value || randomHexColor());
    onMount(
        on(color, (color) => {
            console.log("color", color);
            if (color === null) {
                props.set(randomHexColor(), { touch: false });
            }
        }),
    );

    const [open, setOpen] = createSignal(false);

    const onChange = (color: ColorResult) => {
        props.set(color.hex, { touch: true });
        setOpen(false);
    };

    return (
        <DropdownMenu open={open()} onOpenChange={setOpen}>
            <DropdownMenuTrigger>
                <div
                    class="h-[2rem] w-[3rem] ring-1 ring-gray-400 rounded-md"
                    style={{ background: color() }}
                ></div>
                <For each={props.errors}>
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
}

const zParts = z.number().min(0).max(100);

function PortionParts(props: { form: SplitForm }) {
    // TODO: store portions, total in portion types + db
    // i.e. calculate owed as parts * amount / numParts
    // where for pecentage numparts is 1.0 (25% * amount / 1.0)
    const users = useUsers();
    return (
        <div class="flex">
            <div class="shrink grid grid-cols-2">
                <For each={users()}>
                    {(user) => {
                        const id = `portions.${user.id}` as const;
                        if (
                            props.form.state.values.portions?.[user.id] ===
                            undefined
                        ) {
                            props.form.setFieldValue(id, 1);
                        }
                        return (
                            <props.form.Field
                                name={id}
                                validators={{
                                    onChange: zParts,
                                }}
                            >
                                {(field) => (
                                    <>
                                        <UserRenderer userId={user.id} />
                                        <Incrementer
                                            value={field().state.value}
                                            onChange={field().handleChange}
                                        />
                                    </>
                                )}
                            </props.form.Field>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}

function Incrementer(props: { value: number; onChange: Setter<number> }) {
    const decrement = () =>
        props.onChange((value) => (value <= 0 ? 0 : value - 1));
    const increment = () => props.onChange((value) => value + 1);
    const btnclass =
        "text-xl rounded-full h-6 w-6 flex items-center justify-center select-none text-white bg-gray-900 hover:bg-gray-700";
    return (
        <div class="flex items-center gap-2">
            <button class={btnclass} type="button" onClick={decrement}>
                <AiOutlineMinus />
            </button>
            <TextField>
                <TextFieldInput
                    type="number"
                    class={`no-spinners w-12 px-0 text-center rounded-full py-0`}
                    value={props.value}
                />
            </TextField>
            <button class={btnclass} type="button" onClick={increment}>
                <AiOutlinePlus />
            </button>
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
                </TextField>
            )}
        </form.Field>
    );
}

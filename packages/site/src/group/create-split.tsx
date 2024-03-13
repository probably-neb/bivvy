import { Button } from "@/components/ui/button";
import {
    TextField,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import {
    Split,
    SplitInput,
    splitInputSchema,
    useMutations,
    useSortedUsers,
} from "@/lib/rep";
import { createForm, FormApi } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { For, Setter, createMemo, createSignal, onMount } from "solid-js";
import z from "zod";
import { on } from "solid-js";
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
import { not } from "@/lib/utils";
import { randomColor, usePossibleColors } from "@/lib/patterns";

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

const getDefaultValuesFromSplit = (split: Split) => ({
    name: split.name,
    color: split.color,
    portions: addSpacesToKeys(split.portions),
});

export function CreateSplit(props: { onSubmit?: () => void; split?: Split }) {
    const { createSplit, splitEdit } = useMutations();

    const editingSplit = props.split;
    const isEditing = editingSplit != null;

    const defaultValues =
        props.split != null
            ? getDefaultValuesFromSplit(props.split)
            : {
                  name: "",
                  color: randomColor(),
                  portions: {},
              };
    const form = createForm(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            const splitInput = Object.assign({}, value, {
                portions: removeSpacesFromKeys(value.portions),
            });
            if (isEditing) {
                const split = Object.assign({}, editingSplit, splitInput);
                console.log("edit", split);
                await splitEdit(split);
            } else {
                console.log("create", splitInput);
                await createSplit(splitInput);
            }
            props.onSubmit?.();
            console.log("submiteed", value);
        },
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        validators: {
            onSubmit: splitInputSchema.omit({ portions: true }).and(
                z.object({
                    portions: z.record(zParts),
                })
            ),
        },
        defaultValues,
        defaultState: {
            canSubmit: false,
        },
    }));

    return (
        <form.Provider>
            <form
                class="flex flex-col gap-4 max-w-fit"
                lang="en"
                onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                        "values",
                        splitInputSchema.safeParse(form.state.values)
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
                <PortionParts form={form} isEditing={isEditing} />
                <div class="inline-flex justify-center">
                    <Button
                        type="submit"
                        disabled={!form.state.canSubmit}
                        class="w-20"
                    >
                        {isEditing ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </form.Provider>
    );
}

function SplitColorPick(props: { form: SplitForm }) {
    return (
        <props.form.Field name="color">
            {(field) => (
                <ColorPicker
                    value={field().state.value}
                    set={field().handleChange}
                />
            )}
        </props.form.Field>
    );
}

const SPLIT_COLORS = [
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

function ColorPicker(props: {
    set: (color: string | null, opts: { touch: boolean }) => void;
    value: string | null;
    errors?: string[];
}) {
    const color = createMemo(() => props.value ?? undefined);

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
                    style={{ background: color()}}
                ></div>
                <For each={props.errors}>
                    {(error) => <div class="text-red-500">{error}</div>}
                </For>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <BlockPicker
                    colors={SPLIT_COLORS}
                    color={color()}
                    onChangeComplete={onChange}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const zParts = z.number().min(0).max(100);

function useTotalPortions(form: SplitForm) {
    const portions = subscribeToField(form, (values) =>
        Object.values(values.portions ?? {})
    );
    const total = createMemo(() => {
        const total = portions()?.reduce((acc, val) => acc + val, 0) ?? 0.0;
        return total;
    });
    return total;
}

export function PortionParts(props: { form: SplitForm, isEditing: boolean}) {
    // TODO: store portions, total in portion types + db
    // i.e. calculate owed as parts * amount / numParts
    // where for pecentage numparts is 1.0 (25% * amount / 1.0)
    const users = useSortedUsers();

    const totalPortions = useTotalPortions(props.form);

    const usersList = (
        <For each={users()}>
            {(user) => (
                <UserPortionParts
                    form={props.form}
                    userId={user.id}
                    isEditing={props.isEditing}
                    totalPortions={totalPortions()}
                />
            )}
        </For>
    );

    return (
        <div class="flex">
            <div class="shrink grid grid-cols-3 justify-start items-center gap-4">
                {usersList}
            </div>
        </div>
    );
}

function UserPortionParts(props: {
    form: SplitForm;
    userId: string;
    totalPortions: number;
    isEditing: boolean;
}) {
    // NOTE: spaces around userId here because form will recognize ids that are valid integers as array indices
    // see `onSubmit` where we use `trim` to remove the spaces
    const userID = ` ${props.userId} ` as const;
    const id = `portions.${userID}` as const;

    // For some reason, defaultValue on the Field component does not work
    // when remounting with a new split to edit
    const portion = props.form.state.values.portions?.[userID];
    if (not(portion)) {
        let defaultPortion = 1
        if (props.isEditing) {
            defaultPortion = 0
        }
        props.form.setFieldValue(id, defaultPortion);
    }
    return (
        <props.form.Field name={id}>
            {(field) => (
                <>
                    <UserRenderer userId={props.userId} />
                    <PercentagePreview
                        total={props.totalPortions}
                        value={field().state.value}
                    />
                    <Incrementer
                        value={field().state.value}
                        onChange={field().setValue}
                    />
                </>
            )}
        </props.form.Field>
    );
}

function PercentagePreview(props: { total: number; value: number }) {
    const percent = createMemo(() => {
        const value = (props.value / props.total) * 100;
        return `${value.toFixed(2)}%`;
    });
    return <span class="text-slate-600 italic">{percent()}</span>;
}

function Incrementer(props: { value: number; onChange: Setter<number> }) {
    const onChange = (value: number) =>
        props.onChange(isNaN(value) || value < 0 ? 0 : value);
    const decrement = () =>
        props.onChange((value) => (value <= 0 ? 0 : value - 1));
    const increment = () => props.onChange((value) => value + 1);
    const btnclass =
        "text-xl rounded-full h-6 w-6 flex items-center justify-center select-none text-white bg-gray-900 hover:bg-gray-700";
    return (
        <div class="justify-center flex items-center gap-1">
            <button class={btnclass} type="button" onClick={decrement}>
                <AiOutlineMinus />
            </button>
            <TextField>
                <TextFieldInput
                    type="number"
                    class="no-spinners w-12 px-0 text-center rounded-full py-0"
                    value={props.value}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                />
            </TextField>
            <button class={btnclass} type="button" onClick={increment}>
                <AiOutlinePlus />
            </button>
        </div>
    );
}

function subscribeToField<Form extends FormApi<any, any>, V>(
    form: Form,
    selector: (f: SplitInput) => V
) {
    const formState = form.useStore();
    const value = createMemo(() => selector(formState().values));
    return value;
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
    Form extends ZodForm<Validator> = ZodForm<Validator>
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
                        value={field().state.value as any}
                        step={step}
                        onChange={(e) =>
                            field().setValue(
                                props.parse?.(e.target.value) ?? e.target.value
                            )
                        }
                    />
                </TextField>
            )}
        </form.Field>
    );
}

import { Accessor, For, Show, createMemo, createSignal, onMount, on} from "solid-js";
import { Button } from "@/components/ui/button";
import {
    TextField,
    TextFieldErrorMessage,
    TextFieldInput,
    TextFieldLabel,
} from "@/components/ui/textfield";
import { createForm, FormApi, FormState } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import {
    useMutations,
    GroupInput,
    groupInputSchema,
    Group,
} from "@/lib/rep";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pattern, randomPattern, randomColor, usePatternNames, usePossibleColors } from "@/lib/patterns";
import { createFilter } from "@kobalte/core";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxTrigger, ComboboxTriggerMode, ComboboxItem} from "@/components/ui/combobox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BlockPicker, ColorResult } from "solid-color";

type Form = FormApi<GroupInput, typeof zodValidator>;

export function CreateGroupModal(props: {
    open: Accessor<boolean>;
    setOpen: (open: boolean) => void;
    group?: Group;
}) {
    const [patternPreview, _setPatternPreview] = createSignal({color: props.group?.color ?? randomColor(), pattern: props.group?.pattern ?? randomPattern()});
    const setPatternPreview = (pattern: string, color: string) => {
        const preview = {pattern, color}
        _setPatternPreview(preview);
    }
    const isEditing = props.group != null
    return (
        <Dialog open={props.open()} onOpenChange={props.setOpen}>
            <DialogContent class="sm:max-w-[425px] max-w-[80%] p-0">
                <DialogHeader class="w-full h-16 p-0 rounded-t-xl">
                    <Pattern name={patternPreview().pattern} color={patternPreview().color}/>
                </DialogHeader>
                <div class="p-4">
                    <DialogTitle>{`${isEditing ? "Edit" : "Create"} Group`}</DialogTitle>
                    <CreateGroupForm onSubmit={() => props.setOpen(false)} setPatternPreview={setPatternPreview} patternPreview={patternPreview()} group={props.group} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CreateGroupForm(props: {onSubmit?: () => void, patternPreview?: {pattern: string, color: string}, setPatternPreview?: (pattern: string, color: string) => void, group?: Group}) {
    const { createGroup, groupEdit} = useMutations();
    const isEditing = props.group != null
    const defaultValues = {
        name: "",
        pattern: null,
        color: null,
        ...props.group,
        // Pattern Preview defaults to group colors so it should overide groups
        // to cover the case where group color, pattern are null
        ...props.patternPreview,
    }
    const form: Form = createForm(() => ({
        onSubmit: async ({ value }) => {
            // FIXME: server side validation here so that errors can be displayed
            console.log("submit", value);
            try {
                if (isEditing) {
                    const group = Object.assign({}, props.group, value)
                    await groupEdit(group)
                } else {
                    await createGroup(value);
                }
                props.onSubmit?.();
            } catch (e) {
                console.error(e);
            }
        },
        defaultValues,
        validatorAdapter: zodValidator,
        onSubmitInvalid: (e) => {
            console.log("invalid", e.formApi.state.errors);
        },
        validators: {
            onSubmit: groupInputSchema,
        },
    }));

    const onPatternChange = (pattern: string) => {
        form.setFieldValue("pattern", pattern, {touch: true});
        const color = form.state.values.color
        props.setPatternPreview?.(pattern, color!);
    }

    const onColorChange = (color: string) => {
        const pattern = form.state.values.pattern!
        props.setPatternPreview?.(pattern, color)
    }

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
                <div class="w-full grid grid-cols-7 items-end gap-2">
                    <div class="col-span-6 mb-1"><PatternSelect form={form} onChange={onPatternChange} /></div>
                    <div class="col-span-1"><GroupColorPick form={form} onChange={onColorChange} /></div>
                </div>
                <Button type="submit" disabled={!form.state.canSubmit}>
                    {isEditing ? "Edit" :  "Create"}
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
                        value={field().state.value ?? ""}
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

function useFormValue<V>(
    form: Form,
    selector: (f: FormState<GroupInput>) => V,
) {
    const formState = form.useStore();
    const value = createMemo(() => selector(formState()));
    return value;
}

function PatternSelect(props: { form: Form, onChange: (p: string) => void}) {
    const _patterns = usePatternNames()
    const patterns = _patterns.sort((a, b) => a.localeCompare(b))
    type Option = typeof patterns[number]

    const [inputValue, onInputChange] = createSignal("");
    const filter = createFilter({ sensitivity: "base" });

    const options = createMemo(() => {
        const val = inputValue()
        if (val === "") {
            return patterns;
        }
        return patterns.filter((option) =>
            filter.contains(option, val),
        );
    });
    const selected = useFormValue(
        props.form,
        (f) => f.values.pattern as string | undefined,
    );
    const onChange = (value: Option | null) => {
        if (!value) {
            return;
        }
        console.log("setting field", value);
        props.onChange(value)
    };

    const onOpenChange = (
        isOpen: boolean,
        triggerMode?: ComboboxTriggerMode,
    ) => {
        if (isOpen && triggerMode === "manual") {
            onInputChange("");
        }
    };
    return (
        <Combobox<Option>
            value={selected()}
            options={options()}
            onInputChange={onInputChange}
            onChange={onChange}
            onOpenChange={onOpenChange}
            itemComponent={props => <ComboboxItem item={props.item} >{props.item.rawValue}</ComboboxItem>}
        >
            <TextFieldLabel>Pattern</TextFieldLabel>
            <ComboboxTrigger>
                <ComboboxInput />
            </ComboboxTrigger>
            <ComboboxContent class="h-64 overflow-y-auto"/>
        </Combobox>
    );
}


function GroupColorPick(props: { form: Form, onChange: (color: string) => void}) {
    const colors = usePossibleColors()

    return (
        <props.form.Field name="color">
            {(field) => (
                <ColorPicker
                    value={field().state.value!}
                    set={(value) => {
                        field().handleChange(value)
                        if (value != null) {
                            props.onChange(value)
                        }
                    }}
                    colors={colors}
                />
            )}
        </props.form.Field>
    );
}

function ColorPicker(props: {
    set: (color: string | null, opts: { touch: boolean }) => void;
    value: string;
    errors?: string[];
    colors: string[]
}) {
    const color = createMemo(() => {
        console.log("color", props.value)
        return props.value
    });

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
                    style={{ background: color()! }}
                ></div>
                <For each={props.errors}>
                    {(error) => <div class="text-red-500">{error}</div>}
                </For>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <BlockPicker
                    colors={props.colors}
                    color={color()!}
                    onChangeComplete={onChange}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

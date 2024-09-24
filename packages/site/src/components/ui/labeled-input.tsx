import { cn } from "@/lib/utils";
import { JSX, Show, splitProps } from "solid-js";

export interface LabeledInputProps
    extends JSX.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    rightLabel?: JSX.Element;
    rightLabelClass?: string;
}

export default function LabeledInput(props: LabeledInputProps) {
    const [local, rest] = splitProps(props, [
        "class",
        "type",
        "ref",
        "label",
        "rightLabel",
        "rightLabelClass",
        "children",
    ]);
    const id = `labeled-input-${local.label}`;
    return (
        <div class="w-full h-9 relative">
            <label
                for={id}
                class="text-sm absolute left-2 top-0 -translate-y-2/3 px-2 max-w-24 overflow-ellipsis bg-background"
            >
                {local.label}
            </label>
            <Show when={local.rightLabel !== undefined}>
                <div
                    class={cn(
                        "absolute right-2 top-0 -translate-y-2/3 ring-1 max-w-24 overflow-ellipsis ring-foreground bg-background",
                        local.rightLabelClass
                    )}
                >
                    {local.rightLabel}
                </div>
            </Show>
            {local.children}
            <input
                type={local.type}
                class={cn(
                    "flex h-full w-full border border-foreground bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    local.class
                )}
                placeholder={local.label}
                ref={local.ref}
                {...rest}
            />
        </div>
    );
}

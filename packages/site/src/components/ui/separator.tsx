import { cn } from "@/lib/utils"
import { Separator as SeparatorPrimitive } from "@kobalte/core"
import type { VoidComponent } from "solid-js"
import { splitProps } from "solid-js"

export const Separator: VoidComponent<SeparatorPrimitive.SeparatorRootProps> = (
	props
) => {
	const [local, rest] = splitProps(props, ["class"])
	return (
		<SeparatorPrimitive.Root
			class={cn(
				"shrink-0 bg-border data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[1px]",
				local.class
			)}
			{...rest}
		/>
	)
}

export function LabeledSeparator(props: {label: string}) {
    return <div class="flex items-center w-full">
        <Separator />
        <div class="px-2 text-sm text-muted-foreground">{props.label}</div>
        <Separator />
    </div>
}

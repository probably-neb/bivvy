import { cn } from "@/lib/utils"
import { NumberField as NumberFieldPrimitive } from "@kobalte/core"
import { cva } from "class-variance-authority"
import { splitProps, type ParentComponent } from "solid-js"

export const NumberFieldErrorMessage = NumberFieldPrimitive.ErrorMessage
export const NumberFieldDescription = NumberFieldPrimitive.Description
export const NumberField = NumberFieldPrimitive.Root

export const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

export const NumberFieldLabel: ParentComponent<
	NumberFieldPrimitive.NumberFieldLabelProps
> = (props) => {
	const [local, rest] = splitProps(props, ["class"])
	return (
		<NumberFieldPrimitive.Label
			class={cn(labelVariants(), local.class)}
			{...rest}
		/>
	)
}

export const NumberFieldInput: ParentComponent<
	NumberFieldPrimitive.NumberFieldInputProps
> = (props) => {
	const [local, rest] = splitProps(props, ["class"])
	return (
		<NumberFieldPrimitive.Input
			class={cn(
				"flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				local.class
			)}
			{...rest}
		/>
	)
}

import { OverrideComponentProps } from "@kobalte/utils";
import { AsChildProp } from "../polymorphic";
export interface ComboboxIconProps extends OverrideComponentProps<"span", AsChildProp> {
}
/**
 * A small icon often displayed next to the value as a visual affordance for the fact it can be open.
 * It renders a `▼` by default, but you can use your own icon `children`.
 */
export declare function ComboboxIcon(props: ComboboxIconProps): import("solid-js").JSX.Element;
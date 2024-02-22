import HuePointer from './HuePointer';
import { JSX } from 'solid-js';
export type HuePickerProps = {
    width?: string | number;
    height?: string | number;
    direction?: string;
    pointer?: typeof HuePointer;
    className?: string;
    styles?: Record<string, JSX.CSSProperties>;
};
export declare function HuePicker(_props: HuePickerProps): JSX.Element;
declare const _default: (props: HuePickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

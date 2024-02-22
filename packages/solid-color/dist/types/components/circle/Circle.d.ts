import { JSX } from 'solid-js';
export type CirclePickerProps = {
    width?: string | number;
    circleSize?: number;
    circleSpacing?: number;
    className?: string;
    colors?: string[];
    styles?: Record<string, JSX.CSSProperties>;
};
export declare function Circle(_props: CirclePickerProps): JSX.Element;
declare const _default: (props: CirclePickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

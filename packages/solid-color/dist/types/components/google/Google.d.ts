import { JSX } from 'solid-js';
export type GooglePickerProps = {
    width?: string | number;
    styles?: Record<string, JSX.CSSProperties>;
    header?: string;
    className?: string;
};
export declare function Google(_props: GooglePickerProps): JSX.Element;
declare const _default: (props: GooglePickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

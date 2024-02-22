import { JSX } from 'solid-js';
export type MaterialPickerProps = {
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
};
export declare function Material(_props: MaterialPickerProps): JSX.Element;
declare const _default: (props: MaterialPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

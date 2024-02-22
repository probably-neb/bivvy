import { JSX } from 'solid-js';
export type CompactPickerProps = {
    colors?: string[];
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
};
export declare function Compact(_props: CompactPickerProps): JSX.Element;
declare const _default: (props: CompactPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

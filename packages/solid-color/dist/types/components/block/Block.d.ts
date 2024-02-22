import { JSX } from 'solid-js';
export type BlockPickerProps = {
    width?: string | number;
    colors?: string[];
    triangle?: 'top' | 'hide';
    className?: string;
    styles?: Record<string, JSX.CSSProperties>;
};
export declare const Block: (_props: BlockPickerProps) => JSX.Element;
declare const _default: (props: BlockPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

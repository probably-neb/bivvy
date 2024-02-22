import { JSX } from 'solid-js';
export type TwitterPickerProps = {
    width?: string | number;
    triangle?: 'hide' | 'top-left' | 'top-right';
    colors?: string[];
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
};
export declare const Twitter: (_props: TwitterPickerProps) => JSX.Element;
declare const _default: (props: TwitterPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

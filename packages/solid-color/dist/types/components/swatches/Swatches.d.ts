import { JSX } from 'solid-js';
export type SwatchesPickerProps = {
    width?: string | number;
    height?: string | number;
    className?: string;
    styles?: Record<string, JSX.CSSProperties>;
    colors?: string[][];
};
export declare function Swatches(_props: SwatchesPickerProps): JSX.Element;
declare const _default: (props: SwatchesPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

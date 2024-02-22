import { JSX } from 'solid-js';
export type SketchPickerProps = {
    disableAlpha?: boolean;
    width?: string | number;
    className?: string;
    presetColors?: string[];
    styles?: Record<string, JSX.CSSProperties>;
    renderers?: any;
};
export declare function Sketch(_props: SketchPickerProps): JSX.Element;
declare const _default: (props: SketchPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

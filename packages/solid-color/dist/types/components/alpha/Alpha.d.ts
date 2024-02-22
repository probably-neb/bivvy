import { JSX } from 'solid-js';
export type AlphaPickerProps = {
    width?: string | number;
    height?: string | number;
    direction?: string;
    pointer?: <T extends object>(props: T) => JSX.Element;
    renderers?: any;
    className?: string;
    style?: Record<string, JSX.CSSProperties>;
};
export declare function AlphaPicker(_props: AlphaPickerProps): JSX.Element;
declare const _default: (props: AlphaPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

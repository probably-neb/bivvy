import { JSX } from 'solid-js';
export interface ChromePickerProps {
    width?: string | number;
    disableAlpha?: boolean;
    styles?: Record<string, JSX.CSSProperties>;
    renderers?: any;
    className?: string;
    defaultView?: 'hex' | 'rgb' | 'hsl';
}
export declare const Chrome: (_props: ChromePickerProps) => JSX.Element;
declare const _default: (props: ChromePickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

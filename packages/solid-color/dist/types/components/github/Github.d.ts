import { JSX } from 'solid-js';
export type GithubPickerProps = {
    width?: string | number;
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
    triangle?: 'hide' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    colors?: string[];
};
export declare function Github(_props: GithubPickerProps): JSX.Element;
declare const _default: (props: GithubPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

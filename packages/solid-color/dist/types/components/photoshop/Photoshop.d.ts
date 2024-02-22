import { JSX } from 'solid-js';
export type PhotoshopPickerProps = {
    header?: string;
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
    onAccept?: () => void;
    onCancel?: () => void;
};
declare const _default: (props: PhotoshopPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

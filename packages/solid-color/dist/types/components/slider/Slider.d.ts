import { JSX } from 'solid-js';
import SliderPointer from './SliderPointer';
export type SliderPickerProps = {
    pointer?: typeof SliderPointer;
    styles?: Record<string, JSX.CSSProperties>;
    className?: string;
};
declare const _default: (props: SliderPickerProps & Omit<import("../_common").ColorPickerProps, "children">) => JSX.Element;
export default _default;

import { JSX } from 'solid-js';
import { HslColor } from '../../types';
interface HueProps {
    children?: JSX.Element;
    direction?: string;
    radius?: number | string;
    shadow?: string;
    hsl: HslColor;
    styles?: Record<string, JSX.CSSProperties>;
    pointer?: <T extends object>(props: T) => JSX.Element;
    onChange?: (data: HslColor, e: MouseEvent) => void;
}
export declare function Hue(_props: HueProps): JSX.Element;
export {};

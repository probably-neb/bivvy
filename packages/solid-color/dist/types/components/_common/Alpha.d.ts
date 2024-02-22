import { JSX } from 'solid-js';
import { HslColor, RgbColor } from '../../types';
export interface AlphaProps {
    rgb: RgbColor;
    hsl: HslColor;
    renderers?: any;
    direction?: string;
    a?: number;
    radius?: number;
    shadow?: string;
    styles?: Record<string, JSX.CSSProperties>;
    pointer?: <T extends object>(props: T) => JSX.Element;
    onChange?: (data: any, e: Event) => void;
}
export declare const Alpha: (_props: AlphaProps) => JSX.Element;

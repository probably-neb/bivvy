import { JSX } from 'solid-js';
import { ChangeColor, HslColor, HsvColor } from '../../types';
export type SaturationProps = {
    hsl: HslColor;
    hsv: HsvColor;
    pointer?: JSX.Element;
    onChange?: (color: ChangeColor, event?: Event) => void;
    shadow?: JSX.CSSProperties['box-shadow'];
    radius?: JSX.CSSProperties['border-radius'];
    styles?: Record<string, JSX.CSSProperties>;
};
export declare function Saturation(_props: SaturationProps): JSX.Element;

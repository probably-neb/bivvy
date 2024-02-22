import { JSX } from 'solid-js';
import { ChangeColor, HexColor, HslColor, RgbColor } from '../../types';
export interface SliderPickerProps {
    onChange?: (color: ChangeColor, event: Event) => void;
    rgb: RgbColor;
    hsl: HslColor;
    hex: HexColor;
    disableAlpha?: boolean;
}
export declare const SketchFields: (_props: SliderPickerProps) => JSX.Element;
export default SketchFields;

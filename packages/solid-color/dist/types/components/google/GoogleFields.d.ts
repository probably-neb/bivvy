import { JSX } from 'solid-js';
import { ChangeColor, HexColor, HslColor, HsvColor, RgbColor } from '../../types';
interface Props {
    rgb: RgbColor;
    hsl: HslColor;
    hex: HexColor;
    hsv: HsvColor;
    onChange: (color: ChangeColor, event: Event) => void;
}
export default function GoogleFields(_props: Props): JSX.Element;
export {};

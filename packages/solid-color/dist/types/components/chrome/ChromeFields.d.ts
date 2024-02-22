import { JSX } from 'solid-js';
import { ChangeColor, HexColor, HslColor, RgbColor } from '../../types';
interface Props {
    view?: 'hex' | 'rgb' | 'hsl';
    onChange: (data: ChangeColor, event: Event) => void;
    rgb: RgbColor;
    hsl: HslColor;
    hex: HexColor;
    disableAlpha?: boolean;
}
export default function ChromeFields(_props: Props): JSX.Element;
export {};

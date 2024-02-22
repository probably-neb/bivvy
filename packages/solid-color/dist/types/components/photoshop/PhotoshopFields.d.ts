import { JSX } from 'solid-js';
import { HexColor, HsvColor, RgbColor } from '../../types';
interface Props {
    rgb: RgbColor;
    hsv: HsvColor;
    hex: HexColor;
    onChange: (data: any, event: Event) => void;
}
export default function PhotoshopPicker(_props: Props): JSX.Element;
export {};

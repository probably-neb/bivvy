import { JSX } from 'solid-js';
import { HexColor, RgbColor } from '../../types';
interface Props {
    hex: HexColor;
    rgb: RgbColor;
    onChange: any;
}
export default function CompactFields(_props: Props): JSX.Element;
export {};

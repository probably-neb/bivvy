import { JSX } from 'solid-js';
import { HslColor } from '../../types';
interface Props {
    hsl: HslColor;
    onClick: any;
    offset: number;
    active?: boolean;
    first?: boolean;
    last?: boolean;
}
export default function SliderSwatch(_props: Props): JSX.Element;
export {};

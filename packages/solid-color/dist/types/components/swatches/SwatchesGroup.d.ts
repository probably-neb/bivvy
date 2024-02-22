import { JSX } from 'solid-js';
import { Color, HexColor } from '../../types';
type Props = {
    onClick: (color: Color, event: Event) => void;
    active: HexColor;
    group: string[];
};
export default function SwatchesGroup(_props: Props): JSX.Element;
export {};

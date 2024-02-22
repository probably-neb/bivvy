import { JSX } from 'solid-js';
import { Color } from '../../types';
interface Props {
    color: string;
    onClick: (color: Color, event: Event) => void;
    first: boolean;
    last: boolean;
    active: boolean;
}
export default function SwatchesColor(_props: Props): JSX.Element;
export {};

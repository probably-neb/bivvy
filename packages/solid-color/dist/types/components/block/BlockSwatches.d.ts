import { HexColor } from '../../types';
import { JSX } from 'solid-js';
interface Props {
    colors: string[];
    onClick: (hexCode: HexColor, e: Event) => void;
}
export declare const BlockSwatches: ({ colors, onClick }: Props) => JSX.Element;
export default BlockSwatches;

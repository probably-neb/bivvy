import { JSX } from 'solid-js';
import { HexColor } from '../../types';
interface Props {
    circleSize?: number;
    circleSpacing?: number;
    className?: string;
    color: string;
    active?: boolean;
    onClick: (hexCode: HexColor, e: Event) => void;
}
export declare const CircleSwatch: (_props: Props) => JSX.Element;
export default CircleSwatch;

import { JSX } from 'solid-js';
import { ChangeColor } from '../../types';
interface Props {
    colors: (string | {
        color: string;
        title?: string;
    })[];
    onClick?: (newColor: ChangeColor, event: MouseEvent) => void;
}
export default function SketchPresetColors(_props: Props): JSX.Element;
export {};

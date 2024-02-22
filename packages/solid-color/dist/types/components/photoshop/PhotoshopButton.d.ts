import { JSX } from 'solid-js';
interface Props {
    onClick?: () => void;
    label?: string;
    children?: JSX.Element;
    active?: boolean;
}
export default function PhotoshopButton(_props: Props): JSX.Element;
export {};

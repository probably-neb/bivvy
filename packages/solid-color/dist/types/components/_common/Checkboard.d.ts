import { JSX } from 'solid-js';
export type CheckboardProps = {
    size?: number;
    white?: string;
    grey?: string;
    renderers?: any;
    borderRadius?: string | number;
    boxShadow?: string;
    children?: JSX.Element;
};
export declare function Checkboard(_props: CheckboardProps): JSX.Element;

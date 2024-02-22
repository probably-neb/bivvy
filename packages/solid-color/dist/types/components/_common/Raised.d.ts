import { JSX } from 'solid-js';
export interface RaisedProps {
    background?: string;
    zDepth?: 0 | 1 | 2 | 3 | 4 | 5;
    radius?: number;
    styles?: Record<string, JSX.CSSProperties>;
    children?: JSX.Element;
}
export declare function Raised(_props: RaisedProps): JSX.Element;

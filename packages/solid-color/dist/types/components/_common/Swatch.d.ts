import { JSX } from 'solid-js';
export type SwatchProps = {
    color: string;
    styles?: JSX.CSSProperties;
    onClick: any;
    title?: string;
    children?: JSX.Element;
    focused?: boolean;
    focusStyle?: JSX.CSSProperties;
};
export declare function Swatch(_props: SwatchProps): JSX.Element;
export default Swatch;

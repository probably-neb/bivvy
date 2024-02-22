import { JSX } from 'solid-js';
import { HexColor } from '../../types';
interface Props {
    hover?: boolean;
    color: string;
    onClick?: (newColor: HexColor, event: Event) => void;
}
export declare function GithubSwatch(_props: Props): JSX.Element;
export default GithubSwatch;

import { merge } from 'lodash-es';
import { For, mergeProps } from 'solid-js';
import { useColorPicker, withColorPicker } from '../_common';
import GithubSwatch from './GithubSwatch';
export function Github(_props) {
    const props = mergeProps({
        width: 200,
        colors: [
            '#B80000',
            '#DB3E00',
            '#FCCB00',
            '#008B02',
            '#006B76',
            '#1273DE',
            '#004DCF',
            '#5300EB',
            '#EB9694',
            '#FAD0C3',
            '#FEF3BD',
            '#C1E1C5',
            '#BEDADC',
            '#C4DEF6',
            '#BED3F3',
            '#D4C4FB',
        ],
        triangle: 'top-left',
        styles: {},
        className: '',
    }, _props);
    const { changeColor } = useColorPicker();
    const styles = () => {
        const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
        const { triangle } = props;
        return merge({
            card: {
                width,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.2)',
                'box-shadow': '0 3px 12px rgba(0,0,0,0.15)',
                'border-radius': '4px',
                position: 'relative',
                padding: '5px',
                display: 'flex',
                'flex-wrap': 'wrap',
            },
            triangle: {
                position: 'absolute',
                border: '7px solid transparent',
                'border-bottom-color': '#fff',
                display: triangle === 'hide' ? 'none' : undefined,
                top: triangle === 'top-left' || triangle === 'top-right' ? '-14px' : '37px',
                left: triangle === 'top-left' || triangle === 'bottom-left' ? '10px' : undefined,
                right: triangle === 'top-right' || triangle === 'bottom-right' ? '10px' : undefined,
                transform: triangle === 'bottom-left' || triangle === 'bottom-right'
                    ? 'rotate(180deg)'
                    : undefined,
            },
            triangleShadow: {
                position: 'absolute',
                border: '8px solid transparent',
                'border-bottom-color': 'rgba(0,0,0,0.15)',
                display: triangle === 'hide' ? 'none' : undefined,
                top: triangle === 'top-left' || triangle === 'top-right' ? '-16px' : '35px',
                left: triangle === 'top-left' || triangle === 'bottom-left' ? '9px' : undefined,
                right: triangle === 'top-right' || triangle === 'bottom-right' ? '9px' : undefined,
                transform: triangle === 'bottom-left' || triangle === 'bottom-right'
                    ? 'rotate(180deg)'
                    : undefined,
            },
        }, props.styles);
    };
    const handleChange = (hex, e) => changeColor({ hex, source: 'hex' }, e);
    return (<div style={styles().card} class={`github-picker ${props.className}`}>
      <div style={styles().triangleShadow}/>
      <div style={styles().triangle}/>
      <For each={props.colors}>{(c) => <GithubSwatch color={c} onClick={handleChange}/>}</For>
    </div>);
}
export default withColorPicker(Github);

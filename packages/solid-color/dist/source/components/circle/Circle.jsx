import { merge } from 'lodash-es';
import { For, mergeProps } from 'solid-js';
import { useColorPicker, withColorPicker } from '../_common';
import CircleSwatch from './CircleSwatch';
export function Circle(_props) {
    const props = mergeProps({
        width: 252,
        colors: [
            '#F44336',
            '#E91E63',
            '#9C27B0',
            '#673AB7',
            '#3F51B5',
            '#2196F3',
            '#03A9F4',
            '#00BCD4',
            '#009688',
            '#4CAF50',
            '#8BC34A',
            '#CDDC39',
            '#FFEB3B',
            '#FFC107',
            '#FF9800',
            '#FF5722',
            '#795548',
            '#607D8B',
        ],
        circleSize: 28,
        styles: {},
        circleSpacing: 14,
        className: '',
    }, _props);
    const { colors: currentColors, changeColor } = useColorPicker();
    const styles = () => {
        const { width, circleSpacing, styles } = props;
        return merge({
            card: {
                width: `${width}px`,
                display: 'flex',
                'flex-wrap': 'wrap',
                'margin-right': `${-circleSpacing}px`,
                'margin-bottom': `${-circleSpacing}px`,
            },
        }, styles);
    };
    const handleChange = (hexCode, e) => changeColor({ hex: hexCode, source: 'hex' }, e);
    return (<div style={styles().card} class={`circle-picker ${props.className}`}>
      <For each={props.colors}>
        {(c) => (<CircleSwatch color={c} onClick={handleChange} active={currentColors().hex === c.toLowerCase()} circleSize={props.circleSize} circleSpacing={props.circleSpacing}/>)}
      </For>
    </div>);
}
export default withColorPicker(Circle);

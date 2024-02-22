import { merge } from 'lodash-es';
import { mergeProps } from 'solid-js';
import { Hue, useColorPicker, withColorPicker } from '../_common';
import SliderPointer from './SliderPointer';
import SliderSwatches from './SliderSwatches';
const Slider = (_props) => {
    const props = mergeProps({
        pointer: SliderPointer,
        styles: {},
        className: '',
    }, _props);
    const { colors, changeColor } = useColorPicker();
    const styles = merge({
        hue: {
            height: '12px',
            position: 'relative',
        },
        Hue: {
            'border-radius': '2px',
        },
    }, props.styles);
    return (<div style={styles.wrap || {}} class={`slider-picker ${props.className}`}>
      <div style={styles.hue}>
        <Hue radius={2} hsl={colors().hsl} pointer={props.pointer} onChange={changeColor}/>
      </div>
      <div style={styles.swatches}>
        <SliderSwatches hsl={colors().hsl} onClick={changeColor}/>
      </div>
    </div>);
};
export default withColorPicker(Slider);

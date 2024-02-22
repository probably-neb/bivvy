import { createSignal, mergeProps } from 'solid-js';
import { Swatch } from '../_common';
export const CircleSwatch = (_props) => {
    const props = mergeProps({
        circleSize: 28,
        circleSpacing: 14,
    }, _props);
    const [hover, setHover] = createSignal(false);
    const styles = () => {
        const { circleSize, circleSpacing, color, active } = props;
        return {
            swatch: {
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                'margin-right': `${circleSpacing}px`,
                'margin-bottom': `${circleSpacing}px`,
                transform: 'scale(1)',
                transition: '100ms transform ease',
            },
            Swatch: {
                'border-radius': '50%',
                background: 'transparent',
                'box-shadow': active
                    ? `inset 0 0 0 3px ${color}`
                    : `inset 0 0 0 ${circleSize / 2 + 1}px ${color}`,
                transition: '100ms box-shadow ease',
                transform: hover() ? 'scale(1.2)' : undefined,
            },
        };
    };
    return (<div onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}>
      <div style={styles().swatch}>
        <Swatch styles={styles().Swatch} color={props.color} onClick={props.onClick} focusStyle={{
            'box-shadow': `${styles().Swatch.boxShadow}, 0 0 5px ${props.color}`,
        }}/>
      </div>
    </div>);
};
export default CircleSwatch;

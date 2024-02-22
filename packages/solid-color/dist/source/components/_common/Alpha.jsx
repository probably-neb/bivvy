import { merge } from 'lodash-es';
import { mergeProps, onCleanup } from 'solid-js';
import * as alpha from '../../helpers/alpha';
import { Checkboard } from './Checkboard';
export const Alpha = (_props) => {
    const props = mergeProps({
        direction: 'horizontal',
        styles: {},
    }, _props);
    let container;
    const styles = () => {
        const { rgb } = props;
        return merge({
            alpha: {
                position: 'absolute',
                inset: '0px',
                'border-radius': props.radius,
            },
            checkboard: {
                position: 'absolute',
                inset: '0px',
                overflow: 'hidden',
                'border-radius': props.radius,
            },
            gradient: {
                position: 'absolute',
                inset: '0px',
                background: props.direction === 'vertical'
                    ? `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
          rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
                    : `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
         rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`,
                'box-shadow': props.shadow,
                'border-radius': props.radius,
            },
            container: {
                position: 'relative',
                height: '100%',
                margin: '0 3px',
            },
            pointer: {
                position: 'absolute',
                left: props.direction === 'vertical' ? 0 : `${rgb.a && rgb.a * 100}%`,
                top: props.direction === 'vertical' ? `${rgb.a && rgb.a * 100}%` : undefined,
            },
            slider: {
                width: '4px',
                'border-radius': '1px',
                height: '8px',
                'box-shadow': '0 0 2px rgba(0, 0, 0, .6)',
                background: '#fff',
                'margin-top': '1px',
                transform: 'translateX(-2px)',
            },
        }, props.styles);
    };
    const handleChange = (e) => {
        const change = alpha.calculateChange(e, props.hsl, props.direction, props.a, container);
        change && typeof props.onChange === 'function' && props.onChange(change, e);
    };
    const handleMouseDown = (e) => {
        handleChange(e);
        window.addEventListener('mousemove', handleChange);
        window.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseUp = () => {
        unbindEventListeners();
    };
    const unbindEventListeners = () => {
        window.removeEventListener('mousemove', handleChange);
        window.removeEventListener('mouseup', handleMouseUp);
    };
    onCleanup(() => unbindEventListeners());
    return (<div style={styles().alpha}>
      <div style={styles().checkboard}>
        <Checkboard renderers={props.renderers}/>
      </div>
      <div style={styles().gradient}/>
      <div style={styles().container} ref={container} onMouseDown={handleMouseDown} onMouseUp={handleChange} onTouchMove={handleChange} onTouchStart={handleChange}>
        <div style={styles().pointer}>
          {props.pointer ? <props.pointer {...props}/> : <div style={styles().slider}/>}
        </div>
      </div>
    </div>);
};

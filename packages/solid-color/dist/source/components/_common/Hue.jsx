import { mergeProps, onCleanup } from 'solid-js';
import { calculateChange } from '../../helpers/hue';
export function Hue(_props) {
    const props = mergeProps({
        direction: 'horizontal',
    }, _props);
    let container;
    const styles = () => {
        return {
            hue: {
                position: 'absolute',
                inset: '0px',
                'border-radius': typeof props.radius === 'string' ? props.radius : `${props.radius}px`,
                'box-shadow': props.shadow,
            },
            container: {
                padding: '0 2px',
                position: 'relative',
                height: '100%',
                'border-radius': typeof props.radius === 'string' ? props.radius : `${props.radius}px`,
            },
            pointer: {
                position: 'absolute',
                left: props.direction === 'vertical' ? '0px' : `${(props.hsl.h * 100) / 360}%`,
                top: props.direction === 'vertical' ? `${-((props.hsl.h * 100) / 360) + 100}%` : undefined,
            },
            slider: {
                'margin-top': '1px',
                width: '4px',
                'border-radius': '1px',
                height: '8px',
                'box-shadow': '0 0 2px rgba(0, 0, 0, .6)',
                background: '#fff',
                transform: 'translateX(-2px)',
            },
        };
    };
    const handleChange = (e) => {
        const change = calculateChange(e, props.direction, props.hsl, container);
        change && typeof props.onChange === 'function' && props.onChange(change, e);
    };
    const unbindEventListeners = () => {
        window.removeEventListener('mousemove', handleChange);
        window.removeEventListener('mouseup', handleMouseUp);
    };
    const handleMouseUp = () => {
        unbindEventListeners();
    };
    const handleMouseDown = (e) => {
        handleChange(e);
        window.addEventListener('mousemove', handleChange);
        window.addEventListener('mouseup', handleMouseUp);
    };
    onCleanup(() => unbindEventListeners());
    return (<div style={styles().hue}>
      <div ref={container} class={`hue-${props.direction}`} style={styles().container} onMouseDown={handleMouseDown}>
        <style>{`
          .hue-horizontal {
            background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
              33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to right, #f00 0%, #ff0
              17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
          .hue-vertical {
            background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%,
              #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%,
              #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
        `}</style>
        <div style={styles().pointer}>
          {props.pointer ? <props.pointer {...props}/> : <div style={styles().slider}/>}
        </div>
      </div>
    </div>);
}

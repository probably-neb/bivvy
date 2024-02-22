import { mergeProps } from 'solid-js';
export default function PhotoshopPointerCircle(_props) {
    const props = mergeProps({}, _props);
    return (<div style={{
            width: '12px',
            height: '12px',
            borderRadius: '6px',
            boxShadow: props.hsl.l > 0.5 ? 'inset 0 0 0 1px #000' : 'inset 0 0 0 1px #fff',
            transform: 'translate(-6px, -6px)',
        }}/>);
}

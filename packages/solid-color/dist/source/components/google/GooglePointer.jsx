import { mergeProps } from 'solid-js';
export default function GooglePointer(_props) {
    const props = mergeProps({ hsl: { a: 1, h: 249.94, l: 0.2, s: 0.5 } }, _props);
    return (<div style={{
            width: '20px',
            height: '20px',
            'border-radius': '22px',
            transform: 'translate(-10px, -7px)',
            background: `hsl(${Math.round(props.hsl.h)}, 100%, 50%)`,
            border: '2px white solid',
        }}/>);
}

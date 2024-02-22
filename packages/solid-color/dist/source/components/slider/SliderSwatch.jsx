import { mergeProps } from 'solid-js';
export default function SliderSwatch(_props) {
    const props = mergeProps({
        onClick: () => { },
    }, _props);
    const styles = () => {
        const { hsl, offset, active, first, last } = props;
        return {
            swatch: {
                height: '12px',
                background: `hsl(${hsl.h}, 50%, ${offset * 100}%)`,
                cursor: 'pointer',
                'border-radius': active
                    ? '3.6px/2px'
                    : first
                        ? '2px 0 0 2px'
                        : last
                            ? '0 2px 2px 0'
                            : undefined,
                transform: active ? 'scaleY(1.8)' : undefined,
            },
        };
    };
    const handleClick = (e) => {
        props.onClick({
            h: props.hsl.h,
            s: 0.5,
            l: props.offset,
            source: 'hsl',
        }, e);
    };
    return <div style={styles().swatch} onClick={handleClick}/>;
}

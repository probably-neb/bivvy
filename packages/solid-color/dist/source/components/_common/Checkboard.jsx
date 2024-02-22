import * as checkboard from '../../helpers/checkboard';
import { mergeProps } from 'solid-js';
export function Checkboard(_props) {
    const props = mergeProps({
        white: 'transparent',
        grey: 'rgba(0,0,0,.08)',
        size: 8,
        renderers: {},
    }, _props);
    const styles = () => {
        const { size, white, grey, borderRadius, boxShadow, renderers } = props;
        return {
            grid: {
                'border-radius': borderRadius,
                'box-shadow': boxShadow,
                position: 'absolute',
                inset: '0px',
                background: `url(${checkboard.get(white, grey, size, renderers.canvas)}) center left`,
            },
        };
    };
    // return isValidElement(children) ? (
    //   React.cloneElement(children, {
    //     ...children.props,
    //     style: { ...children.props.style, ...styles.grid },
    //   })
    // ) : (
    //   <div style={styles.grid} />
    // )
    // 判断children是否是一个有效的元素
    return props.children ? (
    // clone
    <div style={styles().grid}>{props.children}</div>) : (<div style={styles().grid}/>);
}

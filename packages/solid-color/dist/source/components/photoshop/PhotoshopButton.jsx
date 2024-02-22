import { mergeProps } from 'solid-js';
export default function PhotoshopButton(_props) {
    const props = mergeProps({}, _props);
    const styles = () => {
        return {
            button: {
                'background-image': 'linear-gradient(-180deg, #FFFFFF 0%, #E6E6E6 100%)',
                border: '1px solid #878787',
                'border-radius': '2px',
                height: '20px',
                'box-shadow': props.active ? '0 0 0 1px #878787' : '0 1px 0 0 #EAEAEA',
                'font-size': '14px',
                color: '#000',
                'line-height': '20px',
                'text-align': 'center',
                'margin-bottom': '10px',
                cursor: 'pointer',
            },
        };
    };
    return (<div style={styles().button} onClick={props.onClick}>
      {props.label || props.children}
    </div>);
}

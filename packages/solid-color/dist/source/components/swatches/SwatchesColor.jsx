import { mergeProps } from 'solid-js';
import { getContrastingColor } from '../../helpers/color';
import { Swatch } from '../_common';
import { CheckIcon } from '../_common';
export default function SwatchesColor(_props) {
    const props = mergeProps({ onClick: () => { } }, _props);
    const styles = () => {
        const { color, active, first, last } = props;
        return {
            color: {
                width: '40px',
                height: '24px',
                cursor: 'pointer',
                background: color,
                'margin-bottom': '1px',
                overflow: first || last ? 'hidden' : undefined,
                'border-radius': first ? '2px 2px 0 0' : last ? '0 0 2px 2px' : undefined,
                'box-shadow': color === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : undefined,
            },
            check: {
                color: color === '#FFFFFF' || color === 'transparent' ? '#333' : getContrastingColor(color),
                'margin-left': '8px',
                display: active ? 'block' : 'none',
                margin: '0 auto',
            },
        };
    };
    return (<Swatch color={props.color} styles={styles().color} onClick={props.onClick} focusStyle={{ 'box-shadow': `0 0 4px ${props.color}` }}>
      <div style={styles().check}>
        <CheckIcon width="24" height="24" fill="white" stroke="white"/>
      </div>
    </Swatch>);
}

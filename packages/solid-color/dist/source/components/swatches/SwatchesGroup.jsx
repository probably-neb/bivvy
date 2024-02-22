import { For, mergeProps } from 'solid-js';
import SwatchesColor from './SwatchesColor';
export default function SwatchesGroup(_props) {
    const props = mergeProps({}, _props);
    const styles = {
        group: {
            'padding-bottom': '10px',
            width: '40px',
            float: 'left',
            'margin-right': '10px',
        },
    };
    return (<div style={styles.group}>
      <For each={props.group}>
        {(color, i) => (<SwatchesColor color={color} active={color.toLowerCase() === props.active} first={i() === 0} last={i() === props.group.length - 1} onClick={props.onClick}/>)}
      </For>
    </div>);
}

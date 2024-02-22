import { Swatch } from '../_common';
import { For } from 'solid-js';
export const BlockSwatches = ({ colors, onClick }) => {
    const styles = {
        swatches: {
            'margin-right': '-10px',
        },
        swatch: {
            width: '22px',
            height: '22px',
            float: 'left',
            'margin-right': '10px',
            'margin-bottom': '10px',
            'border-radius': '4px',
        },
        clear: {
            clear: 'both',
        },
    };
    return (<div style={styles.swatches}>
      <For each={colors}>
        {(c) => (<Swatch color={c} styles={styles.swatch} onClick={onClick} focusStyle={{
                'box-shadow': `0 0 4px ${c}`,
            }}/>)}
      </For>
      <div style={styles.clear}/>
    </div>);
};
export default BlockSwatches;

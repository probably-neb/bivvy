import { For, mergeProps } from 'solid-js';
import { Swatch } from '../_common';
export default function SketchPresetColors(_props) {
    const props = mergeProps({ onClick: () => { } }, _props);
    const styles = () => {
        return {
            colors: {
                margin: '0 -10px',
                padding: '10px 0 0 10px',
                'border-top': '1px solid #eee',
                display: !props.colors || !props.colors.length ? 'none' : 'flex',
                'flex-wrap': 'wrap',
                position: 'relative',
            },
            swatchWrap: {
                width: '16px',
                height: '16px',
                margin: '0 10px 10px 0',
            },
            swatch: {
                'border-radius': '3px',
                'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15)',
            },
        };
    };
    const handleClick = (hex, e) => {
        props.onClick({
            hex,
            source: 'hex',
        }, e);
    };
    return (<div style={styles().colors} class="flexbox-fix">
      <For each={props.colors}>
        {(colorObjOrString) => {
            const c = typeof colorObjOrString === 'string' ? { color: colorObjOrString } : colorObjOrString;
            return (<div style={styles().swatchWrap}>
              <Swatch {...c} styles={styles().swatch} onClick={handleClick} focusStyle={{
                    'box-shadow': `inset 0 0 0 1px rgba(0,0,0,.15), 0 0 4px ${c.color}`,
                }}/>
            </div>);
        }}
      </For>
    </div>);
}

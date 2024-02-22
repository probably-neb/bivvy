import { merge } from 'lodash-es';
import { createEffect, createSignal, mergeProps, onCleanup, Show } from 'solid-js';
export function EditableInput(_props) {
    const props = mergeProps({
        arrowOffset: 1,
        hideLabel: false,
    }, _props);
    let inputRef;
    const inputId = `sc-editable-input-${Math.random().toString().slice(2, 5)}`;
    const [state, setState] = createSignal({
        value: String(props.value).toUpperCase(),
        blurValue: String(props.value).toUpperCase(),
    });
    const DEFAULT_ARROW_OFFSET = 1;
    const UP_KEY_CODE = 38;
    const DOWN_KEY_CODE = 40;
    const VALID_KEY_CODES = [UP_KEY_CODE, DOWN_KEY_CODE];
    const isValidKeyCode = (keyCode) => VALID_KEY_CODES.indexOf(keyCode) > -1;
    const getNumberValue = (value) => Number(String(value).replace(/%/g, ''));
    const getValueObjectWithLabel = (value) => {
        return {
            [props.label]: value,
        };
    };
    const setUpdatedValue = (value, e) => {
        const onChangeValue = props.label ? getValueObjectWithLabel(value) : value;
        props.onChange && props.onChange(onChangeValue, e);
        setState({ value, blurValue: value });
    };
    const handleBlur = () => {
        if (state().blurValue) {
            setState({ value: state().blurValue, blurValue: '' });
        }
    };
    const handleChange = (e) => {
        setUpdatedValue(e.target.value, e);
    };
    const handleDrag = (e) => {
        if (props.dragLabel) {
            const newValue = Math.round(+props.value + e.movementX);
            if (newValue >= 0 && newValue <= props.dragMax) {
                props.onChange && props.onChange(getValueObjectWithLabel(String(newValue)), e);
            }
        }
    };
    const unbindEventListeners = () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleMouseUp);
    };
    const handleMouseUp = () => {
        unbindEventListeners();
    };
    const handleMouseDown = (e) => {
        if (props.dragLabel) {
            e.preventDefault();
            handleDrag(e);
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', handleMouseUp);
        }
    };
    const handleKeyDown = (e) => {
        const value = getNumberValue(e.target.value);
        if (!isNaN(value) && isValidKeyCode(e.keyCode)) {
            const offset = props.arrowOffset || DEFAULT_ARROW_OFFSET;
            const updatedValue = e.keyCode === UP_KEY_CODE ? value + offset : value - offset;
            setUpdatedValue(updatedValue, e);
        }
    };
    createEffect(() => {
        setState({
            value: String(props.value).toUpperCase(),
            blurValue: '',
        });
    });
    const styles = () => {
        return merge({
            wrap: {
                position: 'relative',
            },
        }, props.styles);
    };
    onCleanup(() => unbindEventListeners());
    return (<div style={styles().wrap}>
      <input id={inputId} ref={inputRef} style={styles().input} spellcheck={false} value={state().value} placeholder={props.placeholder} onBlur={handleBlur} onChange={handleChange} onKeyDown={handleKeyDown} onInput={handleChange}/>
      <Show when={props.label && !props.hideLabel}>
        <label style={styles().label} onMouseDown={handleMouseDown}>
          {props.label}
        </label>
      </Show>
    </div>);
}

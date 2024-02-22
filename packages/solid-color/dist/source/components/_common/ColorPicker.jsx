import { createContext, createEffect, createMemo, createSignal, mergeProps, useContext, } from 'solid-js';
import * as color from '../../helpers/color';
import { debounce } from 'lodash-es';
export const ColorPickerContext = createContext(undefined);
export function ColorPickerProvider(_props) {
    const props = mergeProps({ defaultColor: { h: 250, s: 0.5, l: 0.2, a: 1 } }, _props);
    const [colors, setColors] = createSignal({
        ...color.toState(props.color ?? props.defaultColor, 0),
    });
    createEffect(() => {
        if (props.color) {
            setColors({ ...color.toState(props.color, 0) });
        }
    });
    const handler = (fn, data, event) => fn(data, event);
    const debouncedChangeHandler = createMemo(() => debounce(handler, 100), []);
    const changeColor = (newColor, event) => {
        const isValidColor = color.simpleCheckForValidColor(newColor);
        if (isValidColor) {
            const newColors = color.toState(newColor, (typeof newColor !== 'string' && 'h' in newColor ? newColor.h : undefined) ||
                colors().oldHue);
            setColors(newColors);
            props.onChangeComplete && debouncedChangeHandler()(props.onChangeComplete, newColors, event);
            props.onChange && props.onChange(newColors, event);
        }
    };
    const handleSwatchHover = (data, event) => {
        const isValidColor = color.simpleCheckForValidColor(data);
        if (isValidColor) {
            const newColors = color.toState(data, (typeof data !== 'string' && 'h' in data ? data.h : undefined) || colors().oldHue);
            props.onSwatchHover && props.onSwatchHover(newColors, event);
        }
    };
    const store = {
        colors,
        changeColor,
        onSwatchHover: props.onSwatchHover ? handleSwatchHover : undefined,
    };
    return <ColorPickerContext.Provider value={store}>{props.children}</ColorPickerContext.Provider>;
}
export function useColorPicker() {
    return useContext(ColorPickerContext);
}
export function withColorPicker(Component) {
    return (props) => (<ColorPickerProvider {...props}>
      <Component {...props}/>
    </ColorPickerProvider>);
}

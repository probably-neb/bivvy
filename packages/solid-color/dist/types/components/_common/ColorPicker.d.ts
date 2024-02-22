import { Accessor, Context, JSX } from 'solid-js';
import { ChangeColor, Color, ColorResult } from '../../types';
export interface ColorPickerContextType {
    colors: Accessor<ColorResult>;
    changeColor: (color: ChangeColor, event?: Event) => void;
    onSwatchHover?: (color: ChangeColor, event: Event) => void;
}
export declare const ColorPickerContext: Context<ColorPickerContextType>;
export interface ColorPickerProps {
    children?: JSX.Element;
    defaultColor?: Color;
    color?: Color;
    onChange?: (color: ColorResult, event?: Event) => void;
    onChangeComplete?: (color: ColorResult) => void;
    onSwatchHover?: (color: ColorResult, event: Event) => void;
}
export declare function ColorPickerProvider(_props: ColorPickerProps): JSX.Element;
export declare function useColorPicker(): ColorPickerContextType;
export declare function withColorPicker<T extends object>(Component: (props: T) => JSX.Element): (props: T & Omit<ColorPickerProps, 'children'>) => JSX.Element;

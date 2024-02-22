import { JSX } from 'solid-js';
export interface EditableInputProps {
    styles: Record<string, JSX.CSSProperties>;
    value?: string | number;
    label?: string;
    hideLabel?: boolean;
    placeholder?: string;
    arrowOffset?: number;
    dragLabel?: boolean;
    dragMax?: number;
    onChange?: (value: any, e: Event) => void;
}
export declare function EditableInput(_props: EditableInputProps): JSX.Element;

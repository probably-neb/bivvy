import { callHandler, EventKey, mergeDefaultProps } from "@kobalte/utils";
import { splitProps } from "solid-js";
import { useFormControlContext } from "../form-control";
import { Polymorphic } from "../polymorphic";
import { useCheckboxContext } from "./checkbox-context";
/**
 * The element that visually represents a checkbox.
 */
export function CheckboxControl(props) {
    const formControlContext = useFormControlContext();
    const context = useCheckboxContext();
    props = mergeDefaultProps({
        id: context.generateId("control"),
    }, props);
    const [local, others] = splitProps(props, ["onClick", "onKeyDown"]);
    const onClick = e => {
        callHandler(e, local.onClick);
        context.toggle();
        context.inputRef()?.focus();
    };
    const onKeyDown = e => {
        callHandler(e, local.onKeyDown);
        if (e.key === EventKey.Space) {
            context.toggle();
            context.inputRef()?.focus();
        }
    };
    return (<Polymorphic as="div" onClick={onClick} onKeyDown={onKeyDown} {...formControlContext.dataset()} {...context.dataset()} {...others}/>);
}
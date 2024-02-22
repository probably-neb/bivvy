/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/listbox/src/useOption.ts
 */
import { mergeDefaultProps } from "@kobalte/utils";
import { createEffect, onCleanup, splitProps } from "solid-js";
import { Polymorphic } from "../polymorphic";
import { useListboxItemContext } from "./listbox-item-context";
/**
 * An accessible label to be announced for the item.
 * Useful for items that have more complex content (e.g. icons, multiple lines of text, etc.)
 */
export function ListboxItemLabel(props) {
    const context = useListboxItemContext();
    props = mergeDefaultProps({
        id: context.generateId("label"),
    }, props);
    const [local, others] = splitProps(props, ["id"]);
    createEffect(() => onCleanup(context.registerLabelId(local.id)));
    return <Polymorphic as="div" id={local.id} {...context.dataset()} {...others}/>;
}

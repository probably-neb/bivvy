/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-stately/list/src/useSingleSelectListState.ts
 */
import { access } from "@kobalte/utils";
import { createMemo, mergeProps, splitProps } from "solid-js";
import { createControllableSignal } from "../primitives";
import { createListState } from "./create-list-state";
/**
 * Provides state management for list-like components with single selection.
 * Handles building a collection of items from props, and manages selection state.
 */
export function createSingleSelectListState(props) {
    const [selectedKey, setSelectedKey] = createControllableSignal({
        value: () => access(props.selectedKey),
        defaultValue: () => access(props.defaultSelectedKey),
        onChange: value => props.onSelectionChange?.(value),
    });
    const selectedKeys = createMemo(() => {
        const selection = selectedKey();
        return selection != null ? [selection] : [];
    });
    const [, defaultCreateListStateProps] = splitProps(props, ["onSelectionChange"]);
    const createListStateProps = mergeProps(defaultCreateListStateProps, {
        selectionMode: "single",
        disallowEmptySelection: true,
        allowDuplicateSelectionEvents: true,
        selectedKeys,
        onSelectionChange: (keys) => {
            const key = keys.values().next().value;
            // Always fire onSelectionChange, even if the key is the same
            // as the current key (createControllableSignal does not).
            if (key === selectedKey()) {
                props.onSelectionChange?.(key);
            }
            setSelectedKey(key);
        },
    });
    const { collection, selectionManager } = createListState(createListStateProps);
    const selectedItem = createMemo(() => {
        const selection = selectedKey();
        return selection != null ? collection().getItem(selection) : undefined;
    });
    return {
        collection,
        selectionManager,
        selectedKey,
        setSelectedKey,
        selectedItem,
    };
}

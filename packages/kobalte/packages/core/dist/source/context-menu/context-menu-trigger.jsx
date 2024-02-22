/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/context-menu/src/ContextMenu.tsx
 */
import { callHandler, mergeDefaultProps, mergeRefs } from "@kobalte/utils";
import { onCleanup, splitProps } from "solid-js";
import { isServer } from "solid-js/web";
import { useMenuContext } from "../menu/menu-context";
import { useMenuRootContext } from "../menu/menu-root-context";
import { Polymorphic } from "../polymorphic";
import { useContextMenuContext } from "./context-menu-context";
export function ContextMenuTrigger(props) {
    const rootContext = useMenuRootContext();
    const menuContext = useMenuContext();
    const context = useContextMenuContext();
    props = mergeDefaultProps({
        id: rootContext.generateId("trigger"),
    }, props);
    const [local, others] = splitProps(props, [
        "ref",
        "style",
        "disabled",
        "onContextMenu",
        "onPointerDown",
        "onPointerMove",
        "onPointerCancel",
        "onPointerUp",
    ]);
    let longPressTimoutId = 0;
    const clearLongPressTimeout = () => {
        if (isServer) {
            return;
        }
        window.clearTimeout(longPressTimoutId);
    };
    onCleanup(() => {
        clearLongPressTimeout();
    });
    const onContextMenu = e => {
        // If trigger is disabled, enable the native Context Menu.
        if (local.disabled) {
            callHandler(e, local.onContextMenu);
            return;
        }
        // Clearing the long press here because some platforms already support
        // long press to trigger a `contextmenu` event.
        clearLongPressTimeout();
        e.preventDefault();
        context.setAnchorRect({ x: e.clientX, y: e.clientY });
        if (menuContext.isOpen()) {
            // If the menu is already open, focus the menu itself.
            menuContext.focusContent();
        }
        else {
            menuContext.open(true);
        }
    };
    const isTouchOrPen = (e) => e.pointerType === "touch" || e.pointerType === "pen";
    const onPointerDown = e => {
        callHandler(e, local.onPointerDown);
        if (!local.disabled && isTouchOrPen(e)) {
            // Clear the long press here in case there's multiple touch points.
            clearLongPressTimeout();
            longPressTimoutId = window.setTimeout(() => menuContext.open(false), 700);
        }
    };
    const onPointerMove = e => {
        callHandler(e, local.onPointerMove);
        if (!local.disabled && isTouchOrPen(e)) {
            clearLongPressTimeout();
        }
    };
    const onPointerCancel = e => {
        callHandler(e, local.onPointerCancel);
        if (!local.disabled && isTouchOrPen(e)) {
            clearLongPressTimeout();
        }
    };
    const onPointerUp = e => {
        callHandler(e, local.onPointerUp);
        if (!local.disabled && isTouchOrPen(e)) {
            clearLongPressTimeout();
        }
    };
    return (<Polymorphic as="div" ref={mergeRefs(menuContext.setTriggerRef, local.ref)} style={{
            // prevent iOS context menu from appearing
            "-webkit-touch-callout": "none",
            ...local.style,
        }} data-disabled={local.disabled ? "" : undefined} onContextMenu={onContextMenu} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerCancel={onPointerCancel} onPointerUp={onPointerUp} {...menuContext.dataset()} {...others}/>);
}

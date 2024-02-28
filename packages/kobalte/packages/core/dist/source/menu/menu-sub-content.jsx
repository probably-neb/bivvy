/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/menu/src/Menu.tsx
 */
import { callHandler, contains, focusWithoutScrolling, } from "@kobalte/utils";
import { splitProps } from "solid-js";
import { useLocale } from "../i18n";
import { MenuContentBase } from "./menu-content-base";
import { useMenuContext } from "./menu-context";
const SUB_CLOSE_KEYS = {
    ltr: ["ArrowLeft"],
    rtl: ["ArrowRight"],
};
/**
 * The component that pops out when a submenu is open.
 */
export function MenuSubContent(props) {
    const context = useMenuContext();
    const [local, others] = splitProps(props, ["onFocusOutside", "onKeyDown", "onFocusOut"]);
    const { direction } = useLocale();
    const onOpenAutoFocus = (e) => {
        // when opening a submenu, focus content for keyboard users only (handled by `MenuSubTrigger`).
        e.preventDefault();
    };
    const onCloseAutoFocus = (e) => {
        // The menu might close because of focusing another menu item in the parent menu.
        // We don't want it to refocus the trigger in that case, so we handle trigger focus ourselves.
        e.preventDefault();
    };
    const onFocusOutside = (e) => {
        local.onFocusOutside?.(e);
        const target = e.target;
        // We prevent closing when the trigger is focused to avoid triggering a re-open animation
        // on pointer interaction.
        if (!contains(context.triggerRef(), target)) {
            context.close();
        }
    };
    const onKeyDown = e => {
        callHandler(e, local.onKeyDown);
        // Submenu key events bubble through portals. We only care about keys in this menu.
        const isKeyDownInside = contains(e.currentTarget, e.target);
        const isCloseKey = SUB_CLOSE_KEYS[direction()].includes(e.key);
        const isSubMenu = context.parentMenuContext() != null;
        if (isKeyDownInside && isCloseKey && isSubMenu) {
            context.close();
            // We focus manually because we prevented it in `onCloseAutoFocus`.
            focusWithoutScrolling(context.triggerRef());
        }
    };
    return (<MenuContentBase onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus} onFocusOutside={onFocusOutside} onKeyDown={onKeyDown} {...others}/>);
}
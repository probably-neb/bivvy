import { isString, isNumber, access, accessWith, getDocument, EventKey, getActiveElement, contains, focusWithoutScrolling, removeItemFromArray, visuallyHiddenStyles, isFocusable, getAllTabbableIn, noop, composeEventHandlers, isCtrlKey, getWindow, chain, isIOS, createMediaQuery, mergeDefaultProps, createGenerateId, isArray, combineProps as combineProps$1, mergeRefs, isAppleDevice, isMac, createEventListener, scrollIntoView, callHandler, getFocusableTreeWalker, isFunction, addItemToArray, isWebKit, Key, isPointInPolygon, createFocusManager, scrollIntoViewport, getScrollParent, createGlobalListeners, getEventPoint, clamp, snapValueToStep } from '@kobalte/utils';
import { createStore } from 'solid-js/store';
import { isServer, createComponent, effect, setAttribute, template, Dynamic, mergeProps as mergeProps$1, memo, Portal, use, spread, insert, style, delegateEvents } from 'solid-js/web';
import { createContext, useContext, createMemo, createSignal, createEffect, onCleanup, mergeProps, on, untrack, createUniqueId, splitProps, children, For, Show, onMount, createComputed, createComponent as createComponent$1, Index, Switch, Match, batch } from 'solid-js';
import { MessageFormatter, MessageDictionary } from '@internationalized/message';
import { DateFormatter, maxDate, toCalendarDate, minDate, isSameDay, startOfMonth, endOfMonth, startOfYear, startOfWeek, endOfWeek, today, getWeeksInMonth, isToday, isWeekend, isSameMonth, toCalendar, getDayOfWeek, GregorianCalendar, now, toCalendarDateTime, Time, getMinimumDayInMonth, getMinimumMonthInYear, CalendarDate } from '@internationalized/date';
import { autoUpdate, offset, flip, shift, size, hide, arrow, computePosition, platform } from '@floating-ui/dom';
import { NumberFormatter, NumberParser } from '@internationalized/number';

/*!
 * Original code by Chakra UI
 * MIT Licensed, Copyright (c) 2019 Segun Adebayo.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/color-mode/src/color-mode-context.ts
 */

const ColorModeContext = createContext();

/**
 * Primitive that reads from `ColorModeProvider` context,
 * Returns the color mode and function to toggle it.
 */
function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useColorMode` must be used within a `ColorModeProvider`");
  }
  return context;
}

/**
 * Change value based on color mode.
 *
 * @param light the light mode value
 * @param dark the dark mode value
 * @return A memoized value based on the color mode.
 *
 * @example
 *
 * ```js
 * const Icon = useColorModeValue(MoonIcon, SunIcon)
 * ```
 */
function useColorModeValue(light, dark) {
  const {
    colorMode
  } = useColorMode();
  return createMemo(() => colorMode() === "dark" ? dark : light);
}

/*!
 * Original code by Chakra UI
 * MIT Licensed, Copyright (c) 2019 Segun Adebayo.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/color-mode/src/storage-manager.ts
 */

const COLOR_MODE_STORAGE_KEY = "kb-color-mode";
function createLocalStorageManager(key) {
  return {
    ssr: false,
    type: "localStorage",
    get: fallback => {
      if (isServer) {
        return fallback;
      }
      let value;
      try {
        value = localStorage.getItem(key);
      } catch (e) {
        // noop
      }
      return value ?? fallback;
    },
    set: value => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // noop
      }
    }
  };
}
const localStorageManager = createLocalStorageManager(COLOR_MODE_STORAGE_KEY);
function parseCookie(cookie, key) {
  const match = cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
  return match?.[2];
}
function createCookieStorageManager(key, cookie) {
  return {
    ssr: !!cookie,
    type: "cookie",
    get: fallback => {
      if (cookie) {
        return parseCookie(cookie, key) ?? fallback;
      }
      if (isServer) {
        return fallback;
      }
      return parseCookie(document.cookie, key) ?? fallback;
    },
    set: value => {
      document.cookie = `${key}=${value}; max-age=31536000; path=/`;
    }
  };
}
const cookieStorageManager = createCookieStorageManager(COLOR_MODE_STORAGE_KEY);
function cookieStorageManagerSSR(cookie) {
  return createCookieStorageManager(COLOR_MODE_STORAGE_KEY, cookie);
}

/*!
 * Original code by Chakra UI
 * MIT Licensed, Copyright (c) 2019 Segun Adebayo.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/color-mode/src/color-mode.utils.ts
 */

const FALLBACK_COLOR_MODE_VALUE = "system";
function query() {
  return window.matchMedia("(prefers-color-scheme: dark)");
}
function preventTransition() {
  const css = document.createElement("style");
  css.appendChild(document.createTextNode(`*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`));
  document.head.appendChild(css);
  return () => {
    // force a reflow
    (() => window.getComputedStyle(document.body))();

    // wait for next tick
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.head.removeChild(css);
      });
    });
  };
}
function setColorModeDataset(value, shouldPreventTransition = true) {
  const cleanup = shouldPreventTransition ? preventTransition() : undefined;
  document.documentElement.dataset.kbTheme = value;
  document.documentElement.style.colorScheme = value;
  cleanup?.();
}
function getSystemColorMode(fallback) {
  const isDark = query().matches ?? fallback === "dark";
  return isDark ? "dark" : "light";
}
function getInitialColorMode(manager) {
  const fallback = "light";
  const initialColorMode = manager.get(fallback) ?? fallback;
  if (initialColorMode === "system") {
    // We can't know the client system preference in SSR so just return the fallback.
    return isServer ? fallback : getSystemColorMode();
  }
  return initialColorMode;
}
function addColorModeListener(fn) {
  const mql = query();
  const listener = e => {
    fn(e.matches ? "dark" : "light");
  };
  mql.addEventListener("change", listener);
  return () => {
    mql.removeEventListener("change", listener);
  };
}

/**
 * Provides context for the color mode based on config in `theme`
 * Returns the color mode and function to toggle the color mode
 */
function ColorModeProvider(props) {
  const fallbackColorMode = () => props.initialColorMode ?? FALLBACK_COLOR_MODE_VALUE;
  const colorModeManager = () => props.storageManager ?? localStorageManager;
  let colorModeListenerCleanupFn;
  const [colorMode, rawSetColorMode] = createSignal(getInitialColorMode(colorModeManager()));
  const applyColorMode = value => {
    rawSetColorMode(value);
    setColorModeDataset(value, props.disableTransitionOnChange);
  };
  const setColorMode = value => {
    if (colorModeListenerCleanupFn) {
      colorModeListenerCleanupFn();
      colorModeListenerCleanupFn = undefined;
    }
    const isSystem = value === "system";
    if (isSystem) {
      colorModeListenerCleanupFn = addColorModeListener(applyColorMode);
    }
    applyColorMode(isSystem ? getSystemColorMode() : value);
    colorModeManager().set(value);
  };
  const toggleColorMode = () => {
    setColorMode(colorMode() === "dark" ? "light" : "dark");
  };
  createEffect(() => {
    setColorMode(colorModeManager().get() ?? fallbackColorMode());
  });
  onCleanup(() => {
    // ensure listener is always cleaned when component is destroyed.
    colorModeListenerCleanupFn?.();
  });
  const context = {
    colorMode,
    setColorMode,
    toggleColorMode
  };
  return createComponent(ColorModeContext.Provider, {
    value: context,
    get children() {
      return props.children;
    }
  });
}

const _tmpl$$h = /*#__PURE__*/template(`<script id="kb-color-mode-script">`);
const VALID_VALUES = new Set(["light", "dark", "system"]);

/**
 * runtime safe-guard against invalid color mode values
 */
function normalize(initialColorMode) {
  if (!VALID_VALUES.has(initialColorMode)) {
    return FALLBACK_COLOR_MODE_VALUE;
  }
  return initialColorMode;
}
function ColorModeScript(props) {
  props = mergeProps({
    initialColorMode: FALLBACK_COLOR_MODE_VALUE,
    storageType: "localStorage",
    storageKey: COLOR_MODE_STORAGE_KEY
  }, props);
  const scriptSrc = createMemo(() => {
    // runtime safe-guard against invalid color mode values
    const init = normalize(props.initialColorMode);
    const cookieScript = `(function(){try{var a=function(o){var l="(prefers-color-scheme: dark)",v=window.matchMedia(l).matches?"dark":"light",e=o==="system"?v:o,d=document.documentElement,s=e==="dark";return d.style.colorScheme=e,d.dataset.kbTheme=e,o},u=a,h="${init}",r="${props.storageKey}",t=document.cookie.match(new RegExp("(^| )".concat(r,"=([^;]+)"))),c=t?t[2]:null;c?a(c):document.cookie="".concat(r,"=").concat(a(h),"; max-age=31536000; path=/")}catch(a){}})();`;
    const localStorageScript = `(function(){try{var a=function(c){var v="(prefers-color-scheme: dark)",h=window.matchMedia(v).matches?"dark":"light",r=c==="system"?h:c,o=document.documentElement,i=r==="dark";return o.style.colorScheme=r,o.dataset.kbTheme=r,c},n=a,m="${init}",e="${props.storageKey}",t=localStorage.getItem(e);t?a(t):localStorage.setItem(e,a(m))}catch(a){}})();`;
    const fn = props.storageType === "cookie" ? cookieScript : localStorageScript;
    return `!${fn}`.trim();
  });

  // eslint-disable-next-line solid/no-innerhtml
  return (() => {
    const _el$ = _tmpl$$h();
    effect(_p$ => {
      const _v$ = props.nonce,
        _v$2 = scriptSrc();
      _v$ !== _p$._v$ && setAttribute(_el$, "nonce", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && (_el$.innerHTML = _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}

/**
 * Generate a flatted array of `CollectionNode` from a custom data source.
 */
function buildNodes(params) {
  let index = params.startIndex ?? 0;
  const level = params.startLevel ?? 0;
  const nodes = [];
  const getKey = data => {
    if (data == null) {
      return "";
    }
    const _getKey = params.getKey ?? "key";
    const dataKey = isString(_getKey) ? data[_getKey] : _getKey(data);
    return dataKey != null ? String(dataKey) : "";
  };
  const getTextValue = data => {
    if (data == null) {
      return "";
    }
    const _getTextValue = params.getTextValue ?? "textValue";
    const dataTextValue = isString(_getTextValue) ? data[_getTextValue] : _getTextValue(data);
    return dataTextValue != null ? String(dataTextValue) : "";
  };
  const getDisabled = data => {
    if (data == null) {
      return false;
    }
    const _getDisabled = params.getDisabled ?? "disabled";
    return (isString(_getDisabled) ? data[_getDisabled] : _getDisabled(data)) ?? false;
  };
  const getSectionChildren = data => {
    if (data == null) {
      return undefined;
    }
    if (isString(params.getSectionChildren)) {
      return data[params.getSectionChildren];
    }
    return params.getSectionChildren?.(data);
  };
  for (const data of params.dataSource) {
    // If it's not an object assume it's an item.
    if (isString(data) || isNumber(data)) {
      nodes.push({
        type: "item",
        rawValue: data,
        key: String(data),
        textValue: String(data),
        disabled: getDisabled(data),
        level,
        index
      });
      index++;
      continue;
    }

    // Assume it's a section if it has children.
    if (getSectionChildren(data) != null) {
      nodes.push({
        type: "section",
        rawValue: data,
        key: "",
        // not applicable here
        textValue: "",
        // not applicable here
        disabled: false,
        // not applicable here
        level: level,
        index: index
      });
      index++;
      const sectionChildren = getSectionChildren(data) ?? [];
      if (sectionChildren.length > 0) {
        const childNodes = buildNodes({
          dataSource: sectionChildren,
          getKey: params.getKey,
          getTextValue: params.getTextValue,
          getDisabled: params.getDisabled,
          getSectionChildren: params.getSectionChildren,
          startIndex: index,
          startLevel: level + 1
        });
        nodes.push(...childNodes);
        index += childNodes.length;
      }
    } else {
      nodes.push({
        type: "item",
        rawValue: data,
        key: getKey(data),
        textValue: getTextValue(data),
        disabled: getDisabled(data),
        level,
        index
      });
      index++;
    }
  }
  return nodes;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/collections/src/useCollection.ts
 */

function createCollection(props, deps = []) {
  const initialNodes = buildNodes({
    dataSource: access(props.dataSource),
    getKey: access(props.getKey),
    getTextValue: access(props.getTextValue),
    getDisabled: access(props.getDisabled),
    getSectionChildren: access(props.getSectionChildren)
  });
  const [collection, setCollection] = createSignal(props.factory(initialNodes));
  createEffect(on([() => access(props.dataSource), () => access(props.getKey), () => access(props.getTextValue), () => access(props.getDisabled), () => access(props.getSectionChildren), () => props.factory, ...deps], ([dataSource, getKey, getTextValue, getDisabled, getSectionChildren, factory]) => {
    const nodes = buildNodes({
      dataSource,
      getKey,
      getTextValue,
      getDisabled,
      getSectionChildren
    });
    setCollection(() => factory(nodes));
  }, {
    defer: true
  }));
  return collection;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/22cb32d329e66c60f55d4fc4025d1d44bb015d71/packages/@react-stately/collections/src/getItemCount.ts
 */

const cache$2 = new WeakMap();
function getItemCount(collection) {
  let count = cache$2.get(collection);
  if (count != null) {
    return count;
  }
  count = 0;
  for (const item of collection) {
    if (item.type === "item") {
      count++;
    }
  }
  cache$2.set(collection, count);
  return count;
}

/**
 * Creates a simple reactive state with a getter and setter,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableSignal(props) {
  // Internal uncontrolled value
  // eslint-disable-next-line solid/reactivity
  const [_value, _setValue] = createSignal(props.defaultValue?.());
  const isControlled = createMemo(() => props.value?.() !== undefined);
  const value = createMemo(() => isControlled() ? props.value?.() : _value());
  const setValue = next => {
    untrack(() => {
      const nextValue = accessWith(next, value());
      if (!Object.is(nextValue, value())) {
        if (!isControlled()) {
          _setValue(nextValue);
        }
        props.onChange?.(nextValue);
      }
      return nextValue;
    });
  };
  return [value, setValue];
}

/**
 * Creates a simple reactive Boolean state with a getter, setter and a fallback value of `false`,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableBooleanSignal(props) {
  const [_value, setValue] = createControllableSignal(props);
  const value = () => _value() ?? false;
  return [value, setValue];
}

/**
 * Creates a simple reactive Array state with a getter, setter and a fallback value of `[]`,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableArraySignal(props) {
  const [_value, setValue] = createControllableSignal(props);
  const value = () => _value() ?? [];
  return [value, setValue];
}

/**
 * Creates a simple reactive Set state with a getter, setter and a fallback value of `Set()`,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableSetSignal(props) {
  const [_value, setValue] = createControllableSignal(props);
  const value = () => _value() ?? new Set();
  return [value, setValue];
}

/**
 * Provides state management for open, close and toggle scenarios.
 * Used to control the "open state" of components like Modal, Drawer, etc.
 */
function createDisclosureState(props = {}) {
  const [isOpen, setIsOpen] = createControllableBooleanSignal({
    value: () => access(props.open),
    defaultValue: () => !!access(props.defaultOpen),
    onChange: value => props.onOpenChange?.(value)
  });
  const open = () => {
    setIsOpen(true);
  };
  const close = () => {
    setIsOpen(false);
  };
  const toggle = () => {
    isOpen() ? close() : open();
  };
  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle
  };
}

/**
 * Listens for when the escape key is down on the document.
 */
function createEscapeKeyDown(props) {
  const handleKeyDown = event => {
    if (event.key === EventKey.Escape) {
      props.onEscapeKeyDown?.(event);
    }
  };
  createEffect(() => {
    if (isServer) {
      return;
    }
    if (access(props.isDisabled)) {
      return;
    }
    const document = props.ownerDocument?.() ?? getDocument();
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });
  });
}

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/dismissable-layer/src/DismissableLayer.tsx
 *
 * Portions of this file are based on code from zag.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/zag/blob/d1dbf9e240803c9e3ed81ebef363739be4273de0/packages/utilities/dismissable/src/layer-stack.ts
 */

const DATA_TOP_LAYER_ATTR = "data-kb-top-layer";
let originalBodyPointerEvents;
let hasDisabledBodyPointerEvents = false;
const layers = [];
function indexOf(node) {
  return layers.findIndex(layer => layer.node === node);
}
function find(node) {
  return layers[indexOf(node)];
}
function isTopMostLayer(node) {
  return layers[layers.length - 1].node === node;
}
function getPointerBlockingLayers() {
  return layers.filter(layer => layer.isPointerBlocking);
}
function getTopMostPointerBlockingLayer() {
  return [...getPointerBlockingLayers()].slice(-1)[0];
}
function hasPointerBlockingLayer() {
  return getPointerBlockingLayers().length > 0;
}
function isBelowPointerBlockingLayer(node) {
  const highestBlockingIndex = indexOf(getTopMostPointerBlockingLayer()?.node);
  return indexOf(node) < highestBlockingIndex;
}
function addLayer(layer) {
  layers.push(layer);
}
function removeLayer(node) {
  const index = indexOf(node);
  if (index < 0) {
    return;
  }
  layers.splice(index, 1);
}
function assignPointerEventToLayers() {
  layers.forEach(({
    node
  }) => {
    node.style.pointerEvents = isBelowPointerBlockingLayer(node) ? "none" : "auto";
  });
}

/**
 * Disable body `pointer-events` if there are "pointer blocking" layers in the stack,
 * and body `pointer-events` has not been disabled yet.
 */
function disableBodyPointerEvents(node) {
  if (hasPointerBlockingLayer() && !hasDisabledBodyPointerEvents) {
    const ownerDocument = getDocument(node);
    originalBodyPointerEvents = document.body.style.pointerEvents;
    ownerDocument.body.style.pointerEvents = "none";
    hasDisabledBodyPointerEvents = true;
  }
}

/**
 * Restore body `pointer-events` style if there is no "pointer blocking" layer in the stack.
 */
function restoreBodyPointerEvents(node) {
  if (hasPointerBlockingLayer()) {
    return;
  }
  const ownerDocument = getDocument(node);
  ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
  if (ownerDocument.body.style.length === 0) {
    ownerDocument.body.removeAttribute("style");
  }
  hasDisabledBodyPointerEvents = false;
}
const layerStack = {
  layers,
  isTopMostLayer,
  hasPointerBlockingLayer,
  isBelowPointerBlockingLayer,
  addLayer,
  removeLayer,
  indexOf,
  find,
  assignPointerEventToLayers,
  disableBodyPointerEvents,
  restoreBodyPointerEvents
};

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/focus-scope/src/FocusScope.tsx
 *
 * Portions of this file are based on code from zag.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/zag/blob/d1dbf9e240803c9e3ed81ebef363739be4273de0/packages/utilities/focus-scope/src/focus-on-child-unmount.ts
 * https://github.com/chakra-ui/zag/blob/d1dbf9e240803c9e3ed81ebef363739be4273de0/packages/utilities/focus-scope/src/focus-containment.ts
 */

const AUTOFOCUS_ON_MOUNT_EVENT = "focusScope.autoFocusOnMount";
const AUTOFOCUS_ON_UNMOUNT_EVENT = "focusScope.autoFocusOnUnmount";
const EVENT_OPTIONS = {
  bubbles: false,
  cancelable: true
};
const focusScopeStack = {
  /** A stack of focus scopes, with the active one at the top */
  stack: [],
  active() {
    return this.stack[0];
  },
  add(scope) {
    // pause the currently active focus scope (at the top of the stack)
    if (scope !== this.active()) {
      this.active()?.pause();
    }

    // remove in case it already exists and re-add it at the top of the stack.
    this.stack = removeItemFromArray(this.stack, scope);
    this.stack.unshift(scope);
  },
  remove(scope) {
    this.stack = removeItemFromArray(this.stack, scope);
    this.active()?.resume();
  }
};
function createFocusScope(props, ref) {
  const [isPaused, setIsPaused] = createSignal(false);
  const focusScope = {
    pause() {
      setIsPaused(true);
    },
    resume() {
      setIsPaused(false);
    }
  };
  let lastFocusedElement = null;
  const onMountAutoFocus = e => props.onMountAutoFocus?.(e);
  const onUnmountAutoFocus = e => props.onUnmountAutoFocus?.(e);
  const ownerDocument = () => getDocument(ref());
  const createSentinel = () => {
    const element = ownerDocument().createElement("span");
    element.setAttribute("data-focus-trap", "");
    element.tabIndex = 0;
    Object.assign(element.style, visuallyHiddenStyles);
    return element;
  };
  const tabbables = () => {
    const container = ref();
    if (!container) {
      return [];
    }

    // Get all tabbable in container excluding focus scope sentinels
    return getAllTabbableIn(container, true).filter(el => !el.hasAttribute("data-focus-trap"));
  };
  const firstTabbable = () => {
    const items = tabbables();
    return items.length > 0 ? items[0] : null;
  };
  const lastTabbable = () => {
    const items = tabbables();
    return items.length > 0 ? items[items.length - 1] : null;
  };
  const shouldPreventUnmountAutoFocus = () => {
    const container = ref();
    if (!container) {
      return false;
    }
    const activeElement = getActiveElement(container);
    if (!activeElement) {
      return false;
    }
    if (contains(container, activeElement)) {
      return false;
    }

    // Don't autofocus the previously focused element on unmount
    // if a focusable element outside the container is already focused.
    return isFocusable(activeElement);
  };

  // Handle dispatching mount and unmount autofocus events.
  createEffect(() => {
    if (isServer) {
      return;
    }
    const container = ref();
    if (!container) {
      return;
    }
    focusScopeStack.add(focusScope);
    const previouslyFocusedElement = getActiveElement(container);
    const hasFocusedCandidate = contains(container, previouslyFocusedElement);
    if (!hasFocusedCandidate) {
      const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT_EVENT, EVENT_OPTIONS);
      container.addEventListener(AUTOFOCUS_ON_MOUNT_EVENT, onMountAutoFocus);
      container.dispatchEvent(mountEvent);
      if (!mountEvent.defaultPrevented) {
        // Delay the focusing because it may run before a `DismissableLayer` is added to the layer stack,
        // so it cause nested dismissable layer to open then close instantly.
        setTimeout(() => {
          focusWithoutScrolling(firstTabbable());
          if (getActiveElement(container) === previouslyFocusedElement) {
            focusWithoutScrolling(container);
          }
        }, 0);
      }
    }
    onCleanup(() => {
      container.removeEventListener(AUTOFOCUS_ON_MOUNT_EVENT, onMountAutoFocus);
      setTimeout(() => {
        const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT_EVENT, EVENT_OPTIONS);
        if (shouldPreventUnmountAutoFocus()) {
          unmountEvent.preventDefault();
        }
        container.addEventListener(AUTOFOCUS_ON_UNMOUNT_EVENT, onUnmountAutoFocus);
        container.dispatchEvent(unmountEvent);
        if (!unmountEvent.defaultPrevented) {
          focusWithoutScrolling(previouslyFocusedElement ?? ownerDocument().body);
        }

        // We need to remove the listener after we `dispatchEvent`.
        container.removeEventListener(AUTOFOCUS_ON_UNMOUNT_EVENT, onUnmountAutoFocus);
        focusScopeStack.remove(focusScope);
      }, 0);
    });
  });

  /*
  // Handle containing focus if a child unmount.
  createEffect(() => {
    if (isServer) {
      return;
    }
     const container = ref();
     if (!container || !access(props.trapFocus)) {
      return;
    }
     const observer = new MutationObserver(([mutation]) => {
      if (!mutation || mutation.target !== container) {
        return;
      }
       if (getActiveElement(container) === ownerDocument().body) {
        focusWithoutScrolling(container);
      }
    });
     observer.observe(container, { childList: true, subtree: true });
     onCleanup(() => {
      observer.disconnect();
    });
  });
  */

  // Handle containing focus if focus is moved outside.
  createEffect(() => {
    if (isServer) {
      return;
    }
    const container = ref();
    if (!container || !access(props.trapFocus) || isPaused()) {
      return;
    }
    const onFocusIn = event => {
      const target = event.target;

      // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
      if (target?.closest(`[${DATA_TOP_LAYER_ATTR}]`)) {
        return;
      }
      if (contains(container, target)) {
        lastFocusedElement = target;
      } else {
        focusWithoutScrolling(lastFocusedElement);
      }
    };
    const onFocusOut = event => {
      const relatedTarget = event.relatedTarget;
      const target = relatedTarget ?? getActiveElement(container);

      // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
      if (target?.closest(`[${DATA_TOP_LAYER_ATTR}]`)) {
        return;
      }
      if (!contains(container, target)) {
        focusWithoutScrolling(lastFocusedElement);
      }
    };
    ownerDocument().addEventListener("focusin", onFocusIn);
    ownerDocument().addEventListener("focusout", onFocusOut);
    onCleanup(() => {
      ownerDocument().removeEventListener("focusin", onFocusIn);
      ownerDocument().removeEventListener("focusout", onFocusOut);
    });
  });

  // Handle looping focus (when tabbing whilst at the edges)
  createEffect(() => {
    if (isServer) {
      return;
    }
    const container = ref();
    if (!container || !access(props.trapFocus) || isPaused()) {
      return;
    }
    const startSentinel = createSentinel();
    container.insertAdjacentElement("afterbegin", startSentinel);
    const endSentinel = createSentinel();
    container.insertAdjacentElement("beforeend", endSentinel);
    function onFocus(event) {
      const first = firstTabbable();
      const last = lastTabbable();
      if (event.relatedTarget === first) {
        focusWithoutScrolling(last);
      } else {
        focusWithoutScrolling(first);
      }
    }
    startSentinel.addEventListener("focusin", onFocus);
    endSentinel.addEventListener("focusin", onFocus);

    // Ensure sentinels are always the edges of the container.
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.previousSibling === endSentinel) {
          endSentinel.remove();
          container.insertAdjacentElement("beforeend", endSentinel);
        }
        if (mutation.nextSibling === startSentinel) {
          startSentinel.remove();
          container.insertAdjacentElement("afterbegin", startSentinel);
        }
      }
    });
    observer.observe(container, {
      childList: true,
      subtree: false
    });
    onCleanup(() => {
      startSentinel.removeEventListener("focusin", onFocus);
      endSentinel.removeEventListener("focusin", onFocus);
      startSentinel.remove();
      endSentinel.remove();
      observer.disconnect();
    });
  });
}

/*!
 * Portions of this file are based on code from zag.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the zag team:
 * https://github.com/chakra-ui/zag/blob/c1e6c7689b22bf58741ded7cf224dd9baec2a046/packages/utilities/form-utils/src/form.ts
 */


/**
 * Listens for `reset` event on the closest `<form>` element and execute the given handler.
 */
function createFormResetListener(element, handler) {
  createEffect(on(element, element => {
    if (element == null) {
      return;
    }
    const form = getClosestForm(element);
    if (form == null) {
      return;
    }
    form.addEventListener("reset", handler, {
      passive: true
    });
    onCleanup(() => {
      form.removeEventListener("reset", handler);
    });
  }));
}
function getClosestForm(element) {
  return isFormElement(element) ? element.form : element.closest("form");
}
function isFormElement(element) {
  return element.matches("textarea, input, select, button");
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/15e101b74966bd5eb719c6529ce71ce57eaed430/packages/@react-aria/live-announcer/src/LiveAnnouncer.tsx
 */

/* Inspired by https://github.com/AlmeroSteyn/react-aria-live */
const LIVEREGION_TIMEOUT_DELAY = 7000;
let liveAnnouncer = null;
const DATA_LIVE_ANNOUNCER_ATTR = "data-live-announcer";

/**
 * Announces the message using screen reader technology.
 */
function announce(message, assertiveness = "assertive", timeout = LIVEREGION_TIMEOUT_DELAY) {
  if (!liveAnnouncer) {
    liveAnnouncer = new LiveAnnouncer();
  }
  liveAnnouncer.announce(message, assertiveness, timeout);
}

/**
 * Stops all queued announcements.
 */
function clearAnnouncer(assertiveness) {
  if (liveAnnouncer) {
    liveAnnouncer.clear(assertiveness);
  }
}

/**
 * Removes the announcer from the DOM.
 */
function destroyAnnouncer() {
  if (liveAnnouncer) {
    liveAnnouncer.destroy();
    liveAnnouncer = null;
  }
}

// LiveAnnouncer is implemented using vanilla DOM, not SolidJS.
class LiveAnnouncer {
  constructor() {
    this.node = document.createElement("div");
    this.node.dataset.liveAnnouncer = "true";
    Object.assign(this.node.style, visuallyHiddenStyles);
    this.assertiveLog = this.createLog("assertive");
    this.node.appendChild(this.assertiveLog);
    this.politeLog = this.createLog("polite");
    this.node.appendChild(this.politeLog);
    document.body.prepend(this.node);
  }
  createLog(ariaLive) {
    const node = document.createElement("div");
    node.setAttribute("role", "log");
    node.setAttribute("aria-live", ariaLive);
    node.setAttribute("aria-relevant", "additions");
    return node;
  }
  destroy() {
    if (!this.node) {
      return;
    }
    document.body.removeChild(this.node);
    this.node = null;
  }
  announce(message, assertiveness = "assertive", timeout = LIVEREGION_TIMEOUT_DELAY) {
    if (!this.node) {
      return;
    }
    const node = document.createElement("div");
    node.textContent = message;
    if (assertiveness === "assertive") {
      this.assertiveLog.appendChild(node);
    } else {
      this.politeLog.appendChild(node);
    }
    if (message !== "") {
      setTimeout(() => {
        node.remove();
      }, timeout);
    }
  }
  clear(assertiveness) {
    if (!this.node) {
      return;
    }
    if (!assertiveness || assertiveness === "assertive") {
      this.assertiveLog.innerHTML = "";
    }
    if (!assertiveness || assertiveness === "polite") {
      this.politeLog.innerHTML = "";
    }
  }
}

/*!
 * This file is based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/810579b671791f1593108f62cdc1893de3a220e3/packages/@react-aria/overlays/src/ariaHideOutside.ts
 */

/**
 * Hides all elements in the DOM outside the given targets from screen readers
 * using aria-hidden, and returns a function to revert these changes.
 * In addition, changes to the DOM are watched and new elements
 * outside the targets are automatically hidden.
 */
function createHideOutside(props) {
  createEffect(() => {
    if (access(props.isDisabled)) {
      return;
    }
    onCleanup(ariaHideOutside(access(props.targets), access(props.root)));
  });
}
// Keeps a ref count of all hidden elements.
// Added to when hiding an element, and subtracted from when showing it again.
// When it reaches zero, aria-hidden is removed.
const refCountMap = new WeakMap();
const observerStack = [];

/**
 * Hides all elements in the DOM outside the given targets from screen readers using aria-hidden,
 * and returns a function to revert these changes. In addition, changes to the DOM are watched
 * and new elements outside the targets are automatically hidden.
 * @param targets - The elements that should remain visible.
 * @param root - Nothing will be hidden above this element.
 * @returns - A function to restore all hidden elements.
 */
function ariaHideOutside(targets, root = document.body) {
  const visibleNodes = new Set(targets);
  const hiddenNodes = new Set();
  const walk = root => {
    // Keep live announcer and top layer elements (e.g. toasts) visible.
    for (const element of root.querySelectorAll(`[${DATA_LIVE_ANNOUNCER_ATTR}], [${DATA_TOP_LAYER_ATTR}]`)) {
      visibleNodes.add(element);
    }
    const acceptNode = node => {
      // Skip this node and its children if it is one of the target nodes, or a live announcer.
      // Also skip children of already hidden nodes, as aria-hidden is recursive. An exception is
      // made for elements with role="row" since VoiceOver on iOS has issues hiding elements with role="row".
      // For that case we want to hide the cells inside as well (https://bugs.webkit.org/show_bug.cgi?id=222623).
      if (visibleNodes.has(node) || node.parentElement && hiddenNodes.has(node.parentElement) && node.parentElement.getAttribute("role") !== "row") {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip this node but continue to children if one of the targets is inside the node.
      for (const target of visibleNodes) {
        if (node.contains(target)) {
          return NodeFilter.FILTER_SKIP;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode
    });

    // TreeWalker does not include the root.
    const acceptRoot = acceptNode(root);
    if (acceptRoot === NodeFilter.FILTER_ACCEPT) {
      hide(root);
    }
    if (acceptRoot !== NodeFilter.FILTER_REJECT) {
      let node = walker.nextNode();
      while (node != null) {
        hide(node);
        node = walker.nextNode();
      }
    }
  };
  const hide = node => {
    const refCount = refCountMap.get(node) ?? 0;

    // If already aria-hidden, and the ref count is zero, then this element
    // was already hidden and there's nothing for us to do.
    if (node.getAttribute("aria-hidden") === "true" && refCount === 0) {
      return;
    }
    if (refCount === 0) {
      node.setAttribute("aria-hidden", "true");
    }
    hiddenNodes.add(node);
    refCountMap.set(node, refCount + 1);
  };

  // If there is already a MutationObserver listening from a previous call,
  // disconnect it so the new on takes over.
  if (observerStack.length) {
    observerStack[observerStack.length - 1].disconnect();
  }
  walk(root);
  const observer = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type !== "childList" || change.addedNodes.length === 0) {
        continue;
      }

      // If the parent element of the added nodes is not within one of the targets,
      // and not already inside a hidden node, hide all of the new children.
      if (![...visibleNodes, ...hiddenNodes].some(node => node.contains(change.target))) {
        for (const node of change.removedNodes) {
          if (node instanceof Element) {
            visibleNodes.delete(node);
            hiddenNodes.delete(node);
          }
        }
        for (const node of change.addedNodes) {
          if ((node instanceof HTMLElement || node instanceof SVGElement) && (node.dataset.liveAnnouncer === "true" || node.dataset.reactAriaTopLayer === "true")) {
            visibleNodes.add(node);
          } else if (node instanceof Element) {
            walk(node);
          }
        }
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true
  });
  const observerWrapper = {
    observe() {
      observer.observe(root, {
        childList: true,
        subtree: true
      });
    },
    disconnect() {
      observer.disconnect();
    }
  };
  observerStack.push(observerWrapper);
  return () => {
    observer.disconnect();
    for (const node of hiddenNodes) {
      const count = refCountMap.get(node);
      if (count == null) {
        return;
      }
      if (count === 1) {
        node.removeAttribute("aria-hidden");
        refCountMap.delete(node);
      } else {
        refCountMap.set(node, count - 1);
      }
    }

    // Remove this observer from the stack, and start the previous one.
    if (observerWrapper === observerStack[observerStack.length - 1]) {
      observerStack.pop();
      if (observerStack.length) {
        observerStack[observerStack.length - 1].observe();
      }
    } else {
      observerStack.splice(observerStack.indexOf(observerWrapper), 1);
    }
  };
}

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/dismissable-layer/src/DismissableLayer.tsx
 *
 * Portions of this file are based on code from zag.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/zag/blob/d1dbf9e240803c9e3ed81ebef363739be4273de0/packages/utilities/interact-outside/src/index.ts
 */

const POINTER_DOWN_OUTSIDE_EVENT = "interactOutside.pointerDownOutside";
const FOCUS_OUTSIDE_EVENT = "interactOutside.focusOutside";
function createInteractOutside(props, ref) {
  let pointerDownTimeoutId;
  let clickHandler = noop;
  const ownerDocument = () => getDocument(ref());
  const onPointerDownOutside = e => props.onPointerDownOutside?.(e);
  const onFocusOutside = e => props.onFocusOutside?.(e);
  const onInteractOutside = e => props.onInteractOutside?.(e);
  const isEventOutside = e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    // If the target is within a top layer element (e.g. toasts), ignore.
    if (target.closest(`[${DATA_TOP_LAYER_ATTR}]`)) {
      return false;
    }
    if (!contains(ownerDocument(), target)) {
      return false;
    }
    if (contains(ref(), target)) {
      return false;
    }
    return !props.shouldExcludeElement?.(target);
  };
  const onPointerDown = e => {
    function handler() {
      const container = ref();
      const target = e.target;
      if (!container || !target || !isEventOutside(e)) {
        return;
      }
      const handler = composeEventHandlers([onPointerDownOutside, onInteractOutside]);
      target.addEventListener(POINTER_DOWN_OUTSIDE_EVENT, handler, {
        once: true
      });
      const pointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE_EVENT, {
        bubbles: false,
        cancelable: true,
        detail: {
          originalEvent: e,
          isContextMenu: e.button === 2 || isCtrlKey(e) && e.button === 0
        }
      });
      target.dispatchEvent(pointerDownOutsideEvent);
    }

    /**
     * On touch devices, we need to wait for a click event because browsers implement
     * a ~350ms delay between the time the user stops touching the display and when the
     * browser executes events. We need to ensure we don't reactivate pointer-events within
     * this timeframe otherwise the browser may execute events that should have been prevented.
     *
     * Additionally, this also lets us deal automatically with cancellations when a click event
     * isn't raised because the page was considered scrolled/drag-scrolled, long-pressed, etc.
     *
     * This is why we also continuously remove the previous listener, because we cannot be
     * certain that it was raised, and therefore cleaned-up.
     */
    if (e.pointerType === "touch") {
      ownerDocument().removeEventListener("click", handler);
      clickHandler = handler;
      ownerDocument().addEventListener("click", handler, {
        once: true
      });
    } else {
      handler();
    }
  };
  const onFocusIn = e => {
    const container = ref();
    const target = e.target;
    if (!container || !target || !isEventOutside(e)) {
      return;
    }
    const handler = composeEventHandlers([onFocusOutside, onInteractOutside]);
    target.addEventListener(FOCUS_OUTSIDE_EVENT, handler, {
      once: true
    });
    const focusOutsideEvent = new CustomEvent(FOCUS_OUTSIDE_EVENT, {
      bubbles: false,
      cancelable: true,
      detail: {
        originalEvent: e,
        isContextMenu: false
      }
    });
    target.dispatchEvent(focusOutsideEvent);
  };
  createEffect(() => {
    if (isServer) {
      return;
    }
    if (access(props.isDisabled)) {
      return;
    }

    /**
     * if this primitive executes in a component that mounts via a `pointerdown` event, the event
     * would bubble up to the document and trigger a `pointerDownOutside` event. We avoid
     * this by delaying the event listener registration on the document.
     * ```
     * button.addEventListener('pointerdown', () => {
     *   console.log('I will log');
     *   document.addEventListener('pointerdown', () => {
     *     console.log('I will also log');
     *   })
     * });
     */
    pointerDownTimeoutId = window.setTimeout(() => {
      ownerDocument().addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    ownerDocument().addEventListener("focusin", onFocusIn, true);
    onCleanup(() => {
      window.clearTimeout(pointerDownTimeoutId);
      ownerDocument().removeEventListener("click", clickHandler);
      ownerDocument().removeEventListener("pointerdown", onPointerDown, true);
      ownerDocument().removeEventListener("focusin", onFocusIn, true);
    });
  });
}

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/21a7c97dc8efa79fecca36428eec49f187294085/packages/react/presence/src/Presence.tsx
 * https://github.com/radix-ui/primitives/blob/21a7c97dc8efa79fecca36428eec49f187294085/packages/react/presence/src/useStateMachine.tsx
 */

function createPresence(present) {
  const [node, setNode] = createSignal();
  let styles = {};
  let prevPresent = present();
  let prevAnimationName = "none";
  const [state, send] = createStateMachine(present() ? "mounted" : "unmounted", {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  createEffect(on(state, state => {
    const currentAnimationName = getAnimationName(styles);
    prevAnimationName = state === "mounted" ? currentAnimationName : "none";
  }));
  createEffect(on(present, present => {
    if (prevPresent === present) {
      return;
    }
    const currentAnimationName = getAnimationName(styles);
    if (present) {
      send("MOUNT");
      //} else if (currentAnimationName === "none" || styles?.display === "none") {
      // If there is no exit animation or the element is hidden, animations won't run, so we unmount instantly
    } else if (styles?.display === "none") {
      // If the element is hidden, animations won't run, so we unmount instantly
      send("UNMOUNT");
    } else {
      /**
       * When `present` changes to `false`, we check changes to animation-name to
       * determine whether an animation has started. We chose this approach (reading
       * computed styles) because there is no `animationrun` event and `animationstart`
       * fires after `animation-delay` has expired which would be too late.
       */
      const isAnimating = prevAnimationName !== currentAnimationName;
      if (prevPresent && isAnimating) {
        send("ANIMATION_OUT");
      } else {
        send("UNMOUNT");
      }
    }
    prevPresent = present;
  }));
  createEffect(on(node, node => {
    if (node) {
      /**
       * Triggering an ANIMATION_OUT during an ANIMATION_IN will fire an `animationcancel`
       * event for ANIMATION_IN after we have entered `unmountSuspended` state. So, we
       * make sure we only trigger ANIMATION_END for the currently active animation.
       */
      const handleAnimationEnd = event => {
        const currentAnimationName = getAnimationName(styles);
        const isCurrentAnimation = currentAnimationName.includes(event.animationName);
        if (event.target === node && isCurrentAnimation) {
          send("ANIMATION_END");
        }
      };
      const handleAnimationStart = event => {
        if (event.target === node) {
          // if animation occurred, store its name as the previous animation.
          prevAnimationName = getAnimationName(styles);
        }
      };
      node.addEventListener("animationstart", handleAnimationStart);
      node.addEventListener("animationcancel", handleAnimationEnd);
      node.addEventListener("animationend", handleAnimationEnd);
      onCleanup(() => {
        node.removeEventListener("animationstart", handleAnimationStart);
        node.removeEventListener("animationcancel", handleAnimationEnd);
        node.removeEventListener("animationend", handleAnimationEnd);
      });
    } else {
      // Transition to the unmounted state if the node is removed prematurely.
      // We avoid doing so during cleanup as the node may change but still exist.
      send("ANIMATION_END");
    }
  }));
  return {
    isPresent: () => ["mounted", "unmountSuspended"].includes(state()),
    setRef: el => {
      if (el) {
        styles = getComputedStyle(el);
      }
      setNode(el);
    }
  };
}

/* -----------------------------------------------------------------------------------------------*/

function getAnimationName(styles) {
  return styles?.animationName || "none";
}

// https://fettblog.eu/typescript-union-to-intersection/

function createStateMachine(initialState, machine) {
  const reduce = (state, event) => {
    const nextState = machine[state][event];
    return nextState ?? state;
  };
  const [state, setState] = createSignal(initialState);
  const send = event => {
    setState(prev => reduce(prev, event));
  };
  return [state, send];
}

/*!
 * Portions of this file are based on code from floating-ui.
 * MIT Licensed, Copyright (c) 2021 Floating UI contributors.
 *
 * Credits to the Floating UI contributors:
 * https://github.com/floating-ui/floating-ui/blob/f7ce9420aa32c150eb45049f12cf3b5506715341/packages/react/src/components/FloatingOverlay.tsx
 *
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/5d8a1f047fcadcf117073c70359663a3946b73bf/packages/ariakit/src/dialog/__utils/use-prevent-body-scroll.ts
 */

const SCROLL_LOCK_IDENTIFIER = "data-kb-scroll-lock";
function assignStyle(element, style) {
  if (!element) {
    return () => {};
  }
  const previousStyle = element.style.cssText;
  Object.assign(element.style, style);
  return () => {
    element.style.cssText = previousStyle;
  };
}
function setCSSProperty(element, property, value) {
  if (!element) {
    return () => {};
  }
  const previousValue = element.style.getPropertyValue(property);
  element.style.setProperty(property, value);
  return () => {
    if (previousValue) {
      element.style.setProperty(property, previousValue);
    } else {
      element.style.removeProperty(property);
    }
  };
}
function getPaddingProperty(documentElement) {
  // RTL <body> scrollbar
  const documentLeft = documentElement.getBoundingClientRect().left;
  const scrollbarX = Math.round(documentLeft) + documentElement.scrollLeft;
  return scrollbarX ? "paddingLeft" : "paddingRight";
}
/**
 * Prevents scrolling on the document body on mount, and
 * restores it on unmount. Also ensures that content does not
 * shift due to the scrollbars disappearing.
 */
function createPreventScroll(props) {
  createEffect(() => {
    if (isServer) {
      return;
    }
    if (!access(props.ownerRef) || access(props.isDisabled)) {
      return;
    }
    const doc = getDocument(access(props.ownerRef));
    const win = getWindow(access(props.ownerRef));
    const {
      documentElement,
      body
    } = doc;
    const alreadyLocked = body.hasAttribute(SCROLL_LOCK_IDENTIFIER);
    if (alreadyLocked) {
      return;
    }
    body.setAttribute(SCROLL_LOCK_IDENTIFIER, "");
    const scrollbarWidth = win.innerWidth - documentElement.clientWidth;
    const setScrollbarWidthProperty = () => {
      return setCSSProperty(documentElement, "--scrollbar-width", `${scrollbarWidth}px`);
    };
    const paddingProperty = getPaddingProperty(documentElement);

    // For most browsers, all we need to do is set `overflow: hidden` on the root element, and
    // add some padding to prevent the page from shifting when the scrollbar is hidden.
    const setStyle = () => {
      return assignStyle(body, {
        overflow: "hidden",
        [paddingProperty]: `${scrollbarWidth}px`
      });
    };

    // Only iOS doesn't respect `overflow: hidden` on document.body.
    const setIOSStyle = () => {
      const {
        scrollX,
        scrollY,
        visualViewport
      } = win;

      // iOS 12 does not support `visualViewport`.
      const offsetLeft = visualViewport?.offsetLeft ?? 0;
      const offsetTop = visualViewport?.offsetTop ?? 0;
      const restoreStyle = assignStyle(body, {
        position: "fixed",
        overflow: "hidden",
        top: `${-(scrollY - Math.floor(offsetTop))}px`,
        left: `${-(scrollX - Math.floor(offsetLeft))}px`,
        right: "0",
        [paddingProperty]: `${scrollbarWidth}px`
      });
      return () => {
        restoreStyle();
        win.scrollTo(scrollX, scrollY);
      };
    };
    const cleanup = chain([setScrollbarWidthProperty(), isIOS() ? setIOSStyle() : setStyle()]);
    onCleanup(() => {
      cleanup();
      body.removeAttribute(SCROLL_LOCK_IDENTIFIER);
    });
  });
}

/**
 * Create a function that call the setter with an id and return a function to reset it.
 */
function createRegisterId(setter) {
  return id => {
    setter(id);
    return () => setter(undefined);
  };
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the ariakit team:
 * https://github.com/ariakit/ariakit/blob/8a13899ff807bbf39f3d89d2d5964042ba4d5287/packages/ariakit-react-utils/src/hooks.ts
 */


/**
 * Returns the tag name by parsing an element ref.
 * @example
 * function Component(props) {
 *   let ref: HTMLDivElement | undefined;
 *   const tagName = createTagName(() => ref, () => "button"); // div
 *   return <div ref={ref} {...props} />;
 * }
 */
function createTagName(ref, fallback) {
  const [tagName, setTagName] = createSignal(stringOrUndefined(fallback?.()));
  createEffect(() => {
    setTagName(ref()?.tagName.toLowerCase() || stringOrUndefined(fallback?.()));
  });
  return tagName;
}
function stringOrUndefined(value) {
  return isString(value) ? value : undefined;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/a13802d8be6f83af1450e56f7a88527b10d9cadf/packages/@react-stately/toggle/src/useToggleState.ts
 */

/**
 * Provides state management for toggle components like checkboxes and switches.
 */
function createToggleState(props = {}) {
  const [isSelected, _setIsSelected] = createControllableBooleanSignal({
    value: () => access(props.isSelected),
    defaultValue: () => !!access(props.defaultIsSelected),
    onChange: value => props.onSelectedChange?.(value)
  });
  const setIsSelected = value => {
    if (!access(props.isReadOnly) && !access(props.isDisabled)) {
      _setIsSelected(value);
    }
  };
  const toggle = () => {
    if (!access(props.isReadOnly) && !access(props.isDisabled)) {
      _setIsSelected(!isSelected());
    }
  };
  return {
    isSelected,
    setIsSelected,
    toggle
  };
}

/*!
 * Portions of this file are based on code from mantinedev.
 * MIT Licensed, Copyright (c) 2021 Vitaly Rtishchev.
 *
 * Credits to the Mantinedev team:
 * https://github.com/mantinedev/mantine/blob/8546c580fdcaa9653edc6f4813103349a96cfb09/src/mantine-core/src/Transition/get-transition-styles/get-transition-styles.ts
 */

const TRANSITION_PHASES_MAP = {
  beforeEnter: "out",
  enter: "in",
  afterEnter: "in",
  beforeExit: "in",
  //"out",
  exit: "out",
  afterExit: "out"
};
function getTransitionStyles(params) {
  const shared = {
    "transition-duration": `${params.duration}ms`,
    "transition-timing-function": params.easing
  };
  return {
    "transition-property": getTransitionProperty(params.transition),
    ...shared,
    ...params.transition.common,
    ...params.transition[TRANSITION_PHASES_MAP[params.phase]]
  };
}
function getTransitionProperty(transitionStyles) {
  return [...new Set([...Object.keys(transitionStyles.in), ...Object.keys(transitionStyles.out)])].join(", ");
}

/*!
 * Portions of this file are based on code from mantinedev.
 * MIT Licensed, Copyright (c) 2021 Vitaly Rtishchev.
 *
 * Credits to the Mantinedev team:
 * https://github.com/mantinedev/mantine/blob/8546c580fdcaa9653edc6f4813103349a96cfb09/src/mantine-core/src/Transition/use-transition.ts
 */

const DEFAULT_DURATION = 250;
const DEFAULT_DELAY = 10;
const DEFAULT_EASING = "ease";

/**
 * Primitive for working with enter/exit transitions.
 *
 * @param shouldMount Whether the component should be mounted.
 * @param options The transition options.
 */
function createTransition(shouldMount, options) {
  options = mergeProps({
    duration: DEFAULT_DURATION,
    delay: DEFAULT_DELAY,
    easing: DEFAULT_EASING,
    get exitDuration() {
      return access(options).duration || DEFAULT_DURATION;
    },
    get exitDelay() {
      return access(options).delay || DEFAULT_DELAY;
    },
    get exitEasing() {
      return access(options).easing || DEFAULT_EASING;
    }
  }, options);
  const reduceMotion = createMediaQuery("(prefers-reduced-motion: reduce)");
  const [duration, setDuration] = createSignal(reduceMotion() ? 0 : access(options).duration);
  const [phase, setPhase] = createSignal(access(shouldMount) ? "afterEnter" : "afterExit");
  const [easing, setEasing] = createSignal(access(options).easing);
  let timeoutId = -1;
  const handleStateChange = shouldMount => {
    const preHandler = shouldMount ? access(options).onBeforeEnter : access(options).onBeforeExit;
    const postHandler = shouldMount ? access(options).onAfterEnter : access(options).onAfterExit;
    setPhase(shouldMount ? "beforeEnter" : "beforeExit");
    window.clearTimeout(timeoutId);
    const newDuration = setDuration(reduceMotion() ? 0 : shouldMount ? access(options).duration : access(options).exitDuration);
    setEasing(shouldMount ? access(options).easing : access(options).exitEasing);
    if (newDuration === 0) {
      preHandler?.();
      postHandler?.();
      setPhase(shouldMount ? "afterEnter" : "afterExit");
      return;
    }
    const delay = reduceMotion() ? 0 : shouldMount ? access(options).delay : access(options).exitDelay;
    const preStateTimeoutId = window.setTimeout(() => {
      preHandler?.();
      setPhase(shouldMount ? "enter" : "exit");
    }, delay);
    timeoutId = window.setTimeout(() => {
      window.clearTimeout(preStateTimeoutId);
      postHandler?.();
      setPhase(shouldMount ? "afterEnter" : "afterExit");
    }, delay + newDuration);
  };
  const style = createMemo(() => getTransitionStyles({
    transition: access(options).transition,
    duration: duration(),
    phase: phase(),
    easing: easing()
  }));
  const keepMounted = createMemo(() => phase() !== "afterExit");
  createEffect(on(() => access(shouldMount), shouldMount => handleStateChange(shouldMount), {
    defer: true
  }));
  onCleanup(() => {
    if (isServer) {
      return;
    }
    window.clearTimeout(timeoutId);
  });
  return {
    keepMounted,
    style
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/70e7caf1946c423bc9aa9cb0e50dbdbe953d239b/packages/@react-aria/label/src/useField.ts
 */

const FORM_CONTROL_PROP_NAMES = ["id", "name", "validationState", "required", "disabled", "readOnly"];
function createFormControl(props) {
  const defaultId = `form-control-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [labelId, setLabelId] = createSignal();
  const [fieldId, setFieldId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const [errorMessageId, setErrorMessageId] = createSignal();
  const getAriaLabelledBy = (fieldId, fieldAriaLabel, fieldAriaLabelledBy) => {
    const hasAriaLabelledBy = fieldAriaLabelledBy != null || labelId() != null;
    return [fieldAriaLabelledBy, labelId(),
    // If there is both an aria-label and aria-labelledby, add the field itself has an aria-labelledby
    hasAriaLabelledBy && fieldAriaLabel != null ? fieldId : undefined].filter(Boolean).join(" ") || undefined;
  };
  const getAriaDescribedBy = fieldAriaDescribedBy => {
    return [descriptionId(),
    // Use aria-describedby for error message because aria-errormessage is unsupported using VoiceOver or NVDA.
    // See https://github.com/adobe/react-spectrum/issues/1346#issuecomment-740136268
    errorMessageId(), fieldAriaDescribedBy].filter(Boolean).join(" ") || undefined;
  };
  const dataset = createMemo(() => ({
    "data-valid": access(props.validationState) === "valid" ? "" : undefined,
    "data-invalid": access(props.validationState) === "invalid" ? "" : undefined,
    "data-required": access(props.required) ? "" : undefined,
    "data-disabled": access(props.disabled) ? "" : undefined,
    "data-readonly": access(props.readOnly) ? "" : undefined
  }));
  const formControlContext = {
    name: () => access(props.name) ?? access(props.id),
    dataset,
    validationState: () => access(props.validationState),
    isRequired: () => access(props.required),
    isDisabled: () => access(props.disabled),
    isReadOnly: () => access(props.readOnly),
    labelId,
    fieldId,
    descriptionId,
    errorMessageId,
    getAriaLabelledBy,
    getAriaDescribedBy,
    generateId: createGenerateId(() => access(props.id)),
    registerLabel: createRegisterId(setLabelId),
    registerField: createRegisterId(setFieldId),
    registerDescription: createRegisterId(setDescriptionId),
    registerErrorMessage: createRegisterId(setErrorMessageId)
  };
  return {
    formControlContext
  };
}

const FormControlContext = createContext();
function useFormControlContext() {
  const context = useContext(FormControlContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useFormControlContext` must be used within a `FormControlContext.Provider` component");
  }
  return context;
}

const FORM_CONTROL_FIELD_PROP_NAMES = ["id", "aria-label", "aria-labelledby", "aria-describedby"];
function createFormControlField(props) {
  const context = useFormControlContext();
  props = mergeDefaultProps({
    id: context.generateId("field")
  }, props);
  createEffect(() => onCleanup(context.registerField(access(props.id))));
  return {
    fieldProps: {
      id: () => access(props.id),
      ariaLabel: () => access(props["aria-label"]),
      ariaLabelledBy: () => context.getAriaLabelledBy(access(props.id), access(props["aria-label"]), access(props["aria-labelledby"])),
      ariaDescribedBy: () => context.getAriaDescribedBy(access(props["aria-describedby"]))
    }
  };
}

/* -------------------------------------------------------------------------------------------------
 * Polymorphic
 * -----------------------------------------------------------------------------------------------*/

/**
 * A utility component that render either a direct `<As>` child or its `as` prop.
 */
function Polymorphic(props) {
  const [local, others] = splitProps(props, ["asChild", "as", "children"]);

  // Prevent the extra computation below when "as child" polymorphism is not needed.
  if (!local.asChild) {
    return createComponent(Dynamic, mergeProps$1({
      get component() {
        return local.as;
      }
    }, others, {
      get children() {
        return local.children;
      }
    }));
  }
  const resolvedChildren = children(() => local.children);

  // Single child is `As`.
  if (isAs(resolvedChildren())) {
    const combinedProps = combineProps(others, resolvedChildren()?.props ?? {});
    return createComponent(Dynamic, combinedProps);
  }

  // Multiple children, find an `As` if any.
  if (isArray(resolvedChildren())) {
    const newElement = resolvedChildren().find(isAs);
    if (newElement) {
      // because the new element will be the one rendered, we are only interested
      // in grabbing its children (`newElement.props.children`)
      const newChildren = () => createComponent(For, {
        get each() {
          return resolvedChildren();
        },
        children: child => createComponent(Show, {
          when: child === newElement,
          fallback: child,
          get children() {
            return newElement.props.children;
          }
        })
      });
      const combinedProps = combineProps(others, newElement?.props ?? {});
      return createComponent(Dynamic, mergeProps$1(combinedProps, {
        children: newChildren
      }));
    }
  }
  throw new Error("[kobalte]: Component is expected to render `asChild` but no children `As` component was found.");
}

/* -------------------------------------------------------------------------------------------------
 * As
 * -----------------------------------------------------------------------------------------------*/

const AS_COMPONENT_SYMBOL = Symbol("$$KobalteAsComponent");

/**
 * A utility component used to delegate rendering of its `Polymorphic` parent component.
 */
function As(props) {
  return {
    [AS_COMPONENT_SYMBOL]: true,
    props
  };
}

/* -------------------------------------------------------------------------------------------------
 * Utils
 * -----------------------------------------------------------------------------------------------*/

function isAs(component) {
  return component?.[AS_COMPONENT_SYMBOL] === true;
}
function combineProps(baseProps, overrideProps) {
  return combineProps$1([baseProps, overrideProps], {
    reverseEventHandlers: true
  });
}

/**
 * The description that gives the user more information on the form control.
 */
function FormControlDescription(props) {
  const context = useFormControlContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  createEffect(() => onCleanup(context.registerDescription(props.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, () => context.dataset(), props));
}

/**
 * The error message that gives the user information about how to fix a validation error on the form control.
 */
function FormControlErrorMessage(props) {
  const context = useFormControlContext();
  props = mergeDefaultProps({
    id: context.generateId("error-message")
  }, props);
  const [local, others] = splitProps(props, ["forceMount"]);
  const isInvalid = () => context.validationState() === "invalid";
  createEffect(() => {
    if (!isInvalid()) {
      return;
    }
    onCleanup(context.registerErrorMessage(others.id));
  });
  return createComponent(Show, {
    get when() {
      return local.forceMount || isInvalid();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div"
      }, () => context.dataset(), others));
    }
  });
}

/**
 * The label that gives the user information on the form control.
 */
function FormControlLabel(props) {
  let ref;
  const context = useFormControlContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  const [local, others] = splitProps(props, ["ref"]);
  const tagName = createTagName(() => ref, () => "label");
  createEffect(() => onCleanup(context.registerLabel(others.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "label",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get ["for"]() {
      return memo(() => tagName() === "label")() ? context.fieldId() : undefined;
    }
  }, () => context.dataset(), others));
}

const COMMON_INTL_MESSAGES = {
  "ar-AE": {
    dismiss: "تجاهل"
  },
  "bg-BG": {
    dismiss: "Отхвърляне"
  },
  "cs-CZ": {
    dismiss: "Odstranit"
  },
  "da-DK": {
    dismiss: "Luk"
  },
  "de-DE": {
    dismiss: "Schließen"
  },
  "el-GR": {
    dismiss: "Απόρριψη"
  },
  "en-US": {
    dismiss: "Dismiss"
  },
  "es-ES": {
    dismiss: "Descartar"
  },
  "et-EE": {
    dismiss: "Lõpeta"
  },
  "fi-FI": {
    dismiss: "Hylkää"
  },
  "fr-FR": {
    dismiss: "Rejeter"
  },
  "he-IL": {
    dismiss: "התעלם"
  },
  "hr-HR": {
    dismiss: "Odbaci"
  },
  "hu-HU": {
    dismiss: "Elutasítás"
  },
  "it-IT": {
    dismiss: "Ignora"
  },
  "ja-JP": {
    dismiss: "閉じる"
  },
  "ko-KR": {
    dismiss: "무시"
  },
  "lt-LT": {
    dismiss: "Atmesti"
  },
  "lv-LV": {
    dismiss: "Nerādīt"
  },
  "nb-NO": {
    dismiss: "Lukk"
  },
  "nl-NL": {
    dismiss: "Negeren"
  },
  "pl-PL": {
    dismiss: "Zignoruj"
  },
  "pt-BR": {
    dismiss: "Descartar"
  },
  "pt-PT": {
    dismiss: "Dispensar"
  },
  "ro-RO": {
    dismiss: "Revocare"
  },
  "ru-RU": {
    dismiss: "Пропустить"
  },
  "sk-SK": {
    dismiss: "Zrušiť"
  },
  "sl-SI": {
    dismiss: "Opusti"
  },
  "sr-SP": {
    dismiss: "Odbaci"
  },
  "sv-SE": {
    dismiss: "Avvisa"
  },
  "tr-TR": {
    dismiss: "Kapat"
  },
  "uk-UA": {
    dismiss: "Скасувати"
  },
  "zh-CN": {
    dismiss: "取消"
  },
  "zh-TW": {
    dismiss: "關閉"
  }
};

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/i18n/src/utils.ts
 */

// https://en.wikipedia.org/wiki/Right-to-left
const RTL_SCRIPTS = new Set(["Avst", "Arab", "Armi", "Syrc", "Samr", "Mand", "Thaa", "Mend", "Nkoo", "Adlm", "Rohg", "Hebr"]);
const RTL_LANGS = new Set(["ae", "ar", "arc", "bcc", "bqi", "ckb", "dv", "fa", "glk", "he", "ku", "mzn", "nqo", "pnb", "ps", "sd", "ug", "ur", "yi"]);

/**
 * Determines if a locale is read right to left using [Intl.Locale]
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale}.
 */
function isRTL(locale) {
  // If the Intl.Locale API is available, use it to get the script for the locale.
  // This is more accurate than guessing by language, since languages can be written in multiple scripts.
  if (Intl.Locale) {
    const script = new Intl.Locale(locale).maximize().script ?? "";
    return RTL_SCRIPTS.has(script);
  }

  // If not, just guess by the language (first part of the locale)
  const lang = locale.split("-")[0];
  return RTL_LANGS.has(lang);
}
function getReadingDirection(locale) {
  return isRTL(locale) ? "rtl" : "ltr";
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/i18n/src/useDefaultLocale.ts
 */

/**
 * Gets the locale setting of the browser.
 */
function getDefaultLocale() {
  let locale =
  // @ts-ignore
  typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage) || "en-US";
  try {
    Intl.DateTimeFormat.supportedLocalesOf([locale]);
  } catch (_err) {
    locale = "en-US";
  }
  return {
    locale,
    direction: getReadingDirection(locale)
  };
}
let currentLocale = getDefaultLocale();
const listeners = new Set();
function updateLocale() {
  currentLocale = getDefaultLocale();
  for (const listener of listeners) {
    listener(currentLocale);
  }
}

/**
 * Returns an accessor for the current browser/system language, and updates when it changes.
 */
function createDefaultLocale() {
  // We cannot determine the browser's language on the server, so default to en-US.
  // This will be updated after hydration on the client to the correct value.
  const defaultSSRLocale = {
    locale: "en-US",
    direction: "ltr"
  };
  const [defaultClientLocale, setDefaultClientLocale] = createSignal(currentLocale);
  const defaultLocale = createMemo(() => isServer ? defaultSSRLocale : defaultClientLocale());
  onMount(() => {
    if (listeners.size === 0) {
      window.addEventListener("languagechange", updateLocale);
    }
    listeners.add(setDefaultClientLocale);
    onCleanup(() => {
      listeners.delete(setDefaultClientLocale);
      if (listeners.size === 0) {
        window.removeEventListener("languagechange", updateLocale);
      }
    });
  });
  return {
    locale: () => defaultLocale().locale,
    direction: () => defaultLocale().direction
  };
}

const I18nContext = createContext();

/**
 * Provides the locale for the application to all child components.
 */
function I18nProvider(props) {
  const defaultLocale = createDefaultLocale();
  const context = {
    locale: () => props.locale ?? defaultLocale.locale(),
    direction: () => props.locale ? getReadingDirection(props.locale) : defaultLocale.direction()
  };
  return createComponent(I18nContext.Provider, {
    value: context,
    get children() {
      return props.children;
    }
  });
}

/**
 * Returns an accessor for the current locale and layout direction.
 */
function useLocale() {
  const defaultLocale = createDefaultLocale();
  const context = useContext(I18nContext);
  return context || defaultLocale;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/i18n/src/useCollator.ts
 */

const cache$1 = new Map();

/**
 * Provides localized string collation for the current locale. Automatically updates when the locale changes,
 * and handles caching of the collator for performance.
 * @param options - Collator options.
 */
function createCollator(options) {
  const {
    locale
  } = useLocale();
  const cacheKey = createMemo(() => {
    return locale() + (options ? Object.entries(options).sort((a, b) => a[0] < b[0] ? -1 : 1).join() : "");
  });
  return createMemo(() => {
    const key = cacheKey();
    let collator;
    if (cache$1.has(key)) {
      collator = cache$1.get(key);
    }
    if (!collator) {
      collator = new Intl.Collator(locale(), options);
      cache$1.set(key, collator);
    }
    return collator;
  });
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/15e101b74966bd5eb719c6529ce71ce57eaed430/packages/@react-aria/i18n/src/useDateFormatter.ts
 */

/**
 * Provides localized date formatting for the current locale. Automatically updates when the locale changes,
 * and handles caching of the date formatter for performance.
 * @param options - Formatting options.
 */
function createDateFormatter(options) {
  const {
    locale
  } = useLocale();
  return createMemo(() => new DateFormatter(locale(), access(options)));
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/22cb32d329e66c60f55d4fc4025d1d44bb015d71/packages/@react-aria/i18n/src/useFilter.ts
 */

/**
 * Provides localized string search functionality that is useful for filtering or matching items
 * in a list. Options can be provided to adjust the sensitivity to case, diacritics, and other parameters.
 */
function createFilter(options) {
  const collator = createCollator({
    usage: "search",
    ...options
  });

  // TODO: these methods don't currently support the ignorePunctuation option.

  const startsWith = (str, substr) => {
    if (substr.length === 0) {
      return true;
    }

    // Normalize both strings so we can slice safely
    // TODO: take into account the ignorePunctuation option as well...
    str = str.normalize("NFC");
    substr = substr.normalize("NFC");
    return collator().compare(str.slice(0, substr.length), substr) === 0;
  };
  const endsWith = (str, substr) => {
    if (substr.length === 0) {
      return true;
    }
    str = str.normalize("NFC");
    substr = substr.normalize("NFC");
    return collator().compare(str.slice(-substr.length), substr) === 0;
  };
  const contains = (str, substr) => {
    if (substr.length === 0) {
      return true;
    }
    str = str.normalize("NFC");
    substr = substr.normalize("NFC");
    let scan = 0;
    const sliceLen = substr.length;
    for (; scan + sliceLen <= str.length; scan++) {
      const slice = str.slice(scan, scan + sliceLen);
      if (collator().compare(substr, slice) === 0) {
        return true;
      }
    }
    return false;
  };
  return {
    startsWith,
    endsWith,
    contains
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/23c3a91e7b87952f07da9da115188bd2abd99d77/packages/@react-aria/i18n/src/useMessageFormatter.ts
 */

const cache = new WeakMap();
function getCachedDictionary(strings) {
  let dictionary = cache.get(strings);
  if (!dictionary) {
    dictionary = new MessageDictionary(strings);
    cache.set(strings, dictionary);
  }
  return dictionary;
}

/**
 * Handles formatting ICU Message strings to create localized strings for the current locale.
 * Automatically updates when the locale changes, and handles caching of messages for performance.
 * @param strings - A mapping of languages to strings by key.
 */
function createMessageFormatter(strings) {
  const {
    locale
  } = useLocale();
  const messageFormatter = createMemo(() => {
    return new MessageFormatter(locale(), getCachedDictionary(access(strings)));
  });

  // Re-export as a new object with narrowed type for the `format()` method.
  return createMemo(() => ({
    format: (key, variables) => messageFormatter().format(key, variables)
  }));
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/b35d5c02fe900badccd0cf1a8f23bb593419f238/packages/@react-aria/i18n/src/useNumberFormatter.ts
 */


/**
 * Provides localized number formatting for the current locale. Automatically updates when the locale changes,
 * and handles caching of the number formatter for performance.
 * @param options - Formatting options.
 */
function createNumberFormatter(options) {
  const {
    locale
  } = useLocale();
  return createMemo(() => new NumberFormatter(locale(), access(options)));
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/selection/src/Selection.ts
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/selection/src/types.ts
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-types/shared/src/selection.d.ts
 */

/**
 * A Selection is a special Set containing Keys, which also has an anchor
 * and current selected key for use when range selecting.
 */
class Selection extends Set {
  constructor(keys, anchorKey, currentKey) {
    super(keys);
    if (keys instanceof Selection) {
      this.anchorKey = anchorKey || keys.anchorKey;
      this.currentKey = currentKey || keys.currentKey;
    } else {
      this.anchorKey = anchorKey;
      this.currentKey = currentKey;
    }
  }
}

/**
 * Creates a simple reactive `Selection` state with a getter, setter and a fallback value of an empty selection,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableSelectionSignal(props) {
  const [_value, setValue] = createControllableSignal(props);
  const value = () => _value() ?? new Selection();
  return [value, setValue];
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/utils.ts
 */

function isNonContiguousSelectionModifier(e) {
  // Ctrl + Arrow Up/Arrow Down has a system-wide meaning on macOS, so use Alt instead.
  // On Windows and Ubuntu, Alt + Space has a system-wide meaning.
  return isAppleDevice() ? e.altKey : e.ctrlKey;
}
function isCtrlKeyPressed(e) {
  if (isMac()) {
    return e.metaKey;
  }
  return e.ctrlKey;
}
function convertSelection(selection) {
  return new Selection(selection);
}
function isSameSelection(setA, setB) {
  if (setA.size !== setB.size) {
    return false;
  }
  for (const item of setA) {
    if (!setB.has(item)) {
      return false;
    }
  }
  return true;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/selection/src/useMultipleSelectionState.ts
 */

/**
 * Manages state for multiple selection and focus in a collection.
 */
function createMultipleSelectionState(props) {
  props = mergeDefaultProps({
    selectionMode: "none",
    selectionBehavior: "toggle"
  }, props);
  const [isFocused, setFocused] = createSignal(false);
  const [focusedKey, setFocusedKey] = createSignal();
  const selectedKeysProp = createMemo(() => {
    const selection = access(props.selectedKeys);
    if (selection != null) {
      return convertSelection(selection);
    }
    return selection;
  });
  const defaultSelectedKeys = createMemo(() => {
    const defaultSelection = access(props.defaultSelectedKeys);
    if (defaultSelection != null) {
      return convertSelection(defaultSelection);
    }
    return new Selection();
  });
  const [selectedKeys, _setSelectedKeys] = createControllableSelectionSignal({
    value: selectedKeysProp,
    defaultValue: defaultSelectedKeys,
    onChange: value => props.onSelectionChange?.(value)
  });
  const [selectionBehavior, setSelectionBehavior] = createSignal(access(props.selectionBehavior));
  const selectionMode = () => access(props.selectionMode);
  const disallowEmptySelection = () => access(props.disallowEmptySelection) ?? false;
  const setSelectedKeys = keys => {
    if (access(props.allowDuplicateSelectionEvents) || !isSameSelection(keys, selectedKeys())) {
      _setSelectedKeys(keys);
    }
  };

  // If the selectionBehavior prop is set to replace, but the current state is toggle (e.g. due to long press
  // to enter selection mode on touch), and the selection becomes empty, reset the selection behavior.
  createEffect(() => {
    const selection = selectedKeys();
    if (access(props.selectionBehavior) === "replace" && selectionBehavior() === "toggle" && typeof selection === "object" && selection.size === 0) {
      setSelectionBehavior("replace");
    }
  });

  // If the selectionBehavior prop changes, update the state as well.
  createEffect(() => {
    setSelectionBehavior(access(props.selectionBehavior) ?? "toggle");
  });
  return {
    selectionMode,
    disallowEmptySelection,
    selectionBehavior,
    setSelectionBehavior,
    isFocused,
    setFocused,
    focusedKey,
    setFocusedKey,
    selectedKeys,
    setSelectedKeys
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/useTypeSelect.ts
 */

/**
 * Handles typeahead interactions with collections.
 */
function createTypeSelect(props) {
  const [search, setSearch] = createSignal("");
  const [timeoutId, setTimeoutId] = createSignal(-1);
  const onKeyDown = e => {
    if (access(props.isDisabled)) {
      return;
    }
    const delegate = access(props.keyboardDelegate);
    const manager = access(props.selectionManager);
    if (!delegate.getKeyForSearch) {
      return;
    }
    const character = getStringForKey(e.key);
    if (!character || e.ctrlKey || e.metaKey) {
      return;
    }

    // Do not propagate the Space bar event if it's meant to be part of the search.
    // When we time out, the search term becomes empty, hence the check on length.
    // Trimming is to account for the case of pressing the Space bar more than once,
    // which should cycle through the selection/deselection of the focused item.
    if (character === " " && search().trim().length > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
    let newSearch = setSearch(prev => prev += character);

    // Use the delegate to find a key to focus.
    // Prioritize items after the currently focused item, falling back to searching the whole list.
    let key = delegate.getKeyForSearch(newSearch, manager.focusedKey()) ?? delegate.getKeyForSearch(newSearch);

    // If not key found, and the search is multiple iterations of the same letter (e.g "aaa"),
    // then cycle through first-letter matches
    if (key == null && isAllSameLetter(newSearch)) {
      newSearch = newSearch[0];
      key = delegate.getKeyForSearch(newSearch, manager.focusedKey()) ?? delegate.getKeyForSearch(newSearch);
    }
    if (key != null) {
      manager.setFocusedKey(key);
      props.onTypeSelect?.(key);
    }
    clearTimeout(timeoutId());
    setTimeoutId(window.setTimeout(() => setSearch(""), 500));
  };
  return {
    typeSelectHandlers: {
      onKeyDown
    }
  };
}
function getStringForKey(key) {
  // If the key is of length 1, it is an ASCII value.
  // Otherwise, if there are no ASCII characters in the key name,
  // it is a Unicode character.
  // See https://www.w3.org/TR/uievents-key/
  if (key.length === 1 || !/^[A-Z]/i.test(key)) {
    return key;
  }
  return "";
}
function isAllSameLetter(search) {
  return search.split("").every(letter => letter === search[0]);
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/useSelectableCollection.ts
 */

/**
 * Handles interactions with selectable collections.
 * @param props Props for the collection.
 * @param ref The ref attached to the element representing the collection.
 * @param scrollRef The ref attached to the scrollable body. Used to provide automatic scrolling on item focus for non-virtualized collections. If not provided, defaults to the collection ref.
 */
function createSelectableCollection(props, ref, scrollRef) {
  const defaultProps = {
    selectOnFocus: () => access(props.selectionManager).selectionBehavior() === "replace"
  };
  props = mergeProps(defaultProps, props);
  const finalScrollRef = () => scrollRef?.() ?? ref();
  const {
    direction
  } = useLocale();

  // Store the scroll position, so we can restore it later.
  let scrollPos = {
    top: 0,
    left: 0
  };
  createEventListener(() => !access(props.isVirtualized) ? finalScrollRef() : undefined, "scroll", () => {
    const scrollEl = finalScrollRef();
    if (!scrollEl) {
      return;
    }
    scrollPos = {
      top: scrollEl.scrollTop,
      left: scrollEl.scrollLeft
    };
  });
  const {
    typeSelectHandlers
  } = createTypeSelect({
    isDisabled: () => access(props.disallowTypeAhead),
    keyboardDelegate: () => access(props.keyboardDelegate),
    selectionManager: () => access(props.selectionManager)
  });
  const onKeyDown = e => {
    callHandler(e, typeSelectHandlers.onKeyDown);

    // Prevent option + tab from doing anything since it doesn't move focus to the cells, only buttons/checkboxes
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
    }
    const refEl = ref();

    // Keyboard events bubble through portals. Don't handle keyboard events
    // for elements outside the collection (e.g. menus).
    if (!refEl?.contains(e.target)) {
      return;
    }
    const manager = access(props.selectionManager);
    const selectOnFocus = access(props.selectOnFocus);
    const navigateToKey = key => {
      if (key != null) {
        manager.setFocusedKey(key);
        if (e.shiftKey && manager.selectionMode() === "multiple") {
          manager.extendSelection(key);
        } else if (selectOnFocus && !isNonContiguousSelectionModifier(e)) {
          manager.replaceSelection(key);
        }
      }
    };
    const delegate = access(props.keyboardDelegate);
    const shouldFocusWrap = access(props.shouldFocusWrap);
    const focusedKey = manager.focusedKey();
    switch (e.key) {
      case "ArrowDown":
        {
          if (delegate.getKeyBelow) {
            e.preventDefault();
            let nextKey;
            if (focusedKey != null) {
              nextKey = delegate.getKeyBelow(focusedKey);
            } else {
              nextKey = delegate.getFirstKey?.();
            }
            if (nextKey == null && shouldFocusWrap) {
              nextKey = delegate.getFirstKey?.(focusedKey);
            }
            navigateToKey(nextKey);
          }
          break;
        }
      case "ArrowUp":
        {
          if (delegate.getKeyAbove) {
            e.preventDefault();
            let nextKey;
            if (focusedKey != null) {
              nextKey = delegate.getKeyAbove(focusedKey);
            } else {
              nextKey = delegate.getLastKey?.();
            }
            if (nextKey == null && shouldFocusWrap) {
              nextKey = delegate.getLastKey?.(focusedKey);
            }
            navigateToKey(nextKey);
          }
          break;
        }
      case "ArrowLeft":
        {
          if (delegate.getKeyLeftOf) {
            e.preventDefault();
            const isRTL = direction() === "rtl";
            let nextKey;
            if (focusedKey != null) {
              nextKey = delegate.getKeyLeftOf(focusedKey);
            } else {
              nextKey = isRTL ? delegate.getFirstKey?.() : delegate.getLastKey?.();
            }
            navigateToKey(nextKey);
          }
          break;
        }
      case "ArrowRight":
        {
          if (delegate.getKeyRightOf) {
            e.preventDefault();
            const isRTL = direction() === "rtl";
            let nextKey;
            if (focusedKey != null) {
              nextKey = delegate.getKeyRightOf(focusedKey);
            } else {
              nextKey = isRTL ? delegate.getLastKey?.() : delegate.getFirstKey?.();
            }
            navigateToKey(nextKey);
          }
          break;
        }
      case "Home":
        if (delegate.getFirstKey) {
          e.preventDefault();
          const firstKey = delegate.getFirstKey(focusedKey, isCtrlKeyPressed(e));
          if (firstKey != null) {
            manager.setFocusedKey(firstKey);
            if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode() === "multiple") {
              manager.extendSelection(firstKey);
            } else if (selectOnFocus) {
              manager.replaceSelection(firstKey);
            }
          }
        }
        break;
      case "End":
        if (delegate.getLastKey) {
          e.preventDefault();
          const lastKey = delegate.getLastKey(focusedKey, isCtrlKeyPressed(e));
          if (lastKey != null) {
            manager.setFocusedKey(lastKey);
            if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode() === "multiple") {
              manager.extendSelection(lastKey);
            } else if (selectOnFocus) {
              manager.replaceSelection(lastKey);
            }
          }
        }
        break;
      case "PageDown":
        if (delegate.getKeyPageBelow && focusedKey != null) {
          e.preventDefault();
          const nextKey = delegate.getKeyPageBelow(focusedKey);
          navigateToKey(nextKey);
        }
        break;
      case "PageUp":
        if (delegate.getKeyPageAbove && focusedKey != null) {
          e.preventDefault();
          const nextKey = delegate.getKeyPageAbove(focusedKey);
          navigateToKey(nextKey);
        }
        break;
      case "a":
        if (isCtrlKeyPressed(e) && manager.selectionMode() === "multiple" && access(props.disallowSelectAll) !== true) {
          e.preventDefault();
          manager.selectAll();
        }
        break;
      case "Escape":
        if (!e.defaultPrevented) {
          e.preventDefault();
          if (!access(props.disallowEmptySelection)) {
            manager.clearSelection();
          }
        }
        break;
      case "Tab":
        {
          if (!access(props.allowsTabNavigation)) {
            // There may be elements that are "tabbable" inside a collection (e.g. in a grid cell).
            // However, collections should be treated as a single tab stop, with arrow key navigation internally.
            // We don't control the rendering of these, so we can't override the tabIndex to prevent tabbing.
            // Instead, we handle the Tab key, and move focus manually to the first/last tabbable element
            // in the collection, so that the browser default behavior will apply starting from that element
            // rather than the currently focused one.
            if (e.shiftKey) {
              refEl.focus();
            } else {
              const walker = getFocusableTreeWalker(refEl, {
                tabbable: true
              });
              let next;
              let last;
              do {
                last = walker.lastChild();
                if (last) {
                  next = last;
                }
              } while (last);
              if (next && !next.contains(document.activeElement)) {
                focusWithoutScrolling(next);
              }
            }
            break;
          }
        }
    }
  };
  const onFocusIn = e => {
    const manager = access(props.selectionManager);
    const delegate = access(props.keyboardDelegate);
    const selectOnFocus = access(props.selectOnFocus);
    if (manager.isFocused()) {
      // If a focus event bubbled through a portal, reset focus state.
      if (!e.currentTarget.contains(e.target)) {
        manager.setFocused(false);
      }
      return;
    }

    // Focus events can bubble through portals. Ignore these events.
    if (!e.currentTarget.contains(e.target)) {
      return;
    }
    manager.setFocused(true);
    if (manager.focusedKey() == null) {
      const navigateToFirstKey = key => {
        if (key == null) {
          return;
        }
        manager.setFocusedKey(key);
        if (selectOnFocus) {
          manager.replaceSelection(key);
        }
      };

      // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
      // Attempt to detect whether the user is tabbing forward or backward into the collection
      // and either focus the first or last item accordingly.
      const relatedTarget = e.relatedTarget;
      if (relatedTarget && e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING) {
        navigateToFirstKey(manager.lastSelectedKey() ?? delegate.getLastKey?.());
      } else {
        navigateToFirstKey(manager.firstSelectedKey() ?? delegate.getFirstKey?.());
      }
    } else if (!access(props.isVirtualized)) {
      const scrollEl = finalScrollRef();
      if (scrollEl) {
        // Restore the scroll position to what it was before.
        scrollEl.scrollTop = scrollPos.top;
        scrollEl.scrollLeft = scrollPos.left;

        // Refocus and scroll the focused item into view if it exists within the scrollable region.
        const element = scrollEl.querySelector(`[data-key="${manager.focusedKey()}"]`);
        if (element) {
          // This prevents a flash of focus on the first/last element in the collection
          focusWithoutScrolling(element);
          scrollIntoView(scrollEl, element);
        }
      }
    }
  };
  const onFocusOut = e => {
    const manager = access(props.selectionManager);

    // Don't set blurred and then focused again if moving focus within the collection.
    if (!e.currentTarget.contains(e.relatedTarget)) {
      manager.setFocused(false);
    }
  };
  const onMouseDown = e => {
    // Ignore events that bubbled through portals.
    if (finalScrollRef() === e.target) {
      // Prevent focus going to the collection when clicking on the scrollbar.
      e.preventDefault();
    }
  };
  const tryAutoFocus = () => {
    const autoFocus = access(props.autoFocus);
    if (!autoFocus) {
      return;
    }
    const manager = access(props.selectionManager);
    const delegate = access(props.keyboardDelegate);
    let focusedKey;

    // Check focus strategy to determine which item to focus
    if (autoFocus === "first") {
      focusedKey = delegate.getFirstKey?.();
    }
    if (autoFocus === "last") {
      focusedKey = delegate.getLastKey?.();
    }

    // If there are any selected keys, make the first one the new focus target
    const selectedKeys = manager.selectedKeys();
    if (selectedKeys.size) {
      focusedKey = selectedKeys.values().next().value;
    }
    manager.setFocused(true);
    manager.setFocusedKey(focusedKey);
    const refEl = ref();

    // If no default focus key is selected, focus the collection itself.
    if (refEl && focusedKey == null && !access(props.shouldUseVirtualFocus)) {
      focusWithoutScrolling(refEl);
    }
  };
  onMount(() => {
    if (props.deferAutoFocus) {
      setTimeout(tryAutoFocus, 0); // TODO: does this work EVERY time ?
    } else {
      tryAutoFocus();
    }
  });

  // If not virtualized, scroll the focused element into view when the focusedKey changes.
  // When virtualized, the Virtualizer should handle this.
  createEffect(on([finalScrollRef, () => access(props.isVirtualized), () => access(props.selectionManager).focusedKey()], newValue => {
    const [scrollEl, isVirtualized, focusedKey] = newValue;
    if (isVirtualized) {
      focusedKey && props.scrollToKey?.(focusedKey);
    } else {
      if (focusedKey && scrollEl) {
        const element = scrollEl.querySelector(`[data-key="${focusedKey}"]`);
        if (element) {
          scrollIntoView(scrollEl, element);
        }
      }
    }
  }));

  // If nothing is focused within the collection, make the collection itself tabbable.
  // This will be marshalled to either the first or last item depending on where focus came from.
  // If using virtual focus, don't set a tabIndex at all so that VoiceOver on iOS 14 doesn't try
  // to move real DOM focus to the element anyway.
  const tabIndex = createMemo(() => {
    if (access(props.shouldUseVirtualFocus)) {
      return undefined;
    }
    return access(props.selectionManager).focusedKey() == null ? 0 : -1;
  });
  return {
    tabIndex,
    onKeyDown,
    onMouseDown,
    onFocusIn,
    onFocusOut
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/useSelectableItem.ts
 */

/**
 * Handles interactions with an item in a selectable collection.
 * @param props Props for the item.
 * @param ref Ref to the item.
 */
function createSelectableItem(props, ref) {
  const manager = () => access(props.selectionManager);
  const key = () => access(props.key);
  const shouldUseVirtualFocus = () => access(props.shouldUseVirtualFocus);
  const onSelect = e => {
    if (manager().selectionMode() === "none") {
      return;
    }
    if (manager().selectionMode() === "single") {
      if (manager().isSelected(key()) && !manager().disallowEmptySelection()) {
        manager().toggleSelection(key());
      } else {
        manager().replaceSelection(key());
      }
    } else if (e && e.shiftKey) {
      manager().extendSelection(key());
    } else if (manager().selectionBehavior() === "toggle" || isCtrlKeyPressed(e) || "pointerType" in e && e.pointerType === "touch") {
      // if touch then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
      manager().toggleSelection(key());
    } else {
      manager().replaceSelection(key());
    }
  };
  const isSelected = () => manager().isSelected(key());

  // With checkbox selection, onAction (i.e. navigation) becomes primary, and occurs on a single click of the row.
  // Clicking the checkbox enters selection mode, after which clicking anywhere on any row toggles selection for that row.
  // With highlight selection, onAction is secondary, and occurs on double click. Single click selects the row.
  // With touch, onAction occurs on single tap, and long press enters selection mode.
  const isDisabled = () => access(props.disabled) || manager().isDisabled(key());
  const allowsSelection = () => !isDisabled() && manager().canSelectItem(key());
  let pointerDownType = null;
  const onPointerDown = e => {
    if (!allowsSelection()) {
      return;
    }
    pointerDownType = e.pointerType;

    // Selection occurs on mouse down (main button).
    if (e.pointerType === "mouse" && e.button === 0 && !access(props.shouldSelectOnPressUp)) {
      onSelect(e);
    }
  };

  // By default, selection occurs on pointer down. This can be strange if selecting an
  // item causes the UI to disappear immediately (e.g. menus).
  // If shouldSelectOnPressUp is true, we use onPointerUp instead of onPointerDown.
  const onPointerUp = e => {
    if (!allowsSelection()) {
      return;
    }

    // If allowsDifferentPressOrigin, make selection happen on mouse up (main button).
    // Otherwise, have selection happen on click.
    if (e.pointerType === "mouse" && e.button === 0 && access(props.shouldSelectOnPressUp) && access(props.allowsDifferentPressOrigin)) {
      onSelect(e);
    }
  };
  const onClick = e => {
    if (!allowsSelection()) {
      return;
    }

    // If not allowsDifferentPressOrigin or pointerType is touch/pen, make selection happen on click.
    if (access(props.shouldSelectOnPressUp) && !access(props.allowsDifferentPressOrigin) || pointerDownType !== "mouse") {
      onSelect(e);
    }
  };

  // For keyboard events, selection occurs on key down (Enter or Space bar).
  const onKeyDown = e => {
    if (!allowsSelection() || !["Enter", " "].includes(e.key)) {
      return;
    }
    if (isNonContiguousSelectionModifier(e)) {
      manager().toggleSelection(key());
    } else {
      onSelect(e);
    }
  };
  const onMouseDown = e => {
    if (isDisabled()) {
      // Prevent focus going to the body when clicking on a disabled item.
      e.preventDefault();
    }
  };
  const onFocus = e => {
    const refEl = ref();
    if (shouldUseVirtualFocus() || isDisabled() || !refEl) {
      return;
    }
    if (e.target === refEl) {
      manager().setFocusedKey(key());
    }
  };

  // Set tabIndex to 0 if the element is focused,
  // or -1 otherwise so that only the last focused item is tabbable.
  // If using virtual focus, don't set a tabIndex at all so that VoiceOver
  // on iOS 14 doesn't try to move real DOM focus to the item anyway.
  const tabIndex = createMemo(() => {
    if (shouldUseVirtualFocus() || isDisabled()) {
      return undefined;
    }
    return key() === manager().focusedKey() ? 0 : -1;
  });

  // data-attribute used in selection manager and keyboard delegate
  const dataKey = createMemo(() => {
    return access(props.virtualized) ? undefined : key();
  });

  // Focus the associated DOM node when this item becomes the focusedKey.
  createEffect(on([ref, key, shouldUseVirtualFocus, () => manager().focusedKey(), () => manager().isFocused()], ([refEl, key, shouldUseVirtualFocus, focusedKey, isFocused]) => {
    if (refEl && key === focusedKey && isFocused && !shouldUseVirtualFocus && document.activeElement !== refEl) {
      if (props.focus) {
        props.focus();
      } else {
        focusWithoutScrolling(refEl);
      }
    }
  }));
  return {
    isSelected,
    isDisabled,
    allowsSelection,
    tabIndex,
    dataKey,
    onPointerDown,
    onPointerUp,
    onClick,
    onKeyDown,
    onMouseDown,
    onFocus
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/selection/src/SelectionManager.ts
 */


/**
 * An interface for reading and updating multiple selection state.
 */
class SelectionManager {
  constructor(collection, state) {
    this.collection = collection;
    this.state = state;
  }

  /** The type of selection that is allowed in the collection. */
  selectionMode() {
    return this.state.selectionMode();
  }

  /** Whether the collection allows empty selection. */
  disallowEmptySelection() {
    return this.state.disallowEmptySelection();
  }

  /** The selection behavior for the collection. */
  selectionBehavior() {
    return this.state.selectionBehavior();
  }

  /** Sets the selection behavior for the collection. */
  setSelectionBehavior(selectionBehavior) {
    this.state.setSelectionBehavior(selectionBehavior);
  }

  /** Whether the collection is currently focused. */
  isFocused() {
    return this.state.isFocused();
  }

  /** Sets whether the collection is focused. */
  setFocused(isFocused) {
    this.state.setFocused(isFocused);
  }

  /** The current focused key in the collection. */
  focusedKey() {
    return this.state.focusedKey();
  }

  /** Sets the focused key. */
  setFocusedKey(key) {
    if (key == null || this.collection().getItem(key)) {
      this.state.setFocusedKey(key);
    }
  }

  /** The currently selected keys in the collection. */
  selectedKeys() {
    return this.state.selectedKeys();
  }

  /** Returns whether a key is selected. */
  isSelected(key) {
    if (this.state.selectionMode() === "none") {
      return false;
    }
    const retrievedKey = this.getKey(key);
    if (retrievedKey == null) {
      return false;
    }
    return this.state.selectedKeys().has(retrievedKey);
  }

  /** Whether the selection is empty. */
  isEmpty() {
    return this.state.selectedKeys().size === 0;
  }

  /** Whether all items in the collection are selected. */
  isSelectAll() {
    if (this.isEmpty()) {
      return false;
    }
    const selectedKeys = this.state.selectedKeys();
    return this.getAllSelectableKeys().every(k => selectedKeys.has(k));
  }
  firstSelectedKey() {
    let first;
    for (const key of this.state.selectedKeys()) {
      const item = this.collection().getItem(key);
      const isItemBeforeFirst = item?.index != null && first?.index != null && item.index < first.index;
      if (!first || isItemBeforeFirst) {
        first = item;
      }
    }
    return first?.key;
  }
  lastSelectedKey() {
    let last;
    for (const key of this.state.selectedKeys()) {
      const item = this.collection().getItem(key);
      const isItemAfterLast = item?.index != null && last?.index != null && item.index > last.index;
      if (!last || isItemAfterLast) {
        last = item;
      }
    }
    return last?.key;
  }

  /** Extends the selection to the given key. */
  extendSelection(toKey) {
    if (this.selectionMode() === "none") {
      return;
    }
    if (this.selectionMode() === "single") {
      this.replaceSelection(toKey);
      return;
    }
    const retrievedToKey = this.getKey(toKey);
    if (retrievedToKey == null) {
      return;
    }
    const selectedKeys = this.state.selectedKeys();
    const anchorKey = selectedKeys.anchorKey || retrievedToKey;
    const selection = new Selection(selectedKeys, anchorKey, retrievedToKey);
    for (const key of this.getKeyRange(anchorKey, selectedKeys.currentKey || retrievedToKey)) {
      selection.delete(key);
    }
    for (const key of this.getKeyRange(retrievedToKey, anchorKey)) {
      if (this.canSelectItem(key)) {
        selection.add(key);
      }
    }
    this.state.setSelectedKeys(selection);
  }
  getKeyRange(from, to) {
    const fromItem = this.collection().getItem(from);
    const toItem = this.collection().getItem(to);
    if (fromItem && toItem) {
      if (fromItem.index != null && toItem.index != null && fromItem.index <= toItem.index) {
        return this.getKeyRangeInternal(from, to);
      }
      return this.getKeyRangeInternal(to, from);
    }
    return [];
  }
  getKeyRangeInternal(from, to) {
    const keys = [];
    let key = from;
    while (key != null) {
      const item = this.collection().getItem(key);
      if (item && item.type === "item") {
        keys.push(key);
      }
      if (key === to) {
        return keys;
      }
      key = this.collection().getKeyAfter(key);
    }
    return [];
  }
  getKey(key) {
    const item = this.collection().getItem(key);
    if (!item) {
      return key;
    }
    if (!item || item.type !== "item") {
      return null;
    }
    return item.key;
  }

  /** Toggles whether the given key is selected. */
  toggleSelection(key) {
    if (this.selectionMode() === "none") {
      return;
    }
    if (this.selectionMode() === "single" && !this.isSelected(key)) {
      this.replaceSelection(key);
      return;
    }
    const retrievedKey = this.getKey(key);
    if (retrievedKey == null) {
      return;
    }
    const keys = new Selection(this.state.selectedKeys());
    if (keys.has(retrievedKey)) {
      keys.delete(retrievedKey);
    } else if (this.canSelectItem(retrievedKey)) {
      keys.add(retrievedKey);
      keys.anchorKey = retrievedKey;
      keys.currentKey = retrievedKey;
    }
    if (this.disallowEmptySelection() && keys.size === 0) {
      return;
    }
    this.state.setSelectedKeys(keys);
  }

  /** Replaces the selection with only the given key. */
  replaceSelection(key) {
    if (this.selectionMode() === "none") {
      return;
    }
    const retrievedKey = this.getKey(key);
    if (retrievedKey == null) {
      return;
    }
    const selection = this.canSelectItem(retrievedKey) ? new Selection([retrievedKey], retrievedKey, retrievedKey) : new Selection();
    this.state.setSelectedKeys(selection);
  }

  /** Replaces the selection with the given keys. */
  setSelectedKeys(keys) {
    if (this.selectionMode() === "none") {
      return;
    }
    const selection = new Selection();
    for (const key of keys) {
      const retrievedKey = this.getKey(key);
      if (retrievedKey != null) {
        selection.add(retrievedKey);
        if (this.selectionMode() === "single") {
          break;
        }
      }
    }
    this.state.setSelectedKeys(selection);
  }

  /** Selects all items in the collection. */
  selectAll() {
    if (this.selectionMode() === "multiple") {
      this.state.setSelectedKeys(new Set(this.getAllSelectableKeys()));
    }
  }

  /**
   * Removes all keys from the selection.
   */
  clearSelection() {
    const selectedKeys = this.state.selectedKeys();
    if (!this.disallowEmptySelection() && selectedKeys.size > 0) {
      this.state.setSelectedKeys(new Selection());
    }
  }

  /**
   * Toggles between select all and an empty selection.
   */
  toggleSelectAll() {
    if (this.isSelectAll()) {
      this.clearSelection();
    } else {
      this.selectAll();
    }
  }
  select(key, e) {
    if (this.selectionMode() === "none") {
      return;
    }
    if (this.selectionMode() === "single") {
      if (this.isSelected(key) && !this.disallowEmptySelection()) {
        this.toggleSelection(key);
      } else {
        this.replaceSelection(key);
      }
    } else if (this.selectionBehavior() === "toggle" || e && e.pointerType === "touch") {
      // if touch then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
      this.toggleSelection(key);
    } else {
      this.replaceSelection(key);
    }
  }

  /** Returns whether the current selection is equal to the given selection. */
  isSelectionEqual(selection) {
    if (selection === this.state.selectedKeys()) {
      return true;
    }

    // Check if the set of keys match.
    const selectedKeys = this.selectedKeys();
    if (selection.size !== selectedKeys.size) {
      return false;
    }
    for (const key of selection) {
      if (!selectedKeys.has(key)) {
        return false;
      }
    }
    for (const key of selectedKeys) {
      if (!selection.has(key)) {
        return false;
      }
    }
    return true;
  }
  canSelectItem(key) {
    if (this.state.selectionMode() === "none") {
      return false;
    }
    const item = this.collection().getItem(key);
    return item != null && !item.disabled;
  }
  isDisabled(key) {
    const item = this.collection().getItem(key);
    return !item || item.disabled;
  }
  getAllSelectableKeys() {
    const keys = [];
    const addKeys = key => {
      while (key != null) {
        if (this.canSelectItem(key)) {
          const item = this.collection().getItem(key);
          if (!item) {
            continue;
          }
          if (item.type === "item") {
            keys.push(key);
          }
        }
        key = this.collection().getKeyAfter(key);
      }
    };
    addKeys(this.collection().getFirstKey());
    return keys;
  }
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/list/src/ListCollection.ts
 */

class ListCollection {
  keyMap = new Map();
  constructor(nodes) {
    this.iterable = nodes;
    for (const node of nodes) {
      this.keyMap.set(node.key, node);
    }
    if (this.keyMap.size === 0) {
      return;
    }
    let last;
    let index = 0;
    for (const [key, node] of this.keyMap) {
      if (last) {
        last.nextKey = key;
        node.prevKey = last.key;
      } else {
        this.firstKey = key;
        node.prevKey = undefined;
      }
      if (node.type === "item") {
        node.index = index++;
      }
      last = node;

      // Set nextKey as undefined since this might be the last node
      // If it isn't the last node, last.nextKey will properly set at start of new loop
      last.nextKey = undefined;
    }
    this.lastKey = last.key;
  }
  *[Symbol.iterator]() {
    yield* this.iterable;
  }
  getSize() {
    return this.keyMap.size;
  }
  getKeys() {
    return this.keyMap.keys();
  }
  getKeyBefore(key) {
    return this.keyMap.get(key)?.prevKey;
  }
  getKeyAfter(key) {
    return this.keyMap.get(key)?.nextKey;
  }
  getFirstKey() {
    return this.firstKey;
  }
  getLastKey() {
    return this.lastKey;
  }
  getItem(key) {
    return this.keyMap.get(key);
  }
  at(idx) {
    const keys = [...this.getKeys()];
    return this.getItem(keys[idx]);
  }
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/bfce84fee12a027d9cbc38b43e1747e3e4b4b169/packages/@react-stately/list/src/useListState.ts
 */

/**
 * Provides state management for list-like components.
 * Handles building a collection of items from props, and manages multiple selection state.
 */
function createListState(props) {
  const selectionState = createMultipleSelectionState(props);
  const factory = nodes => {
    return props.filter ? new ListCollection(props.filter(nodes)) : new ListCollection(nodes);
  };
  const collection = createCollection({
    dataSource: () => access(props.dataSource),
    getKey: () => access(props.getKey),
    getTextValue: () => access(props.getTextValue),
    getDisabled: () => access(props.getDisabled),
    getSectionChildren: () => access(props.getSectionChildren),
    factory
  }, [() => props.filter]);
  const selectionManager = new SelectionManager(collection, selectionState);

  // Reset focused key if that item is deleted from the collection.
  createComputed(() => {
    const focusedKey = selectionState.focusedKey();
    if (focusedKey != null && !collection().getItem(focusedKey)) {
      selectionState.setFocusedKey(undefined);
    }
  });
  return {
    collection,
    selectionManager: () => selectionManager
  };
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/ListKeyboardDelegate.ts
 */

class ListKeyboardDelegate {
  constructor(collection, ref, collator) {
    this.collection = collection;
    this.ref = ref;
    this.collator = collator;
  }
  getKeyBelow(key) {
    let keyAfter = this.collection().getKeyAfter(key);
    while (keyAfter != null) {
      const item = this.collection().getItem(keyAfter);
      if (item && item.type === "item" && !item.disabled) {
        return keyAfter;
      }
      keyAfter = this.collection().getKeyAfter(keyAfter);
    }
  }
  getKeyAbove(key) {
    let keyBefore = this.collection().getKeyBefore(key);
    while (keyBefore != null) {
      const item = this.collection().getItem(keyBefore);
      if (item && item.type === "item" && !item.disabled) {
        return keyBefore;
      }
      keyBefore = this.collection().getKeyBefore(keyBefore);
    }
  }
  getFirstKey() {
    let key = this.collection().getFirstKey();
    while (key != null) {
      const item = this.collection().getItem(key);
      if (item && item.type === "item" && !item.disabled) {
        return key;
      }
      key = this.collection().getKeyAfter(key);
    }
  }
  getLastKey() {
    let key = this.collection().getLastKey();
    while (key != null) {
      const item = this.collection().getItem(key);
      if (item && item.type === "item" && !item.disabled) {
        return key;
      }
      key = this.collection().getKeyBefore(key);
    }
  }
  getItem(key) {
    return this.ref?.()?.querySelector(`[data-key="${key}"]`) ?? null;
  }

  // TODO: not working correctly
  getKeyPageAbove(key) {
    const menu = this.ref?.();
    let item = this.getItem(key);
    if (!menu || !item) {
      return;
    }
    const pageY = Math.max(0, item.offsetTop + item.offsetHeight - menu.offsetHeight);
    let keyAbove = key;
    while (keyAbove && item && item.offsetTop > pageY) {
      keyAbove = this.getKeyAbove(keyAbove);
      item = keyAbove != null ? this.getItem(keyAbove) : null;
    }
    return keyAbove;
  }

  // TODO: not working correctly
  getKeyPageBelow(key) {
    const menu = this.ref?.();
    let item = this.getItem(key);
    if (!menu || !item) {
      return;
    }
    const pageY = Math.min(menu.scrollHeight, item.offsetTop - item.offsetHeight + menu.offsetHeight);
    let keyBelow = key;
    while (keyBelow && item && item.offsetTop < pageY) {
      keyBelow = this.getKeyBelow(keyBelow);
      item = keyBelow != null ? this.getItem(keyBelow) : null;
    }
    return keyBelow;
  }
  getKeyForSearch(search, fromKey) {
    const collator = this.collator?.();
    if (!collator) {
      return;
    }

    // Prevent from getting the same key twice
    let key = fromKey != null ? this.getKeyBelow(fromKey) : this.getFirstKey();
    while (key != null) {
      const item = this.collection().getItem(key);
      if (item) {
        const substring = item.textValue.slice(0, search.length);
        if (item.textValue && collator.compare(substring, search) === 0) {
          return key;
        }
      }
      key = this.getKeyBelow(key);
    }
  }
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/selection/src/useSelectableList.ts
 */

/**
 * Handles interactions with a selectable list.
 * @param props Props for the list.
 * @param ref A ref to the list element.
 * @param scrollRef The ref attached to the scrollable body. Used to provide automatic scrolling on item focus for non-virtualized collections. If not provided, defaults to the collection ref.
 */
function createSelectableList(props, ref, scrollRef) {
  const collator = createCollator({
    usage: "search",
    sensitivity: "base"
  });

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  const delegate = createMemo(() => {
    const keyboardDelegate = access(props.keyboardDelegate);
    if (keyboardDelegate) {
      return keyboardDelegate;
    }
    return new ListKeyboardDelegate(props.collection, ref, collator);
  });
  return createSelectableCollection({
    selectionManager: () => access(props.selectionManager),
    keyboardDelegate: delegate,
    autoFocus: () => access(props.autoFocus),
    deferAutoFocus: () => access(props.deferAutoFocus),
    shouldFocusWrap: () => access(props.shouldFocusWrap),
    disallowEmptySelection: () => access(props.disallowEmptySelection),
    selectOnFocus: () => access(props.selectOnFocus),
    disallowTypeAhead: () => access(props.disallowTypeAhead),
    shouldUseVirtualFocus: () => access(props.shouldUseVirtualFocus),
    allowsTabNavigation: () => access(props.allowsTabNavigation),
    isVirtualized: () => access(props.isVirtualized),
    scrollToKey: key => access(props.scrollToKey)?.(key)
  }, ref, scrollRef);
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-stately/list/src/useSingleSelectListState.ts
 */

/**
 * Provides state management for list-like components with single selection.
 * Handles building a collection of items from props, and manages selection state.
 */
function createSingleSelectListState(props) {
  const [selectedKey, setSelectedKey] = createControllableSignal({
    value: () => access(props.selectedKey),
    defaultValue: () => access(props.defaultSelectedKey),
    onChange: value => props.onSelectionChange?.(value)
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
    onSelectionChange: keys => {
      const key = keys.values().next().value;

      // Always fire onSelectionChange, even if the key is the same
      // as the current key (createControllableSignal does not).
      if (key === selectedKey()) {
        props.onSelectionChange?.(key);
      }
      setSelectedKey(key);
    }
  });
  const {
    collection,
    selectionManager
  } = createListState(createListStateProps);
  const selectedItem = createMemo(() => {
    const selection = selectedKey();
    return selection != null ? collection().getItem(selection) : undefined;
  });
  return {
    collection,
    selectionManager,
    selectedKey,
    setSelectedKey,
    selectedItem
  };
}

const [state, setState] = createStore({
  toasts: []
});
function add(toast) {
  setState("toasts", prev => [...prev, toast]);
}
function get(id) {
  return state.toasts.find(toast => toast.id === id);
}
function update$1(id, toast) {
  const index = state.toasts.findIndex(toast => toast.id === id);
  if (index != -1) {
    setState("toasts", prev => [...prev.slice(0, index), toast, ...prev.slice(index + 1)]);
  }
}
function dismiss$1(id) {
  setState("toasts", toast => toast.id === id, "dismiss", true);
}
function remove(id) {
  setState("toasts", prev => prev.filter(toast => toast.id !== id));
}
function clear$1() {
  setState("toasts", []);
}
const toastStore = {
  toasts: () => state.toasts,
  add,
  get,
  update: update$1,
  dismiss: dismiss$1,
  remove,
  clear: clear$1
};

let toastsCounter = 0;

/** Adds a new toast to the visible toasts or queue depending on current state and limit, and return the id of the created toast. */
function show(toastComponent, options) {
  const id = toastsCounter++;
  toastStore.add({
    id,
    toastComponent,
    dismiss: false,
    update: false,
    region: options?.region
  });
  return id;
}

/** Update the toast of the given id with a new rendered component. */
function update(id, toastComponent) {
  toastStore.update(id, {
    id,
    toastComponent,
    dismiss: false,
    update: true
  });
}

/** Adds a new promise-based toast to the visible toasts or queue depending on current state and limit, and return the id of the created toast. */
function promise(promise, toastComponent, options) {
  const id = show(props => {
    return toastComponent({
      get toastId() {
        return props.toastId;
      },
      state: "pending"
    });
  }, options);
  (isFunction(promise) ? promise() : promise).then(data => update(id, props => {
    return toastComponent({
      get toastId() {
        return props.toastId;
      },
      state: "fulfilled",
      data
    });
  })).catch(error => update(id, props => {
    return toastComponent({
      get toastId() {
        return props.toastId;
      },
      state: "rejected",
      error
    });
  }));
  return id;
}

/** Removes toast with given id from visible toasts and queue. */
function dismiss(id) {
  toastStore.dismiss(id);
  return id;
}

/** Removes all toasts from visible toasts and queue. */
function clear() {
  toastStore.clear();
}

// User facing API.
const toaster = {
  show,
  update,
  promise,
  dismiss,
  clear
};

const CollapsibleContext = createContext();
function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCollapsibleContext` must be used within a `Collapsible.Root` component");
  }
  return context;
}

/**
 * Contains the content to be rendered when the collapsible is expanded.
 */
function CollapsibleContent(props) {
  let ref;
  const context = useCollapsibleContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "style"]);
  const presence = createPresence(() => context.shouldMount());
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);

  // When opening we want it to immediately open to retrieve dimensions.
  // When closing we delay `isPresent` to retrieve dimensions before closing.
  const isOpen = () => context.isOpen() || presence.isPresent();
  let isMountAnimationPrevented = isOpen();
  let originalStyles;
  onMount(() => {
    const raf = requestAnimationFrame(() => {
      isMountAnimationPrevented = false;
    });
    onCleanup(() => {
      cancelAnimationFrame(raf);
    });
  });
  createEffect(on(
  /**
   * depends on `presence.isPresent` because it will be `false` on
   * animation end (so when close finishes). This allows us to
   * retrieve the dimensions *before* closing.
   */
  [() => presence.isPresent()], () => {
    if (!ref) {
      return;
    }
    originalStyles = originalStyles || {
      transitionDuration: ref.style.transitionDuration,
      animationName: ref.style.animationName
    };

    // block any animations/transitions so the element renders at its full dimensions
    ref.style.transitionDuration = "0s";
    ref.style.animationName = "none";

    // get width and height from full dimensions
    const rect = ref.getBoundingClientRect();
    setHeight(rect.height);
    setWidth(rect.width);

    // kick off any animations/transitions that were originally set up if it isn't the initial mount
    if (!isMountAnimationPrevented) {
      ref.style.transitionDuration = originalStyles.transitionDuration;
      ref.style.animationName = originalStyles.animationName;
    }
  }));
  createEffect(() => onCleanup(context.registerContentId(local.id)));
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(el => {
            presence.setRef(el);
            ref = el;
          }, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        get id() {
          return local.id;
        },
        get style() {
          return {
            "--kb-collapsible-content-height": height() ? `${height()}px` : undefined,
            "--kb-collapsible-content-width": width() ? `${width()}px` : undefined,
            ...local.style
          };
        }
      }, () => context.dataset(), others));
    }
  });
}

/**
 * An interactive component which expands/collapses a content.
 */
function CollapsibleRoot(props) {
  const defaultId = `collapsible-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["open", "defaultOpen", "onOpenChange", "disabled", "forceMount"]);
  const [contentId, setContentId] = createSignal();
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined,
    "data-disabled": local.disabled ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    disabled: () => local.disabled ?? false,
    shouldMount: () => local.forceMount || disclosureState.isOpen(),
    contentId,
    toggle: disclosureState.toggle,
    generateId: createGenerateId(() => others.id),
    registerContentId: createRegisterId(setContentId)
  };
  return createComponent(CollapsibleContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div"
      }, dataset, others));
    }
  });
}

/*!
 * Portions of this file are based on code from ariakit
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the ariakit team:
 * https://github.com/hope-ui/hope-ui/blob/54125b130195f37161dbeeea0c21dc3b198bc3ac/packages/core/src/button/is-button.ts
 */

const BUTTON_INPUT_TYPES = ["button", "color", "file", "image", "reset", "submit"];

/**
 * Checks whether `element` is a native HTML button element.
 * @example
 * isButton(document.querySelector("button")); // true
 * isButton(document.querySelector("input[type='button']")); // true
 * isButton(document.querySelector("div")); // false
 * isButton(document.querySelector("input[type='text']")); // false
 * isButton(document.querySelector("div[role='button']")); // false
 */
function isButton(element) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "button") {
    return true;
  }
  if (tagName === "input" && element.type) {
    return BUTTON_INPUT_TYPES.indexOf(element.type) !== -1;
  }
  return false;
}

/**
 * Button enables users to trigger an action or event, such as submitting a form,
 * opening a dialog, canceling an action, or performing a delete operation.
 * This component is based on the [WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
 */
function ButtonRoot(props) {
  let ref;
  props = mergeDefaultProps({
    type: "button"
  }, props);
  const [local, others] = splitProps(props, ["ref", "type", "disabled"]);
  const tagName = createTagName(() => ref, () => "button");
  const isNativeButton = createMemo(() => {
    const elementTagName = tagName();
    if (elementTagName == null) {
      return false;
    }
    return isButton({
      tagName: elementTagName,
      type: local.type
    });
  });
  const isNativeInput = createMemo(() => {
    return tagName() === "input";
  });
  const isNativeLink = createMemo(() => {
    return tagName() === "a" && ref?.getAttribute("href") != null;
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "button",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get type() {
      return isNativeButton() || isNativeInput() ? local.type : undefined;
    },
    get role() {
      return !isNativeButton() && !isNativeLink() ? "button" : undefined;
    },
    get tabIndex() {
      return !isNativeButton() && !isNativeLink() && !local.disabled ? 0 : undefined;
    },
    get disabled() {
      return isNativeButton() || isNativeInput() ? local.disabled : undefined;
    },
    get ["aria-disabled"]() {
      return !isNativeButton() && !isNativeInput() && local.disabled ? true : undefined;
    },
    get ["data-disabled"]() {
      return local.disabled ? "" : undefined;
    }
  }, others));
}

var index$u = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: ButtonRoot
});

/**
 * The button that expands/collapses the collapsible content.
 */
function CollapsibleTrigger(props) {
  const context = useCollapsibleContext();
  const [local, others] = splitProps(props, ["onClick"]);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.toggle();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    get disabled() {
      return context.disabled();
    },
    onClick: onClick
  }, () => context.dataset(), others));
}

var index$t = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Content: CollapsibleContent,
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger
});

const AccordionItemContext = createContext();
function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useAccordionItemContext` must be used within a `Accordion.Item` component");
  }
  return context;
}

/**
 * Contains the content to be rendered when the `Accordion.Item` is expanded.
 */
function AccordionContent(props) {
  const itemContext = useAccordionItemContext();
  const defaultId = itemContext.generateId("content");
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["style"]);
  createEffect(() => onCleanup(itemContext.registerContentId(others.id)));
  return createComponent(CollapsibleContent, mergeProps$1({
    role: "region",
    get ["aria-labelledby"]() {
      return itemContext.triggerId();
    },
    get style() {
      return {
        "--kb-accordion-content-height": "var(--kb-collapsible-content-height)",
        "--kb-accordion-content-width": "var(--kb-collapsible-content-width)",
        ...local.style
      };
    }
  }, others));
}

/**
 * Wraps an `Accordion.Trigger`.
 * Use the `as` prop to update it to the appropriate heading level for your page.
 */
function AccordionHeader(props) {
  // `Accordion.Item` is a `Collapsible.Root`.
  const context = useCollapsibleContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "h3"
  }, () => context.dataset(), props));
}

const AccordionContext = createContext();
function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useAccordionContext` must be used within a `Accordion.Root` component");
  }
  return context;
}

/**
 * An item of the accordion, contains all the parts of a collapsible section.
 */
function AccordionItem(props) {
  const accordionContext = useAccordionContext();
  const defaultId = `${accordionContext.generateId("item")}-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["value", "disabled"]);
  const [triggerId, setTriggerId] = createSignal();
  const [contentId, setContentId] = createSignal();
  const selectionManager = () => accordionContext.listState().selectionManager();
  const isExpanded = () => {
    return selectionManager().isSelected(local.value);
  };
  const context = {
    value: () => local.value,
    triggerId,
    contentId,
    generateId: createGenerateId(() => others.id),
    registerTriggerId: createRegisterId(setTriggerId),
    registerContentId: createRegisterId(setContentId)
  };
  return createComponent(AccordionItemContext.Provider, {
    value: context,
    get children() {
      return createComponent(CollapsibleRoot, mergeProps$1({
        get open() {
          return isExpanded();
        },
        get disabled() {
          return local.disabled;
        }
      }, others));
    }
  });
}

const DomCollectionContext = createContext();
function useOptionalDomCollectionContext() {
  return useContext(DomCollectionContext);
}
function useDomCollectionContext() {
  const context = useOptionalDomCollectionContext();
  if (context === undefined) {
    throw new Error("[kobalte]: `useDomCollectionContext` must be used within a `DomCollectionProvider` component");
  }
  return context;
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/da142672eddefa99365773ced72171facc06fdcb/packages/ariakit/src/collection/collection-state.ts
 */

function isElementPreceding(a, b) {
  return Boolean(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
}
function findDOMIndex(items, item) {
  const itemEl = item.ref();
  if (!itemEl) {
    return -1;
  }
  let length = items.length;
  if (!length) {
    return -1;
  }

  // Most of the time, the new item will be added at the end of the list, so we
  // do a findIndex in reverse order, instead of wasting time searching the
  // index from the beginning.
  while (length--) {
    const currentItemEl = items[length]?.ref();
    if (!currentItemEl) {
      continue;
    }
    if (isElementPreceding(currentItemEl, itemEl)) {
      return length + 1;
    }
  }
  return 0;
}
function sortBasedOnDOMPosition(items) {
  const pairs = items.map((item, index) => [index, item]);
  let isOrderDifferent = false;
  pairs.sort(([indexA, a], [indexB, b]) => {
    const elementA = a.ref();
    const elementB = b.ref();
    if (elementA === elementB) {
      return 0;
    }
    if (!elementA || !elementB) {
      return 0;
    }

    // a before b
    if (isElementPreceding(elementA, elementB)) {
      if (indexA > indexB) {
        isOrderDifferent = true;
      }
      return -1;
    }

    // a after b
    if (indexA < indexB) {
      isOrderDifferent = true;
    }
    return 1;
  });
  if (isOrderDifferent) {
    return pairs.map(([_, item]) => item);
  }
  return items;
}
function setItemsBasedOnDOMPosition(items, setItems) {
  const sortedItems = sortBasedOnDOMPosition(items);
  if (items !== sortedItems) {
    setItems(sortedItems);
  }
}
function getCommonParent(items) {
  const firstItem = items[0];
  const lastItemEl = items[items.length - 1]?.ref();
  let parentEl = firstItem?.ref()?.parentElement;
  while (parentEl) {
    if (lastItemEl && parentEl.contains(lastItemEl)) {
      return parentEl;
    }
    parentEl = parentEl.parentElement;
  }
  return getDocument(parentEl).body;
}
function createTimeoutObserver(items, setItems) {
  createEffect(() => {
    const timeout = setTimeout(() => {
      setItemsBasedOnDOMPosition(items(), setItems);
    });
    onCleanup(() => clearTimeout(timeout));
  });
}
function createSortBasedOnDOMPosition(items, setItems) {
  // JSDOM doesn't support IntersectionObserver. See https://github.com/jsdom/jsdom/issues/2032
  if (typeof IntersectionObserver !== "function") {
    createTimeoutObserver(items, setItems);
    return;
  }
  let previousItems = [];
  createEffect(() => {
    const callback = () => {
      const hasPreviousItems = !!previousItems.length;
      previousItems = items();

      // We don't want to sort items if items have been just registered.
      if (!hasPreviousItems) {
        return;
      }
      setItemsBasedOnDOMPosition(items(), setItems);
    };
    const root = getCommonParent(items());
    const observer = new IntersectionObserver(callback, {
      root
    });
    items().forEach(item => {
      const itemEl = item.ref();
      if (itemEl) {
        observer.observe(itemEl);
      }
    });
    onCleanup(() => observer.disconnect());
  });
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/da142672eddefa99365773ced72171facc06fdcb/packages/ariakit/src/collection/collection.tsx
 * https://github.com/ariakit/ariakit/blob/da142672eddefa99365773ced72171facc06fdcb/packages/ariakit/src/collection/collection-state.ts
 * https://github.com/ariakit/ariakit/blob/da142672eddefa99365773ced72171facc06fdcb/packages/ariakit/src/collection/collection-item.ts
 */

function createDomCollection(props = {}) {
  const [items, setItems] = createControllableArraySignal({
    value: () => access(props.items),
    onChange: value => props.onItemsChange?.(value)
  });
  createSortBasedOnDOMPosition(items, setItems);
  const registerItem = item => {
    setItems(prevItems => {
      // Finds the item group based on the DOM hierarchy
      const index = findDOMIndex(prevItems, item);
      return addItemToArray(prevItems, item, index);
    });
    return () => {
      setItems(prevItems => {
        const nextItems = prevItems.filter(prevItem => prevItem.ref() !== item.ref());
        if (prevItems.length === nextItems.length) {
          // The item isn't registered, so do nothing
          return prevItems;
        }
        return nextItems;
      });
    };
  };
  const DomCollectionProvider = props => {
    return createComponent$1(DomCollectionContext.Provider, {
      value: {
        registerItem
      },
      get children() {
        return props.children;
      }
    });
  };
  return {
    DomCollectionProvider
  };
}

function createDomCollectionItem(props) {
  const context = useDomCollectionContext();
  props = mergeDefaultProps({
    shouldRegisterItem: true
  }, props);
  createEffect(() => {
    if (!props.shouldRegisterItem) {
      return;
    }
    const unregister = context.registerItem(props.getItem());
    onCleanup(unregister);
  });
}

/**
 * A vertically stacked set of interactive headings that each reveal an associated section of content.
 */
function AccordionRoot(props) {
  let ref;
  const defaultId = `accordion-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    multiple: false,
    collapsible: false,
    shouldFocusWrap: true
  }, props);
  const [local, others] = splitProps(props, ["ref", "value", "defaultValue", "onChange", "multiple", "collapsible", "shouldFocusWrap", "onKeyDown", "onMouseDown", "onFocusIn", "onFocusOut"]);
  const [items, setItems] = createSignal([]);
  const {
    DomCollectionProvider
  } = createDomCollection({
    items,
    onItemsChange: setItems
  });
  const listState = createListState({
    selectedKeys: () => local.value,
    defaultSelectedKeys: () => local.defaultValue,
    onSelectionChange: value => local.onChange?.(Array.from(value)),
    disallowEmptySelection: () => !local.multiple && !local.collapsible,
    selectionMode: () => local.multiple ? "multiple" : "single",
    dataSource: items
  });
  const selectableList = createSelectableList({
    selectionManager: () => listState.selectionManager(),
    collection: () => listState.collection(),
    disallowEmptySelection: () => listState.selectionManager().disallowEmptySelection(),
    shouldFocusWrap: () => local.shouldFocusWrap,
    disallowTypeAhead: true,
    allowsTabNavigation: true
  }, () => ref);
  const context = {
    listState: () => listState,
    generateId: createGenerateId(() => others.id)
  };
  return createComponent(DomCollectionProvider, {
    get children() {
      return createComponent(AccordionContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            ref(r$) {
              const _ref$ = mergeRefs(el => ref = el, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            get onKeyDown() {
              return composeEventHandlers([local.onKeyDown, selectableList.onKeyDown]);
            },
            get onMouseDown() {
              return composeEventHandlers([local.onMouseDown, selectableList.onMouseDown]);
            },
            get onFocusIn() {
              return composeEventHandlers([local.onFocusIn, selectableList.onFocusIn]);
            },
            get onFocusOut() {
              return composeEventHandlers([local.onFocusOut, selectableList.onFocusOut]);
            }
          }, others));
        }
      });
    }
  });
}

/**
 * Toggles the collapsed state of its associated item. It should be nested inside an `Accordion.Header`.
 */
function AccordionTrigger(props) {
  let ref;
  const accordionContext = useAccordionContext();
  const itemContext = useAccordionItemContext();
  const collapsibleContext = useCollapsibleContext();
  const defaultId = itemContext.generateId("trigger");
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["ref", "onPointerDown", "onPointerUp", "onClick", "onKeyDown", "onMouseDown", "onFocus"]);
  createDomCollectionItem({
    getItem: () => ({
      ref: () => ref,
      type: "item",
      key: itemContext.value(),
      textValue: "",
      // not applicable here
      disabled: collapsibleContext.disabled()
    })
  });
  const selectableItem = createSelectableItem({
    key: () => itemContext.value(),
    selectionManager: () => accordionContext.listState().selectionManager(),
    disabled: () => collapsibleContext.disabled(),
    shouldSelectOnPressUp: true
  }, () => ref);
  const onKeyDown = e => {
    // Prevent `Enter` and `Space` default behavior which fires a click event when using a <button>.
    if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
    }
    callHandler(e, local.onKeyDown);
    callHandler(e, selectableItem.onKeyDown);
  };
  createEffect(() => onCleanup(itemContext.registerTriggerId(others.id)));
  return createComponent(CollapsibleTrigger, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get ["data-key"]() {
      return selectableItem.dataKey();
    },
    get onPointerDown() {
      return composeEventHandlers([local.onPointerDown, selectableItem.onPointerDown]);
    },
    get onPointerUp() {
      return composeEventHandlers([local.onPointerUp, selectableItem.onPointerUp]);
    },
    get onClick() {
      return composeEventHandlers([local.onClick, selectableItem.onClick]);
    },
    onKeyDown: onKeyDown,
    get onMouseDown() {
      return composeEventHandlers([local.onMouseDown, selectableItem.onMouseDown]);
    },
    get onFocus() {
      return composeEventHandlers([local.onFocus, selectableItem.onFocus]);
    }
  }, others));
}

var index$s = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Content: AccordionContent,
  Header: AccordionHeader,
  Item: AccordionItem,
  Root: AccordionRoot,
  Trigger: AccordionTrigger
});

/**
 * Alert displays a brief, important message
 * in a way that attracts the user's attention without interrupting the user's task.
 */
function AlertRoot(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    role: "alert"
  }, props));
}

var index$r = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: AlertRoot
});

const DialogContext = createContext();
function useDialogContext() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useDialogContext` must be used within a `Dialog` component");
  }
  return context;
}

/**
 * The button that closes the dialog.
 */
function DialogCloseButton(props) {
  const context = useDialogContext();
  const [local, others] = splitProps(props, ["aria-label", "onClick"]);
  const messageFormatter = createMessageFormatter(() => COMMON_INTL_MESSAGES);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.close();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    get ["aria-label"]() {
      return local["aria-label"] || messageFormatter().format("dismiss");
    },
    onClick: onClick
  }, others));
}

const DismissableLayerContext = createContext();
function useOptionalDismissableLayerContext() {
  return useContext(DismissableLayerContext);
}

function DismissableLayer(props) {
  let ref;
  const parentContext = useOptionalDismissableLayerContext();
  const [local, others] = splitProps(props, ["ref", "disableOutsidePointerEvents", "excludedElements", "onEscapeKeyDown", "onPointerDownOutside", "onFocusOutside", "onInteractOutside", "onDismiss", "bypassTopMostLayerCheck"]);
  const nestedLayers = new Set([]);
  const registerNestedLayer = element => {
    nestedLayers.add(element);
    const parentUnregister = parentContext?.registerNestedLayer(element);
    return () => {
      nestedLayers.delete(element);
      parentUnregister?.();
    };
  };
  const shouldExcludeElement = element => {
    if (!ref) {
      return false;
    }
    return local.excludedElements?.some(node => contains(node(), element)) || [...nestedLayers].some(layer => contains(layer, element));
  };
  const onPointerDownOutside = e => {
    if (!ref || layerStack.isBelowPointerBlockingLayer(ref)) {
      return;
    }
    if (!local.bypassTopMostLayerCheck && !layerStack.isTopMostLayer(ref)) {
      return;
    }
    local.onPointerDownOutside?.(e);
    local.onInteractOutside?.(e);
    if (!e.defaultPrevented) {
      local.onDismiss?.();
    }
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);
    local.onInteractOutside?.(e);
    if (!e.defaultPrevented) {
      local.onDismiss?.();
    }
  };
  createInteractOutside({
    shouldExcludeElement,
    onPointerDownOutside,
    onFocusOutside
  }, () => ref);
  createEscapeKeyDown({
    ownerDocument: () => getDocument(ref),
    onEscapeKeyDown: e => {
      if (!ref || !layerStack.isTopMostLayer(ref)) {
        return;
      }
      local.onEscapeKeyDown?.(e);
      if (!e.defaultPrevented && local.onDismiss) {
        e.preventDefault();
        local.onDismiss();
      }
    }
  });
  onMount(() => {
    if (!ref) {
      return;
    }
    layerStack.addLayer({
      node: ref,
      isPointerBlocking: local.disableOutsidePointerEvents,
      dismiss: local.onDismiss
    });
    const unregisterFromParentLayer = parentContext?.registerNestedLayer(ref);
    layerStack.assignPointerEventToLayers();
    layerStack.disableBodyPointerEvents(ref);
    onCleanup(() => {
      if (!ref) {
        return;
      }
      layerStack.removeLayer(ref);
      unregisterFromParentLayer?.();

      // Re-assign pointer event to remaining layers.
      layerStack.assignPointerEventToLayers();
      layerStack.restoreBodyPointerEvents(ref);
    });
  });
  createEffect(on([() => ref, () => local.disableOutsidePointerEvents], ([ref, disableOutsidePointerEvents]) => {
    if (!ref) {
      return;
    }
    const layer = layerStack.find(ref);
    if (layer && layer.isPointerBlocking !== disableOutsidePointerEvents) {
      // Keep layer in sync with the prop.
      layer.isPointerBlocking = disableOutsidePointerEvents;

      // Update layers pointer-events since this layer "isPointerBlocking" has changed.
      layerStack.assignPointerEventToLayers();
    }
    if (disableOutsidePointerEvents) {
      layerStack.disableBodyPointerEvents(ref);
    }
    onCleanup(() => {
      layerStack.restoreBodyPointerEvents(ref);
    });
  }, {
    defer: true
  }));
  const context = {
    registerNestedLayer
  };
  return createComponent(DismissableLayerContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        }
      }, others));
    }
  });
}

/**
 * Contains the content to be rendered when the dialog is open.
 */
function DialogContent(props) {
  let ref;
  const context = useDialogContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "onOpenAutoFocus", "onCloseAutoFocus", "onPointerDownOutside", "onFocusOutside", "onInteractOutside"]);
  let hasInteractedOutside = false;
  let hasPointerDownOutside = false;
  const onPointerDownOutside = e => {
    local.onPointerDownOutside?.(e);

    // If the event is a right-click, we shouldn't close because
    // it is effectively as if we right-clicked the `Overlay`.
    if (context.modal() && e.detail.isContextMenu) {
      e.preventDefault();
    }
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);

    // When focus is trapped, a `focusout` event may still happen.
    // We make sure we don't trigger our `onDismiss` in such case.
    if (context.modal()) {
      e.preventDefault();
    }
  };
  const onInteractOutside = e => {
    local.onInteractOutside?.(e);
    if (context.modal()) {
      return;
    }

    // Non-modal behavior below

    if (!e.defaultPrevented) {
      hasInteractedOutside = true;
      if (e.detail.originalEvent.type === "pointerdown") {
        hasPointerDownOutside = true;
      }
    }

    // Prevent dismissing when clicking the trigger.
    // As the trigger is already setup to close, without doing so would
    // cause it to close and immediately open.
    if (contains(context.triggerRef(), e.target)) {
      e.preventDefault();
    }

    // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
    // we will get the pointer down outside event on the trigger, but then a subsequent
    // focus outside event on the container, we ignore any focus outside event when we've
    // already had a pointer down outside event.
    if (e.detail.originalEvent.type === "focusin" && hasPointerDownOutside) {
      e.preventDefault();
    }
  };
  const onCloseAutoFocus = e => {
    local.onCloseAutoFocus?.(e);
    if (context.modal()) {
      e.preventDefault();
      focusWithoutScrolling(context.triggerRef());
    } else {
      if (!e.defaultPrevented) {
        if (!hasInteractedOutside) {
          focusWithoutScrolling(context.triggerRef());
        }

        // Always prevent autofocus because we either focus manually or want user agent focus
        e.preventDefault();
      }
      hasInteractedOutside = false;
      hasPointerDownOutside = false;
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => !(context.isOpen() && context.modal()),
    targets: () => ref ? [ref] : []
  });
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isOpen() && (context.modal() || context.preventScroll()))
  });
  createFocusScope({
    trapFocus: () => context.isOpen() && context.modal(),
    onMountAutoFocus: local.onOpenAutoFocus,
    onUnmountAutoFocus: onCloseAutoFocus
  }, () => ref);
  createEffect(() => onCleanup(context.registerContentId(others.id)));
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(DismissableLayer, mergeProps$1({
        ref(r$) {
          const _ref$ = mergeRefs(el => {
            context.contentPresence.setRef(el);
            ref = el;
          }, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        role: "dialog",
        tabIndex: -1,
        get disableOutsidePointerEvents() {
          return memo(() => !!context.modal())() && context.isOpen();
        },
        get excludedElements() {
          return [context.triggerRef];
        },
        get ["aria-labelledby"]() {
          return context.titleId();
        },
        get ["aria-describedby"]() {
          return context.descriptionId();
        },
        get ["data-expanded"]() {
          return context.isOpen() ? "" : undefined;
        },
        get ["data-closed"]() {
          return !context.isOpen() ? "" : undefined;
        },
        onPointerDownOutside: onPointerDownOutside,
        onFocusOutside: onFocusOutside,
        onInteractOutside: onInteractOutside,
        get onDismiss() {
          return context.close;
        }
      }, others));
    }
  });
}

/**
 * An optional accessible description to be announced when the dialog is open.
 */
function DialogDescription(props) {
  const context = useDialogContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerDescriptionId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "p",
    get id() {
      return local.id;
    }
  }, others));
}

/**
 * A layer that covers the inert portion of the view when the dialog is open.
 */
function DialogOverlay(props) {
  const context = useDialogContext();
  const [local, others] = splitProps(props, ["ref", "style", "onPointerDown"]);
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // fixes a firefox issue that starts text selection https://bugzilla.mozilla.org/show_bug.cgi?id=1675846
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };
  return createComponent(Show, {
    get when() {
      return context.overlayPresence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(context.overlayPresence.setRef, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        get style() {
          return {
            "pointer-events": "auto",
            ...local.style
          };
        },
        get ["data-expanded"]() {
          return context.isOpen() ? "" : undefined;
        },
        get ["data-closed"]() {
          return !context.isOpen() ? "" : undefined;
        },
        onPointerDown: onPointerDown
      }, others));
    }
  });
}

/**
 * Portals its children into the `body` when the dialog is open.
 */
function DialogPortal(props) {
  const context = useDialogContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent() || context.overlayPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/**
 * A dialog is a window overlaid on either the primary window or another dialog window.
 */
function DialogRoot(props) {
  const defaultId = `dialog-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    modal: true,
    preventScroll: false
  }, props);
  const [contentId, setContentId] = createSignal();
  const [titleId, setTitleId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const disclosureState = createDisclosureState({
    open: () => props.open,
    defaultOpen: () => props.defaultOpen,
    onOpenChange: isOpen => props.onOpenChange?.(isOpen)
  });
  const shouldMount = () => props.forceMount || disclosureState.isOpen();
  const overlayPresence = createPresence(shouldMount);
  const contentPresence = createPresence(shouldMount);
  const context = {
    isOpen: disclosureState.isOpen,
    modal: () => props.modal ?? true,
    preventScroll: () => props.preventScroll ?? false,
    contentId,
    titleId,
    descriptionId,
    triggerRef,
    overlayPresence,
    contentPresence,
    close: disclosureState.close,
    toggle: disclosureState.toggle,
    setTriggerRef,
    generateId: createGenerateId(() => props.id),
    registerContentId: createRegisterId(setContentId),
    registerTitleId: createRegisterId(setTitleId),
    registerDescriptionId: createRegisterId(setDescriptionId)
  };
  return createComponent(DialogContext.Provider, {
    value: context,
    get children() {
      return props.children;
    }
  });
}

/**
 * An accessible title to be announced when the dialog is open.
 */
function DialogTitle(props) {
  const context = useDialogContext();
  props = mergeDefaultProps({
    id: context.generateId("title")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerTitleId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "h2",
    get id() {
      return local.id;
    }
  }, others));
}

/**
 * The button that opens the dialog.
 */
function DialogTrigger(props) {
  const context = useDialogContext();
  const [local, others] = splitProps(props, ["ref", "onClick"]);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.toggle();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    "aria-haspopup": "dialog",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    get ["data-expanded"]() {
      return context.isOpen() ? "" : undefined;
    },
    get ["data-closed"]() {
      return !context.isOpen() ? "" : undefined;
    },
    onClick: onClick
  }, others));
}

var index$q = /*#__PURE__*/Object.freeze({
  __proto__: null,
  CloseButton: DialogCloseButton,
  Content: DialogContent,
  Description: DialogDescription,
  Overlay: DialogOverlay,
  Portal: DialogPortal,
  Root: DialogRoot,
  Title: DialogTitle,
  Trigger: DialogTrigger
});

/**
 * Overrides the regular `Dialog.Content` with role="alertdialog" to interrupt the user.
 */
function AlertDialogContent(props) {
  return createComponent(DialogContent, mergeProps$1({
    role: "alertdialog"
  }, props));
}

var index$p = /*#__PURE__*/Object.freeze({
  __proto__: null,
  CloseButton: DialogCloseButton,
  Content: AlertDialogContent,
  Description: DialogDescription,
  Overlay: DialogOverlay,
  Portal: DialogPortal,
  Root: DialogRoot,
  Title: DialogTitle,
  Trigger: DialogTrigger
});

/**
 * Link allows a user to navigate to another page or resource within a web page or application.
 */
function LinkRoot(props) {
  let ref;
  const [local, others] = splitProps(props, ["ref", "type", "href", "disabled"]);
  const tagName = createTagName(() => ref, () => "a");
  return createComponent(Polymorphic, mergeProps$1({
    as: "a",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get role() {
      return tagName() !== "a" || local.disabled ? "link" : undefined;
    },
    get tabIndex() {
      return tagName() !== "a" && !local.disabled ? 0 : undefined;
    },
    get href() {
      return !local.disabled ? local.href : undefined;
    },
    get ["aria-disabled"]() {
      return local.disabled ? true : undefined;
    },
    get ["data-disabled"]() {
      return local.disabled ? "" : undefined;
    }
  }, others));
}

var index$o = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: LinkRoot
});

/**
 * The breadcrumbs link.
 */
function BreadcrumbsLink(props) {
  const [local, others] = splitProps(props, ["current", "disabled", "aria-current"]);
  const ariaCurrent = () => {
    if (!local.current) {
      return undefined;
    }
    return local["aria-current"] || "page";
  };
  return createComponent(LinkRoot, mergeProps$1({
    get disabled() {
      return local.disabled || local.current;
    },
    get ["aria-current"]() {
      return ariaCurrent();
    },
    get ["data-current"]() {
      return local.current ? "" : undefined;
    }
  }, others));
}

const BREADCRUMBS_INTL_MESSAGES = {
  "ar-AE": {
    breadcrumbs: "عناصر الواجهة"
  },
  "bg-BG": {
    breadcrumbs: "Трохи хляб"
  },
  "cs-CZ": {
    breadcrumbs: "Popis cesty"
  },
  "da-DK": {
    breadcrumbs: "Brødkrummer"
  },
  "de-DE": {
    breadcrumbs: "Breadcrumbs"
  },
  "el-GR": {
    breadcrumbs: "Πλοηγήσεις breadcrumb"
  },
  "en-US": {
    breadcrumbs: "Breadcrumbs"
  },
  "es-ES": {
    breadcrumbs: "Migas de pan"
  },
  "et-EE": {
    breadcrumbs: "Lingiread"
  },
  "fi-FI": {
    breadcrumbs: "Navigointilinkit"
  },
  "fr-FR": {
    breadcrumbs: "Chemin de navigation"
  },
  "he-IL": {
    breadcrumbs: "שבילי ניווט"
  },
  "hr-HR": {
    breadcrumbs: "Navigacijski putovi"
  },
  "hu-HU": {
    breadcrumbs: "Morzsamenü"
  },
  "it-IT": {
    breadcrumbs: "Breadcrumb"
  },
  "ja-JP": {
    breadcrumbs: "パンくずリスト"
  },
  "ko-KR": {
    breadcrumbs: "탐색 표시"
  },
  "lt-LT": {
    breadcrumbs: "Naršymo kelias"
  },
  "lv-LV": {
    breadcrumbs: "Atpakaļceļi"
  },
  "nb-NO": {
    breadcrumbs: "Navigasjonsstier"
  },
  "nl-NL": {
    breadcrumbs: "Broodkruimels"
  },
  "pl-PL": {
    breadcrumbs: "Struktura nawigacyjna"
  },
  "pt-BR": {
    breadcrumbs: "Caminho detalhado"
  },
  "pt-PT": {
    breadcrumbs: "Categorias"
  },
  "ro-RO": {
    breadcrumbs: "Miez de pâine"
  },
  "ru-RU": {
    breadcrumbs: "Навигация"
  },
  "sk-SK": {
    breadcrumbs: "Navigačné prvky Breadcrumbs"
  },
  "sl-SI": {
    breadcrumbs: "Drobtine"
  },
  "sr-SP": {
    breadcrumbs: "Putanje navigacije"
  },
  "sv-SE": {
    breadcrumbs: "Sökvägar"
  },
  "tr-TR": {
    breadcrumbs: "İçerik haritaları"
  },
  "uk-UA": {
    breadcrumbs: "Навігаційна стежка"
  },
  "zh-CN": {
    breadcrumbs: "导航栏"
  },
  "zh-TW": {
    breadcrumbs: "導覽列"
  }
};

const BreadcrumbsContext = createContext();
function useBreadcrumbsContext() {
  const context = useContext(BreadcrumbsContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useBreadcrumbsContext` must be used within a `Breadcrumbs.Root` component");
  }
  return context;
}

/**
 * Breadcrumbs show hierarchy and navigational context for a user’s location within an application.
 */
function BreadcrumbsRoot(props) {
  props = mergeDefaultProps({
    separator: "/"
  }, props);
  const [local, others] = splitProps(props, ["separator"]);
  const messageFormatter = createMessageFormatter(() => BREADCRUMBS_INTL_MESSAGES);
  const context = {
    separator: () => local.separator
  };
  return createComponent(BreadcrumbsContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "nav",
        get ["aria-label"]() {
          return messageFormatter().format("breadcrumbs");
        }
      }, others));
    }
  });
}

/**
 * The visual separator between each breadcrumb items.
 * It will not be visible by screen readers.
 */
function BreadcrumbsSeparator(props) {
  const context = useBreadcrumbsContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    get children() {
      return context.separator();
    },
    "aria-hidden": "true"
  }, props));
}

var index$n = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Link: BreadcrumbsLink,
  Root: BreadcrumbsRoot,
  Separator: BreadcrumbsSeparator
});

/**
 * Contains the calendar grids.
 */
function CalendarBody(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, props));
}

const CalendarContext = createContext();
function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCalendarContext` must be used within a `Calendar` component");
  }
  return context;
}

const CalendarGridContext = createContext();
function useCalendarGridContext() {
  const context = useContext(CalendarGridContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCalendarGridContext` must be used within a `Calendar.Grid` component");
  }
  return context;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/0a1d0cd4e1b2f77eed7c0ea08fce8a04f8de6921/packages/@react-stately/calendar/src/utils.ts
 *
 * Portions of this file are based on code from zag, based on code from react-spectrum.
 * MIT Licensed, Copyright (c) 2021 Chakra UI.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/zag/blob/main/packages/utilities/date-utils/src/pagination.ts
 */

/* -----------------------------------------------------------------------------
 * Constrain a date to a range
 * -----------------------------------------------------------------------------*/

function constrainStart(date, aligned, duration, locale, min, max) {
  if (min && date.compare(min) >= 0) {
    aligned = maxDate(aligned, alignStart(toCalendarDate(min), duration, locale));
  }
  if (max && date.compare(max) <= 0) {
    aligned = minDate(aligned, alignEnd(toCalendarDate(max), duration, locale));
  }
  return aligned;
}
function constrainValue(date, min, max) {
  if (min) {
    date = maxDate(date, toCalendarDate(min));
  }
  if (max) {
    date = minDate(date, toCalendarDate(max));
  }
  return date;
}

/* -----------------------------------------------------------------------------
 * Align date to start, center, or end of a duration
 * -----------------------------------------------------------------------------*/

function alignStart(date, duration, locale, min, max) {
  // align to the start of the largest unit
  let aligned = date;
  if (duration.years) {
    aligned = startOfYear(date);
  } else if (duration.months) {
    aligned = startOfMonth(date);
  } else if (duration.weeks) {
    aligned = startOfWeek(date, locale);
  }
  return constrainStart(date, aligned, duration, locale, min, max);
}
function alignCenter(date, duration, locale, min, max) {
  const halfDuration = {};
  for (const key in duration) {
    // @ts-ignore
    halfDuration[key] = Math.floor(duration[key] / 2);

    // @ts-ignore
    if (halfDuration[key] > 0 && duration[key] % 2 === 0) {
      // @ts-ignore
      halfDuration[key]--;
    }
  }
  const aligned = alignStart(date, duration, locale).subtract(halfDuration);
  return constrainStart(date, aligned, duration, locale, min, max);
}
function alignEnd(date, duration, locale, min, max) {
  const d = {
    ...duration
  };

  // subtract 1 from the smallest unit
  if (d.days) {
    d.days--;
  } else if (d.weeks) {
    d.weeks--;
  } else if (d.months) {
    d.months--;
  } else if (d.years) {
    d.years--;
  }
  const aligned = alignStart(date, duration, locale).subtract(d);
  return constrainStart(date, aligned, duration, locale, min, max);
}
function alignDate(date, alignment, duration, locale, min, max) {
  switch (alignment) {
    case "start":
      return alignStart(date, duration, locale, min, max);
    case "end":
      return alignEnd(date, duration, locale, min, max);
    case "center":
    default:
      return alignCenter(date, duration, locale, min, max);
  }
}

/* -----------------------------------------------------------------------------
 * Assertions
 * -----------------------------------------------------------------------------*/

function isDateInvalid(date, minValue, maxValue) {
  return date != null && (minValue != null && date.compare(minValue) < 0 || maxValue != null && date.compare(maxValue) > 0);
}
function isPreviousVisibleRangeInvalid(startDate, min, max) {
  const prevDate = startDate.subtract({
    days: 1
  });
  return isSameDay(prevDate, startDate) || isDateInvalid(prevDate, min, max);
}
function isNextVisibleRangeInvalid(endDate, min, max) {
  // Adding may return the same date if we reached the end of time
  // according to the calendar system (e.g. 9999-12-31).
  const nextDate = endDate.add({
    days: 1
  });
  return isSameDay(nextDate, endDate) || isDateInvalid(nextDate, min, max);
}

/* -----------------------------------------------------------------------------
 * Getters
 * -----------------------------------------------------------------------------*/

function getEndDate(startDate, duration) {
  const d = {
    ...duration
  };
  if (d.days) {
    d.days--;
  } else {
    d.days = -1;
  }
  return startDate.add(d);
}
function getAdjustedDateFn(visibleDuration, locale, min, max) {
  return function getDate(options) {
    const {
      startDate,
      focusedDate
    } = options;
    const endDate = getEndDate(startDate, visibleDuration);

    // If the focused date was moved to an invalid value, it can't be focused, so constrain it.
    if (isDateInvalid(focusedDate, min, max)) {
      return {
        startDate,
        endDate,
        focusedDate: constrainValue(focusedDate, min, max)
      };
    }
    if (focusedDate.compare(startDate) < 0) {
      return {
        startDate: alignEnd(focusedDate, visibleDuration, locale, min, max),
        endDate,
        focusedDate: constrainValue(focusedDate, min, max)
      };
    }
    if (focusedDate.compare(endDate) > 0) {
      return {
        startDate: alignStart(focusedDate, visibleDuration, locale, min, max),
        endDate,
        focusedDate: constrainValue(focusedDate, min, max)
      };
    }
    return {
      startDate,
      endDate,
      focusedDate: constrainValue(focusedDate, min, max)
    };
  };
}
function getUnitDuration(duration) {
  const unit = {
    ...duration
  };
  for (const key in unit) {
    // @ts-ignore
    unit[key] = 1;
  }
  return unit;
}
function getNextUnavailableDate(anchorDate, start, end, isDateUnavailableFn, dir) {
  let nextDate = anchorDate.add({
    days: dir
  });
  while ((dir < 0 ? nextDate.compare(start) >= 0 : nextDate.compare(end) <= 0) && !isDateUnavailableFn(nextDate)) {
    nextDate = nextDate.add({
      days: dir
    });
  }
  if (isDateUnavailableFn(nextDate)) {
    return nextDate.add({
      days: -dir
    });
  }
  return undefined;
}
function getPreviousAvailableDate(date, min, isDateUnavailable) {
  if (!isDateUnavailable) {
    return date;
  }
  while (date.compare(min) >= 0 && isDateUnavailable(date)) {
    date = date.subtract({
      days: 1
    });
  }
  if (date.compare(min) >= 0) {
    return date;
  }
}
function getEraFormat(date) {
  return date?.calendar.identifier === "gregory" && date.era === "BC" ? "short" : undefined;
}

/** Return the first value of the selection depending on the selection mode. */
function getFirstValueOfSelection(selectionMode, value) {
  let firstValue;
  if (selectionMode === "single") {
    firstValue = asSingleValue(value);
  } else if (selectionMode === "multiple") {
    firstValue = asArrayValue(value)?.[0];
  } else if (selectionMode === "range") {
    const {
      start
    } = asRangeValue(value) ?? {};
    firstValue = start;
  }
  return firstValue;
}

/** Return an array of values for the selection depending on the selection mode. */
function getArrayValueOfSelection(selectionMode, value) {
  let values = [];
  if (selectionMode === "single") {
    values = [asSingleValue(value)];
  } else if (selectionMode === "multiple") {
    values = asArrayValue(value) ?? [];
  } else if (selectionMode === "range") {
    const {
      start,
      end
    } = asRangeValue(value) ?? {};
    values = [start, end];
  }
  return values.filter(Boolean);
}

/* -----------------------------------------------------------------------------
 * Formatters
 * -----------------------------------------------------------------------------*/

function formatRange(dateFormatter, messageFormatter, start, end, timeZone) {
  const parts = dateFormatter.formatRangeToParts(start.toDate(timeZone), end.toDate(timeZone));

  // Find the separator between the start and end date. This is determined
  // by finding the last shared literal before the end range.
  let separatorIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.source === "shared" && part.type === "literal") {
      separatorIndex = i;
    } else if (part.source === "endRange") {
      break;
    }
  }

  // Now we can combine the parts into start and end strings.
  let startValue = "";
  let endValue = "";
  for (let i = 0; i < parts.length; i++) {
    if (i < separatorIndex) {
      startValue += parts[i].value;
    } else if (i > separatorIndex) {
      endValue += parts[i].value;
    }
  }
  return messageFormatter.format("dateRange", {
    startDate: startValue,
    endDate: endValue
  });
}

/* -----------------------------------------------------------------------------
 * Descriptions
 * -----------------------------------------------------------------------------*/

function getSelectedDateDescription(messageFormatter, value, timeZone) {
  const dateFormatter = createDateFormatter(() => ({
    weekday: "long",
    month: "long",
    year: "numeric",
    day: "numeric",
    era: getEraFormat(value),
    timeZone: timeZone
  }));
  return messageFormatter.format("selectedDateDescription", {
    date: dateFormatter().format(value.toDate(timeZone))
  });
}
function getSelectedDateRangeDescription(messageFormatter, highlightedRange, anchorDate, timeZone) {
  const start = highlightedRange.start;
  const end = highlightedRange.end;
  if (!anchorDate && start && end) {
    const dateFormatter = createDateFormatter(() => ({
      weekday: "long",
      month: "long",
      year: "numeric",
      day: "numeric",
      era: getEraFormat(start) || getEraFormat(end),
      timeZone: timeZone
    }));

    // Use a single date message if the start and end dates are the same day,
    // otherwise include both dates.
    if (isSameDay(start, end)) {
      const date = dateFormatter().format(start.toDate(timeZone));
      return messageFormatter.format("selectedDateDescription", {
        date
      });
    } else {
      const dateRange = formatRange(dateFormatter(), messageFormatter, start, end, timeZone);
      return messageFormatter.format("selectedRangeDescription", {
        dateRange
      });
    }
  }

  // No message if currently selecting a range, or there is nothing highlighted.
  return "";
}
function getVisibleRangeDescription(messageFormatter, startDate, endDate, timeZone, isAria) {
  const era = getEraFormat(startDate) || getEraFormat(endDate);
  const monthFormatter = createDateFormatter(() => ({
    month: "long",
    year: "numeric",
    era,
    calendar: startDate.calendar.identifier,
    timeZone
  }));
  const dateFormatter = createDateFormatter(() => ({
    month: "long",
    year: "numeric",
    day: "numeric",
    era,
    calendar: startDate.calendar.identifier,
    timeZone
  }));

  // Special case for month granularity. Format as a single month if only a
  // single month is visible, otherwise format as a range of months.
  if (isSameDay(startDate, startOfMonth(startDate))) {
    if (isSameDay(endDate, endOfMonth(startDate))) {
      return monthFormatter().format(startDate.toDate(timeZone));
    } else if (isSameDay(endDate, endOfMonth(endDate))) {
      if (isAria) {
        return formatRange(monthFormatter(), messageFormatter, startDate, endDate, timeZone);
      }
      return monthFormatter().formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
    }
  }
  if (isAria) {
    return formatRange(dateFormatter(), messageFormatter, startDate, endDate, timeZone);
  }
  return dateFormatter().formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
}

/* -----------------------------------------------------------------------------
 *  Pagination
 * -----------------------------------------------------------------------------*/

function getNextPage(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  const start = startDate.add(visibleDuration);
  return adjust({
    focusedDate: focusedDate.add(visibleDuration),
    startDate: alignStart(constrainStart(focusedDate, start, visibleDuration, locale, min, max), visibleDuration, locale)
  });
}
function getPreviousPage(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  const start = startDate.subtract(visibleDuration);
  return adjust({
    focusedDate: focusedDate.subtract(visibleDuration),
    startDate: alignStart(constrainStart(focusedDate, start, visibleDuration, locale, min, max), visibleDuration, locale)
  });
}
function getNextRow(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  if (visibleDuration.days) {
    return getNextPage(focusedDate, startDate, visibleDuration, locale, min, max);
  }
  if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: focusedDate.add({
        weeks: 1
      }),
      startDate
    });
  }
}
function getPreviousRow(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  if (visibleDuration.days) {
    return getPreviousPage(focusedDate, startDate, visibleDuration, locale, min, max);
  }
  if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: focusedDate.subtract({
        weeks: 1
      }),
      startDate
    });
  }
}
function getSectionStart(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  if (visibleDuration.days) {
    return adjust({
      focusedDate: startDate,
      startDate
    });
  }
  if (visibleDuration.weeks) {
    return adjust({
      focusedDate: startOfWeek(focusedDate, locale),
      startDate
    });
  }
  if (visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: startOfMonth(focusedDate),
      startDate
    });
  }
}
function getSectionEnd(focusedDate, startDate, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  const endDate = getEndDate(startDate, visibleDuration);
  if (visibleDuration.days) {
    return adjust({
      focusedDate: endDate,
      startDate
    });
  }
  if (visibleDuration.weeks) {
    return adjust({
      //@ts-expect-error - endOfWeek is loosely typed
      focusedDate: endOfWeek(focusedDate, locale),
      startDate
    });
  }
  if (visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: endOfMonth(focusedDate),
      startDate
    });
  }
}
function getNextSection(focusedDate, startDate, larger, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  if (!larger && !visibleDuration.days) {
    return adjust({
      focusedDate: focusedDate.add(getUnitDuration(visibleDuration)),
      startDate
    });
  }
  if (visibleDuration.days) {
    return getNextPage(focusedDate, startDate, visibleDuration, locale, min, max);
  }
  if (visibleDuration.weeks) {
    return adjust({
      focusedDate: focusedDate.add({
        months: 1
      }),
      startDate
    });
  }
  if (visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: focusedDate.add({
        years: 1
      }),
      startDate
    });
  }
}
function getPreviousSection(focusedDate, startDate, larger, visibleDuration, locale, min, max) {
  const adjust = getAdjustedDateFn(visibleDuration, locale, min, max);
  if (!larger && !visibleDuration.days) {
    return adjust({
      focusedDate: focusedDate.subtract(getUnitDuration(visibleDuration)),
      startDate
    });
  }
  if (visibleDuration.days) {
    return getPreviousPage(focusedDate, startDate, visibleDuration, locale, min, max);
  }
  if (visibleDuration.weeks) {
    return adjust({
      focusedDate: focusedDate.subtract({
        months: 1
      }),
      startDate
    });
  }
  if (visibleDuration.months || visibleDuration.years) {
    return adjust({
      focusedDate: focusedDate.subtract({
        years: 1
      }),
      startDate
    });
  }
}

/* -----------------------------------------------------------------------------
 *  Type narrowing
 * -----------------------------------------------------------------------------*/

/** Narrow the type of `value` to `DateValue`. */
function asSingleValue(value) {
  return value;
}

/** Narrow the type of `value` to `DateValue[]`. */
function asArrayValue(value) {
  return value;
}

/** Narrow the type of `value` to `RangeValue<DateValue>`. */
function asRangeValue(value) {
  return value;
}

/* -----------------------------------------------------------------------------
 *  Misc.
 * -----------------------------------------------------------------------------*/

function sortDates(values) {
  return values.sort((a, b) => a.compare(b));
}
function makeCalendarDateRange(start, end) {
  if (!start || !end) {
    return undefined;
  }
  if (end.compare(start) < 0) {
    [start, end] = [end, start];
  }
  return {
    start: toCalendarDate(start),
    end: toCalendarDate(end)
  };
}

/**
 * A calendar grid displays a single grid of days within a calendar or range calendar which
 * can be keyboard navigated and selected by the user.
 */
function CalendarGrid(props) {
  const rootContext = useCalendarContext();
  props = mergeDefaultProps({
    weekDayFormat: "short"
  }, props);
  const [local, others] = splitProps(props, ["offset", "weekDayFormat", "onKeyDown", "onFocusIn", "onFocusOut", "aria-label"]);
  const startDate = createMemo(() => {
    if (local.offset) {
      return rootContext.startDate().add(local.offset);
    }
    return rootContext.startDate();
  });
  const endDate = createMemo(() => endOfMonth(startDate()));
  const dayFormatter = createDateFormatter(() => ({
    weekday: local.weekDayFormat,
    timeZone: rootContext.timeZone()
  }));
  const weekDays = createMemo(() => {
    const firstDayOfWeek = startOfWeek(today(rootContext.timeZone()), rootContext.locale());
    return [...new Array(7).keys()].map(index => {
      const date = firstDayOfWeek.add({
        days: index
      });
      return dayFormatter().format(date.toDate(rootContext.timeZone()));
    });
  });
  const visibleRangeDescription = createMemo(() => {
    return getVisibleRangeDescription(rootContext.messageFormatter(), startDate(), endDate(), rootContext.timeZone(), true);
  });
  const ariaLabel = () => {
    return [local["aria-label"], visibleRangeDescription()].filter(Boolean).join(", ");
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        rootContext.selectFocusedDate();
        break;
      case "PageUp":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusPreviousSection(e.shiftKey);
        break;
      case "PageDown":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusNextSection(e.shiftKey);
        break;
      case "End":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusSectionEnd();
        break;
      case "Home":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusSectionStart();
        break;
      case "ArrowLeft":
        e.preventDefault();
        e.stopPropagation();
        if (rootContext.direction() === "rtl") {
          rootContext.focusNextDay();
        } else {
          rootContext.focusPreviousDay();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusPreviousRow();
        break;
      case "ArrowRight":
        e.preventDefault();
        e.stopPropagation();
        if (rootContext.direction() === "rtl") {
          rootContext.focusPreviousDay();
        } else {
          rootContext.focusNextDay();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        rootContext.focusNextRow();
        break;
      case "Escape":
        if (rootContext.selectionMode() === "range") {
          e.preventDefault();
          rootContext.setAnchorDate(undefined);
        }
        break;
    }
  };
  const onFocusIn = e => {
    callHandler(e, local.onFocusIn);
    rootContext.setIsFocused(true);
  };
  const onFocusOut = e => {
    callHandler(e, local.onFocusOut);
    rootContext.setIsFocused(false);
  };
  const context = {
    startDate,
    weekDays
  };
  return createComponent(CalendarGridContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "table",
        role: "grid",
        get ["aria-readonly"]() {
          return rootContext.isReadOnly() || undefined;
        },
        get ["aria-disabled"]() {
          return rootContext.isDisabled() || undefined;
        },
        get ["aria-multiselectable"]() {
          return rootContext.selectionMode() !== "single";
        },
        get ["aria-label"]() {
          return ariaLabel();
        },
        onKeyDown: onKeyDown,
        onFocusIn: onFocusIn,
        onFocusOut: onFocusOut
      }, others));
    }
  });
}

/**
 * A calendar grid body displays a grid of calendar cells within a month.
 */
function CalendarGridBody(props) {
  const rootContext = useCalendarContext();
  const context = useCalendarGridContext();
  const [local, others] = splitProps(props, ["children"]);
  const weekIndexes = createMemo(() => {
    const weeksInMonth = getWeeksInMonth(context.startDate(), rootContext.locale());
    return [...new Array(weeksInMonth).keys()];
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "tbody"
  }, others, {
    get children() {
      return createComponent(Index, {
        get each() {
          return weekIndexes();
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
}

const CalendarGridBodyCellContext = createContext();
function useCalendarGriBodyCellContext() {
  const context = useContext(CalendarGridBodyCellContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCalendarGriBodyCellContext` must be used within a `Calendar.GridBodyCell` component");
  }
  return context;
}

/**
 * A calendar grid body cell displays a date cell within a calendar grid which can be selected by the user.
 */
function CalendarGridBodyCell(props) {
  const rootContext = useCalendarContext();
  const [local, others] = splitProps(props, ["date", "disabled"]);
  const isSelected = createMemo(() => {
    return rootContext.isCellSelected(local.date);
  });
  const isFocused = createMemo(() => {
    return rootContext.isCellFocused(local.date);
  });
  const isDisabled = createMemo(() => {
    return local.disabled || rootContext.isCellDisabled(local.date);
  });
  const isUnavailable = createMemo(() => {
    return rootContext.isCellUnavailable(local.date);
  });
  const isSelectable = () => {
    return !rootContext.isReadOnly() && !isDisabled() && !isUnavailable();
  };
  const isInvalid = createMemo(() => {
    return rootContext.validationState() === "invalid" && isSelected();
  });
  const isDateToday = () => isToday(local.date, rootContext.timeZone());
  const context = {
    date: () => local.date,
    isSelected,
    isFocused,
    isUnavailable,
    isSelectable,
    isDisabled,
    isInvalid,
    isDateToday
  };
  return createComponent(CalendarGridBodyCellContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "td",
        role: "gridcell",
        get ["aria-disabled"]() {
          return !isSelectable() || undefined;
        },
        get ["aria-selected"]() {
          return isSelected() || undefined;
        },
        get ["aria-invalid"]() {
          return isInvalid() || undefined;
        },
        get ["aria-current"]() {
          return isDateToday() ? "date" : undefined;
        },
        get ["data-value"]() {
          return local.date.toString();
        }
      }, others));
    }
  });
}

function CalendarGridBodyCellTrigger(props) {
  let ref;
  const rootContext = useCalendarContext();
  const gridContext = useCalendarGridContext();
  const context = useCalendarGriBodyCellContext();
  const [local, others] = splitProps(props, ["ref", "disabled", "onPointerEnter", "onPointerDown", "onPointerUp", "onPointerLeave", "onClick", "onKeyDown"]);
  const isDisabled = () => local.disabled || context.isDisabled();
  const isDateWeekend = () => {
    return isWeekend(context.date(), rootContext.locale());
  };
  const isOutsideVisibleRange = () => {
    return context.date().compare(rootContext.startDate()) < 0 || context.date().compare(rootContext.endDate()) > 0;
  };
  const isOutsideMonth = () => {
    return !isSameMonth(gridContext.startDate(), context.date());
  };
  const isSelectionStart = () => {
    if (rootContext.selectionMode() !== "range") {
      return false;
    }
    const start = rootContext.highlightedRange()?.start;
    return start != null && isSameDay(context.date(), start);
  };
  const isSelectionEnd = () => {
    if (rootContext.selectionMode() !== "range") {
      return false;
    }
    const end = rootContext.highlightedRange()?.end;
    return end != null && isSameDay(context.date(), end);
  };
  const tabIndex = createMemo(() => {
    if (!isDisabled()) {
      return isSameDay(context.date(), rootContext.focusedDate()) ? 0 : -1;
    }
    return undefined;
  });
  const labelDateFormatter = createDateFormatter(() => ({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    era: getEraFormat(context.date()),
    timeZone: rootContext.timeZone()
  }));
  const cellDateFormatter = createDateFormatter(() => ({
    day: "numeric",
    timeZone: rootContext.timeZone(),
    calendar: context.date().calendar.identifier
  }));
  const nativeDate = createMemo(() => {
    return context.date().toDate(rootContext.timeZone());
  });
  const formattedDate = createMemo(() => {
    return cellDateFormatter().formatToParts(nativeDate()).find(part => part.type === "day")?.value;
  });
  const ariaLabel = createMemo(() => {
    let label = "";

    // If this is a range calendar, add a description of the full selected range
    // to the first and last selected date.
    if (rootContext.selectionMode() === "range" && !rootContext.anchorDate()) {
      const {
        start,
        end
      } = asRangeValue(rootContext.value()) ?? {};
      if (start && end && (isSameDay(context.date(), start) || isSameDay(context.date(), end))) {
        label = getSelectedDateDescription(rootContext.messageFormatter(), context.date(), rootContext.timeZone()) + ", ";
      }
    }
    label += labelDateFormatter().format(nativeDate());
    if (context.isDateToday()) {
      // If date is today, set appropriate string depending on selected state:
      label = rootContext.messageFormatter().format(context.isSelected() ? "todayDateSelected" : "todayDate", {
        date: label
      });
    } else if (context.isSelected()) {
      // If date is selected but not today:
      label = rootContext.messageFormatter().format("dateSelected", {
        date: label
      });
    }
    const min = rootContext.min();
    const max = rootContext.max();
    if (min && isSameDay(context.date(), min)) {
      label += ", " + rootContext.messageFormatter().format("minimumDate");
    } else if (max && isSameDay(context.date(), max)) {
      label += ", " + rootContext.messageFormatter().format("maximumDate");
    }
    return label;
  });
  let isPointerDown = false;
  let isAnchorPressed = false;
  let isRangeBoundaryPressed = false;
  let touchDragTimerRef;
  const onPressEnd = () => {
    isRangeBoundaryPressed = false;
    isAnchorPressed = false;
    if (touchDragTimerRef != null) {
      getWindow(ref).clearTimeout(touchDragTimerRef);
      touchDragTimerRef = undefined;
    }
  };
  const onPointerEnter = e => {
    callHandler(e, local.onPointerEnter);

    // Highlight the date on hover or drag over a date when selecting a range.
    if (rootContext.selectionMode() === "range" && (e.pointerType !== "touch" || rootContext.isDragging()) && context.isSelectable()) {
      rootContext.highlightDate(context.date());
    }
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);
    if (isPointerDown) {
      onPressEnd();
    }
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    isPointerDown = true;

    // This is necessary on touch devices to allow dragging
    // outside the original pressed element.
    if ("releasePointerCapture" in e.target) {
      e.target.releasePointerCapture(e.pointerId);
    }
    if (rootContext.isReadOnly()) {
      rootContext.focusCell(context.date());
      return;
    }
    if (rootContext.selectionMode() === "range" && !rootContext.anchorDate()) {
      const highlightedRange = rootContext.highlightedRange();

      // Allow dragging the start or end date of a range to modify it
      // rather than starting a new selection.
      // Don't allow dragging when invalid, or weird jumping behavior may occur as date ranges
      // are constrained to available dates. The user will need to select a new range in this case.
      if (highlightedRange && !context.isInvalid()) {
        if (isSameDay(context.date(), highlightedRange.start)) {
          rootContext.setAnchorDate(highlightedRange.end);
          rootContext.focusCell(context.date());
          rootContext.setIsDragging(true);
          isRangeBoundaryPressed = true;
          return;
        } else if (isSameDay(context.date(), highlightedRange.end)) {
          rootContext.setAnchorDate(highlightedRange.start);
          rootContext.focusCell(context.date());
          rootContext.setIsDragging(true);
          isRangeBoundaryPressed = true;
          return;
        }
      }
      const startDragging = () => {
        rootContext.setIsDragging(true);
        touchDragTimerRef = undefined;
        rootContext.selectDate(context.date());
        rootContext.focusCell(context.date());
        isAnchorPressed = true;
      };

      // Start selection on mouse/touch down so users can drag to select a range.
      // On touch, delay dragging to determine if the user really meant to scroll.
      if (e.pointerType === "touch") {
        touchDragTimerRef = getWindow(ref).setTimeout(startDragging, 200);
      } else {
        startDragging();
      }
    }
  };
  const onPointerUp = e => {
    callHandler(e, local.onPointerUp);
    isPointerDown = false;
    if (rootContext.isReadOnly() || rootContext.selectionMode() !== "range") {
      onPressEnd();
      return;
    }

    // If the user tapped quickly, the date won't be selected yet and the
    // timer will still be in progress. In this case, select the date on touch up.
    if (touchDragTimerRef != null) {
      rootContext.selectDate(context.date());
      rootContext.focusCell(context.date());
    }
    if (isRangeBoundaryPressed) {
      // When clicking on the start or end date of an already selected range,
      // start a new selection on press up to also allow dragging the date to
      // change the existing range.
      rootContext.setAnchorDate(context.date());
    } else if (rootContext.anchorDate() && !isAnchorPressed) {
      // When releasing a drag or pressing the end date of a range, select it.
      rootContext.selectDate(context.date());
      rootContext.focusCell(context.date());
    }
    onPressEnd();
  };
  const onClick = e => {
    callHandler(e, local.onClick);

    // For non-range selection, always select on press up.
    if (rootContext.selectionMode() !== "range" && context.isSelectable()) {
      rootContext.selectDate(context.date());
      rootContext.focusCell(context.date());
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (!["Enter", " "].includes(e.key)) {
      return;
    }
    if (rootContext.isReadOnly()) {
      rootContext.focusCell(context.date());
      return;
    }
    if (rootContext.selectionMode() === "range" && !rootContext.anchorDate()) {
      // Prevent `Calendar.Grid` to select the cell.
      e.stopPropagation();

      // For range selection, auto-advance the focused date by one if using keyboard.
      // This gives an indication that you're selecting a range rather than a single date.
      rootContext.selectDate(context.date());
      let nextDay = context.date().add({
        days: 1
      });
      if (rootContext.isCellInvalid(nextDay)) {
        nextDay = context.date().subtract({
          days: 1
        });
      }
      if (!rootContext.isCellInvalid(nextDay)) {
        rootContext.focusCell(nextDay);
      }
    }
  };

  // Focus the button in the DOM when the date become the focused/highlighted one.
  createEffect(() => {
    if (ref && context.isFocused()) {
      focusWithoutScrolling(ref);
    }
  });
  return (// eslint-disable-next-line jsx-a11y/role-supports-aria-props
    createComponent(Polymorphic, mergeProps$1({
      as: "div",
      ref(r$) {
        const _ref$ = mergeRefs(el => ref = el, local.ref);
        typeof _ref$ === "function" && _ref$(r$);
      },
      role: "button",
      get tabIndex() {
        return tabIndex();
      },
      get disabled() {
        return isDisabled();
      },
      get ["aria-disabled"]() {
        return !context.isSelectable() || undefined;
      },
      get ["aria-invalid"]() {
        return context.isInvalid() || undefined;
      },
      get ["aria-label"]() {
        return ariaLabel();
      },
      get ["data-disabled"]() {
        return isDisabled() || undefined;
      },
      get ["data-invalid"]() {
        return context.isInvalid() || undefined;
      },
      get ["data-selected"]() {
        return context.isSelected() || undefined;
      },
      get ["data-value"]() {
        return context.date().toString();
      },
      "data-type": "day",
      get ["data-today"]() {
        return context.isDateToday() || undefined;
      },
      get ["data-weekend"]() {
        return isDateWeekend() || undefined;
      },
      get ["data-highlighted"]() {
        return context.isFocused() || undefined;
      },
      get ["data-unavailable"]() {
        return context.isUnavailable() || undefined;
      },
      get ["data-selection-start"]() {
        return isSelectionStart() || undefined;
      },
      get ["data-selection-end"]() {
        return isSelectionEnd() || undefined;
      },
      get ["data-outside-visible-range"]() {
        return isOutsideVisibleRange() || undefined;
      },
      get ["data-outside-month"]() {
        return isOutsideMonth() || undefined;
      },
      onPointerEnter: onPointerEnter,
      onPointerLeave: onPointerLeave,
      onPointerDown: onPointerDown,
      onPointerUp: onPointerUp,
      onClick: onClick,
      onKeyDown: onKeyDown,
      onContextMenu: e => {
        // Prevent context menu on long press.
        e.preventDefault();
      }
    }, others, {
      get children() {
        return formattedDate();
      }
    }))
  );
}

/**
 * A calendar grid body row displays a row of calendar cells within a month.
 */
function CalendarGridBodyRow(props) {
  const rootContext = useCalendarContext();
  const context = useCalendarGridContext();
  const [local, others] = splitProps(props, ["weekIndex", "children"]);
  const datesInWeek = createMemo(() => {
    return rootContext.getDatesInWeek(local.weekIndex, context.startDate());
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "tr"
  }, others, {
    get children() {
      return createComponent(Index, {
        get each() {
          return datesInWeek();
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
}

/**
 * A calendar grid header displays a row of week day names at the top of a month.
 */
function CalendarGridHeader(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "thead",
    "aria-hidden": "true"
  }, props));
}

/**
 * A calendar grid header cell displays a week day name at the top of a column within a calendar.
 */
function CalendarGridHeaderCell(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "th"
  }, props));
}

/**
 * A calendar grid header row displays week day names inside a `Calendar.GridHeader`.
 */
function CalendarGridHeaderRow(props) {
  const [local, others] = splitProps(props, ["children"]);
  const context = useCalendarGridContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "tr"
  }, others, {
    get children() {
      return createComponent(Index, {
        get each() {
          return context.weekDays();
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
}

/**
 * Contains the calendar heading and navigation triggers.
 */
function CalendarHeader(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "header"
  }, props));
}

function CalendarHeading(props) {
  const rootContext = useCalendarContext();
  const title = createMemo(() => {
    return getVisibleRangeDescription(rootContext.messageFormatter(), rootContext.startDate(), rootContext.endDate(), rootContext.timeZone(), false);
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "h2"
  }, props, {
    get children() {
      return title();
    }
  }));
}

function CalendarNextTrigger(props) {
  const context = useCalendarContext();
  const [local, others] = splitProps(props, ["disabled", "onClick", "onFocus", "onBlur"]);
  let nextTriggerFocused = false;
  const nextTriggerDisabled = createMemo(() => {
    return local.disabled || context.isDisabled() || isNextVisibleRangeInvalid(context.endDate(), context.min(), context.max());
  });
  const onClick = e => {
    callHandler(e, local.onClick);
    context.focusNextPage();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    nextTriggerFocused = true;
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    nextTriggerFocused = false;
  };

  // If the next trigger become disabled while they are focused, move focus to the calendar body.
  createEffect(() => {
    if (nextTriggerDisabled() && nextTriggerFocused) {
      nextTriggerFocused = false;
      context.setIsFocused(true);
    }
  });
  return createComponent(ButtonRoot, mergeProps$1({
    get disabled() {
      return nextTriggerDisabled();
    },
    get ["aria-label"]() {
      return context.messageFormatter().format("next");
    },
    onClick: onClick,
    onFocus: onFocus,
    onBlur: onBlur
  }, others));
}

function CalendarPrevTrigger(props) {
  const context = useCalendarContext();
  const [local, others] = splitProps(props, ["disabled", "onClick", "onFocus", "onBlur"]);
  let prevTriggerFocused = false;
  const prevTriggerDisabled = createMemo(() => {
    return local.disabled || context.isDisabled() || isPreviousVisibleRangeInvalid(context.startDate(), context.min(), context.max());
  });
  const onClick = e => {
    callHandler(e, local.onClick);
    context.focusPreviousPage();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    prevTriggerFocused = true;
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    prevTriggerFocused = false;
  };

  // If the prev trigger become disabled while they are focused, move focus to the calendar body.
  createEffect(() => {
    if (prevTriggerDisabled() && prevTriggerFocused) {
      prevTriggerFocused = false;
      context.setIsFocused(true);
    }
  });
  return createComponent(ButtonRoot, mergeProps$1({
    get disabled() {
      return prevTriggerDisabled();
    },
    get ["aria-label"]() {
      return context.messageFormatter().format("previous");
    },
    onClick: onClick,
    onFocus: onFocus,
    onBlur: onBlur
  }, others));
}

const CALENDAR_INTL_MESSAGES = {
  "ar-AE": {
    dateRange: "{startDate} إلى {endDate}",
    dateSelected: "{date} المحدد",
    finishRangeSelectionPrompt: "انقر لإنهاء عملية تحديد نطاق التاريخ",
    maximumDate: "آخر تاريخ متاح",
    minimumDate: "أول تاريخ متاح",
    next: "التالي",
    previous: "السابق",
    selectedDateDescription: "تاريخ محدد: {date}",
    selectedRangeDescription: "المدى الزمني المحدد: {dateRange}",
    startRangeSelectionPrompt: "انقر لبدء عملية تحديد نطاق التاريخ",
    todayDate: "اليوم، {date}",
    todayDateSelected: "اليوم، {date} محدد"
  },
  "bg-BG": {
    dateRange: "{startDate} до {endDate}",
    dateSelected: "Избрано е {date}",
    finishRangeSelectionPrompt: "Натиснете, за да довършите избора на времеви интервал",
    maximumDate: "Последна налична дата",
    minimumDate: "Първа налична дата",
    next: "Напред",
    previous: "Назад",
    selectedDateDescription: "Избрана дата: {date}",
    selectedRangeDescription: "Избран диапазон: {dateRange}",
    startRangeSelectionPrompt: "Натиснете, за да пристъпите към избора на времеви интервал",
    todayDate: "Днес, {date}",
    todayDateSelected: "Днес, {date} са избрани"
  },
  "cs-CZ": {
    dateRange: "{startDate} až {endDate}",
    dateSelected: "Vybráno {date}",
    finishRangeSelectionPrompt: "Kliknutím dokončíte výběr rozsahu dat",
    maximumDate: "Poslední dostupné datum",
    minimumDate: "První dostupné datum",
    next: "Další",
    previous: "Předchozí",
    selectedDateDescription: "Vybrané datum: {date}",
    selectedRangeDescription: "Vybrané období: {dateRange}",
    startRangeSelectionPrompt: "Kliknutím zahájíte výběr rozsahu dat",
    todayDate: "Dnes, {date}",
    todayDateSelected: "Dnes, vybráno {date}"
  },
  "da-DK": {
    dateRange: "{startDate} til {endDate}",
    dateSelected: "{date} valgt",
    finishRangeSelectionPrompt: "Klik for at fuldføre valg af datoområde",
    maximumDate: "Sidste ledige dato",
    minimumDate: "Første ledige dato",
    next: "Næste",
    previous: "Forrige",
    selectedDateDescription: "Valgt dato: {date}",
    selectedRangeDescription: "Valgt interval: {dateRange}",
    startRangeSelectionPrompt: "Klik for at starte valg af datoområde",
    todayDate: "I dag, {date}",
    todayDateSelected: "I dag, {date} valgt"
  },
  "de-DE": {
    dateRange: "{startDate} bis {endDate}",
    dateSelected: "{date} ausgewählt",
    finishRangeSelectionPrompt: "Klicken, um die Auswahl des Datumsbereichs zu beenden",
    maximumDate: "Letztes verfügbares Datum",
    minimumDate: "Erstes verfügbares Datum",
    next: "Weiter",
    previous: "Zurück",
    selectedDateDescription: "Ausgewähltes Datum: {date}",
    selectedRangeDescription: "Ausgewählter Bereich: {dateRange}",
    startRangeSelectionPrompt: "Klicken, um die Auswahl des Datumsbereichs zu beginnen",
    todayDate: "Heute, {date}",
    todayDateSelected: "Heute, {date} ausgewählt"
  },
  "el-GR": {
    dateRange: "{startDate} έως {endDate}",
    dateSelected: "Επιλέχθηκε {date}",
    finishRangeSelectionPrompt: "Κάντε κλικ για να ολοκληρώσετε την επιλογή εύρους ημερομηνιών",
    maximumDate: "Τελευταία διαθέσιμη ημερομηνία",
    minimumDate: "Πρώτη διαθέσιμη ημερομηνία",
    next: "Επόμενο",
    previous: "Προηγούμενο",
    selectedDateDescription: "Επιλεγμένη ημερομηνία: {date}",
    selectedRangeDescription: "Επιλεγμένο εύρος: {dateRange}",
    startRangeSelectionPrompt: "Κάντε κλικ για να ξεκινήσετε την επιλογή εύρους ημερομηνιών",
    todayDate: "Σήμερα, {date}",
    todayDateSelected: "Σήμερα, επιλέχτηκε {date}"
  },
  "en-US": {
    previous: "Previous",
    next: "Next",
    selectedDateDescription: "Selected Date: {date}",
    selectedRangeDescription: "Selected Range: {dateRange}",
    todayDate: "Today, {date}",
    todayDateSelected: "Today, {date} selected",
    dateSelected: "{date} selected",
    startRangeSelectionPrompt: "Click to start selecting date range",
    finishRangeSelectionPrompt: "Click to finish selecting date range",
    minimumDate: "First available date",
    maximumDate: "Last available date",
    dateRange: "{startDate} to {endDate}"
  },
  "es-ES": {
    dateRange: "{startDate} a {endDate}",
    dateSelected: "{date} seleccionado",
    finishRangeSelectionPrompt: "Haga clic para terminar de seleccionar rango de fechas",
    maximumDate: "Última fecha disponible",
    minimumDate: "Primera fecha disponible",
    next: "Siguiente",
    previous: "Anterior",
    selectedDateDescription: "Fecha seleccionada: {date}",
    selectedRangeDescription: "Intervalo seleccionado: {dateRange}",
    startRangeSelectionPrompt: "Haga clic para comenzar a seleccionar un rango de fechas",
    todayDate: "Hoy, {date}",
    todayDateSelected: "Hoy, {date} seleccionado"
  },
  "et-EE": {
    dateRange: "{startDate} kuni {endDate}",
    dateSelected: "{date} valitud",
    finishRangeSelectionPrompt: "Klõpsake kuupäevavahemiku valimise lõpetamiseks",
    maximumDate: "Viimane saadaolev kuupäev",
    minimumDate: "Esimene saadaolev kuupäev",
    next: "Järgmine",
    previous: "Eelmine",
    selectedDateDescription: "Valitud kuupäev: {date}",
    selectedRangeDescription: "Valitud vahemik: {dateRange}",
    startRangeSelectionPrompt: "Klõpsake kuupäevavahemiku valimiseks",
    todayDate: "Täna, {date}",
    todayDateSelected: "Täna, {date} valitud"
  },
  "fi-FI": {
    dateRange: "{startDate} – {endDate}",
    dateSelected: "{date} valittu",
    finishRangeSelectionPrompt: "Lopeta päivämääräalueen valinta napsauttamalla tätä.",
    maximumDate: "Viimeinen varattavissa oleva päivämäärä",
    minimumDate: "Ensimmäinen varattavissa oleva päivämäärä",
    next: "Seuraava",
    previous: "Edellinen",
    selectedDateDescription: "Valittu päivämäärä: {date}",
    selectedRangeDescription: "Valittu aikaväli: {dateRange}",
    startRangeSelectionPrompt: "Aloita päivämääräalueen valinta napsauttamalla tätä.",
    todayDate: "Tänään, {date}",
    todayDateSelected: "Tänään, {date} valittu"
  },
  "fr-FR": {
    dateRange: "{startDate} à {endDate}",
    dateSelected: "{date} sélectionné",
    finishRangeSelectionPrompt: "Cliquer pour finir de sélectionner la plage de dates",
    maximumDate: "Dernière date disponible",
    minimumDate: "Première date disponible",
    next: "Suivant",
    previous: "Précédent",
    selectedDateDescription: "Date sélectionnée : {date}",
    selectedRangeDescription: "Plage sélectionnée : {dateRange}",
    startRangeSelectionPrompt: "Cliquer pour commencer à sélectionner la plage de dates",
    todayDate: "Aujourd'hui, {date}",
    todayDateSelected: "Aujourd’hui, {date} sélectionné"
  },
  "he-IL": {
    dateRange: "{startDate} עד {endDate}",
    dateSelected: "{date} נבחר",
    finishRangeSelectionPrompt: "חץ כדי לסיים את בחירת טווח התאריכים",
    maximumDate: "תאריך פנוי אחרון",
    minimumDate: "תאריך פנוי ראשון",
    next: "הבא",
    previous: "הקודם",
    selectedDateDescription: "תאריך נבחר: {date}",
    selectedRangeDescription: "טווח נבחר: {dateRange}",
    startRangeSelectionPrompt: "לחץ כדי להתחיל בבחירת טווח התאריכים",
    todayDate: "היום, {date}",
    todayDateSelected: "היום, {date} נבחר"
  },
  "hr-HR": {
    dateRange: "{startDate} do {endDate}",
    dateSelected: "{date} odabran",
    finishRangeSelectionPrompt: "Kliknite da dovršite raspon odabranih datuma",
    maximumDate: "Posljednji raspoloživi datum",
    minimumDate: "Prvi raspoloživi datum",
    next: "Sljedeći",
    previous: "Prethodni",
    selectedDateDescription: "Odabrani datum: {date}",
    selectedRangeDescription: "Odabrani raspon: {dateRange}",
    startRangeSelectionPrompt: "Kliknite da započnete raspon odabranih datuma",
    todayDate: "Danas, {date}",
    todayDateSelected: "Danas, odabran {date}"
  },
  "hu-HU": {
    dateRange: "{startDate}–{endDate}",
    dateSelected: "{date} kiválasztva",
    finishRangeSelectionPrompt: "Kattintson a dátumtartomány kijelölésének befejezéséhez",
    maximumDate: "Utolsó elérhető dátum",
    minimumDate: "Az első elérhető dátum",
    next: "Következő",
    previous: "Előző",
    selectedDateDescription: "Kijelölt dátum: {date}",
    selectedRangeDescription: "Kijelölt tartomány: {dateRange}",
    startRangeSelectionPrompt: "Kattintson a dátumtartomány kijelölésének indításához",
    todayDate: "Ma, {date}",
    todayDateSelected: "Ma, {date} kijelölve"
  },
  "it-IT": {
    dateRange: "Da {startDate} a {endDate}",
    dateSelected: "{date} selezionata",
    finishRangeSelectionPrompt: "Fai clic per completare la selezione dell’intervallo di date",
    maximumDate: "Ultima data disponibile",
    minimumDate: "Prima data disponibile",
    next: "Successivo",
    previous: "Precedente",
    selectedDateDescription: "Data selezionata: {date}",
    selectedRangeDescription: "Intervallo selezionato: {dateRange}",
    startRangeSelectionPrompt: "Fai clic per selezionare l’intervallo di date",
    todayDate: "Oggi, {date}",
    todayDateSelected: "Oggi, {date} selezionata"
  },
  "ja-JP": {
    dateRange: "{startDate} から {endDate}",
    dateSelected: "{date} を選択",
    finishRangeSelectionPrompt: "クリックして日付範囲の選択を終了",
    maximumDate: "最終利用可能日",
    minimumDate: "最初の利用可能日",
    next: "次へ",
    previous: "前へ",
    selectedDateDescription: "選択した日付 : {date}",
    selectedRangeDescription: "選択範囲 : {dateRange}",
    startRangeSelectionPrompt: "クリックして日付範囲の選択を開始",
    todayDate: "本日、{date}",
    todayDateSelected: "本日、{date} を選択"
  },
  "ko-KR": {
    dateRange: "{startDate} ~ {endDate}",
    dateSelected: "{date} 선택됨",
    finishRangeSelectionPrompt: "날짜 범위 선택을 완료하려면 클릭하십시오.",
    maximumDate: "마지막으로 사용 가능한 일자",
    minimumDate: "처음으로 사용 가능한 일자",
    next: "다음",
    previous: "이전",
    selectedDateDescription: "선택 일자: {date}",
    selectedRangeDescription: "선택 범위: {dateRange}",
    startRangeSelectionPrompt: "날짜 범위 선택을 시작하려면 클릭하십시오.",
    todayDate: "오늘, {date}",
    todayDateSelected: "오늘, {date} 선택됨"
  },
  "lt-LT": {
    dateRange: "Nuo {startDate} iki {endDate}",
    dateSelected: "Pasirinkta {date}",
    finishRangeSelectionPrompt: "Spustelėkite, kad baigtumėte pasirinkti datų intervalą",
    maximumDate: "Paskutinė galima data",
    minimumDate: "Pirmoji galima data",
    next: "Paskesnis",
    previous: "Ankstesnis",
    selectedDateDescription: "Pasirinkta data: {date}",
    selectedRangeDescription: "Pasirinktas intervalas: {dateRange}",
    startRangeSelectionPrompt: "Spustelėkite, kad pradėtumėte pasirinkti datų intervalą",
    todayDate: "Šiandien, {date}",
    todayDateSelected: "Šiandien, pasirinkta {date}"
  },
  "lv-LV": {
    dateRange: "No {startDate} līdz {endDate}",
    dateSelected: "Atlasīts: {date}",
    finishRangeSelectionPrompt: "Noklikšķiniet, lai pabeigtu datumu diapazona atlasi",
    maximumDate: "Pēdējais pieejamais datums",
    minimumDate: "Pirmais pieejamais datums",
    next: "Tālāk",
    previous: "Atpakaļ",
    selectedDateDescription: "Atlasītais datums: {date}",
    selectedRangeDescription: "Atlasītais diapazons: {dateRange}",
    startRangeSelectionPrompt: "Noklikšķiniet, lai sāktu datumu diapazona atlasi",
    todayDate: "Šodien, {date}",
    todayDateSelected: "Atlasīta šodiena, {date}"
  },
  "nb-NO": {
    dateRange: "{startDate} til {endDate}",
    dateSelected: "{date} valgt",
    finishRangeSelectionPrompt: "Klikk for å fullføre valg av datoområde",
    maximumDate: "Siste tilgjengelige dato",
    minimumDate: "Første tilgjengelige dato",
    next: "Neste",
    previous: "Forrige",
    selectedDateDescription: "Valgt dato: {date}",
    selectedRangeDescription: "Valgt område: {dateRange}",
    startRangeSelectionPrompt: "Klikk for å starte valg av datoområde",
    todayDate: "I dag, {date}",
    todayDateSelected: "I dag, {date} valgt"
  },
  "nl-NL": {
    dateRange: "{startDate} tot {endDate}",
    dateSelected: "{date} geselecteerd",
    finishRangeSelectionPrompt: "Klik om de selectie van het datumbereik te voltooien",
    maximumDate: "Laatste beschikbare datum",
    minimumDate: "Eerste beschikbare datum",
    next: "Volgende",
    previous: "Vorige",
    selectedDateDescription: "Geselecteerde datum: {date}",
    selectedRangeDescription: "Geselecteerd bereik: {dateRange}",
    startRangeSelectionPrompt: "Klik om het datumbereik te selecteren",
    todayDate: "Vandaag, {date}",
    todayDateSelected: "Vandaag, {date} geselecteerd"
  },
  "pl-PL": {
    dateRange: "{startDate} do {endDate}",
    dateSelected: "Wybrano {date}",
    finishRangeSelectionPrompt: "Kliknij, aby zakończyć wybór zakresu dat",
    maximumDate: "Ostatnia dostępna data",
    minimumDate: "Pierwsza dostępna data",
    next: "Dalej",
    previous: "Wstecz",
    selectedDateDescription: "Wybrana data: {date}",
    selectedRangeDescription: "Wybrany zakres: {dateRange}",
    startRangeSelectionPrompt: "Kliknij, aby rozpocząć wybór zakresu dat",
    todayDate: "Dzisiaj, {date}",
    todayDateSelected: "Dzisiaj wybrano {date}"
  },
  "pt-BR": {
    dateRange: "{startDate} a {endDate}",
    dateSelected: "{date} selecionado",
    finishRangeSelectionPrompt: "Clique para concluir a seleção do intervalo de datas",
    maximumDate: "Última data disponível",
    minimumDate: "Primeira data disponível",
    next: "Próximo",
    previous: "Anterior",
    selectedDateDescription: "Data selecionada: {date}",
    selectedRangeDescription: "Intervalo selecionado: {dateRange}",
    startRangeSelectionPrompt: "Clique para iniciar a seleção do intervalo de datas",
    todayDate: "Hoje, {date}",
    todayDateSelected: "Hoje, {date} selecionado"
  },
  "pt-PT": {
    dateRange: "{startDate} a {endDate}",
    dateSelected: "{date} selecionado",
    finishRangeSelectionPrompt: "Clique para terminar de selecionar o intervalo de datas",
    maximumDate: "Última data disponível",
    minimumDate: "Primeira data disponível",
    next: "Próximo",
    previous: "Anterior",
    selectedDateDescription: "Data selecionada: {date}",
    selectedRangeDescription: "Intervalo selecionado: {dateRange}",
    startRangeSelectionPrompt: "Clique para começar a selecionar o intervalo de datas",
    todayDate: "Hoje, {date}",
    todayDateSelected: "Hoje, {date} selecionado"
  },
  "ro-RO": {
    dateRange: "De la {startDate} până la {endDate}",
    dateSelected: "{date} selectată",
    finishRangeSelectionPrompt: "Apăsaţi pentru a finaliza selecţia razei pentru dată",
    maximumDate: "Ultima dată disponibilă",
    minimumDate: "Prima dată disponibilă",
    next: "Următorul",
    previous: "Înainte",
    selectedDateDescription: "Dată selectată: {date}",
    selectedRangeDescription: "Interval selectat: {dateRange}",
    startRangeSelectionPrompt: "Apăsaţi pentru a începe selecţia razei pentru dată",
    todayDate: "Astăzi, {date}",
    todayDateSelected: "Azi, {date} selectată"
  },
  "ru-RU": {
    dateRange: "С {startDate} по {endDate}",
    dateSelected: "Выбрано {date}",
    finishRangeSelectionPrompt: "Щелкните, чтобы завершить выбор диапазона дат",
    maximumDate: "Последняя доступная дата",
    minimumDate: "Первая доступная дата",
    next: "Далее",
    previous: "Назад",
    selectedDateDescription: "Выбранная дата: {date}",
    selectedRangeDescription: "Выбранный диапазон: {dateRange}",
    startRangeSelectionPrompt: "Щелкните, чтобы начать выбор диапазона дат",
    todayDate: "Сегодня, {date}",
    todayDateSelected: "Сегодня, выбрано {date}"
  },
  "sk-SK": {
    dateRange: "Od {startDate} do {endDate}",
    dateSelected: "Vybratý dátum {date}",
    finishRangeSelectionPrompt: "Kliknutím dokončíte výber rozsahu dátumov",
    maximumDate: "Posledný dostupný dátum",
    minimumDate: "Prvý dostupný dátum",
    next: "Nasledujúce",
    previous: "Predchádzajúce",
    selectedDateDescription: "Vybratý dátum: {date}",
    selectedRangeDescription: "Vybratý rozsah: {dateRange}",
    startRangeSelectionPrompt: "Kliknutím spustíte výber rozsahu dátumov",
    todayDate: "Dnes {date}",
    todayDateSelected: "Vybratý dnešný dátum {date}"
  },
  "sl-SI": {
    dateRange: "{startDate} do {endDate}",
    dateSelected: "{date} izbrano",
    finishRangeSelectionPrompt: "Kliknite za dokončanje izbire datumskega obsega",
    maximumDate: "Zadnji razpoložljivi datum",
    minimumDate: "Prvi razpoložljivi datum",
    next: "Naprej",
    previous: "Nazaj",
    selectedDateDescription: "Izbrani datum: {date}",
    selectedRangeDescription: "Izbrano območje: {dateRange}",
    startRangeSelectionPrompt: "Kliknite za začetek izbire datumskega obsega",
    todayDate: "Danes, {date}",
    todayDateSelected: "Danes, {date} izbrano"
  },
  "sr-SP": {
    dateRange: "{startDate} do {endDate}",
    dateSelected: "{date} izabran",
    finishRangeSelectionPrompt: "Kliknite da dovršite opseg izabranih datuma",
    maximumDate: "Zadnji raspoloživi datum",
    minimumDate: "Prvi raspoloživi datum",
    next: "Sledeći",
    previous: "Prethodni",
    selectedDateDescription: "Izabrani datum: {date}",
    selectedRangeDescription: "Izabrani period: {dateRange}",
    startRangeSelectionPrompt: "Kliknite da započnete opseg izabranih datuma",
    todayDate: "Danas, {date}",
    todayDateSelected: "Danas, izabran {date}"
  },
  "sv-SE": {
    dateRange: "{startDate} till {endDate}",
    dateSelected: "{date} har valts",
    finishRangeSelectionPrompt: "Klicka för att avsluta val av datumintervall",
    maximumDate: "Sista tillgängliga datum",
    minimumDate: "Första tillgängliga datum",
    next: "Nästa",
    previous: "Föregående",
    selectedDateDescription: "Valt datum: {date}",
    selectedRangeDescription: "Valt intervall: {dateRange}",
    startRangeSelectionPrompt: "Klicka för att välja datumintervall",
    todayDate: "Idag, {date}",
    todayDateSelected: "Idag, {date} har valts"
  },
  "tr-TR": {
    dateRange: "{startDate} - {endDate}",
    dateSelected: "{date} seçildi",
    finishRangeSelectionPrompt: "Tarih aralığı seçimini tamamlamak için tıklayın",
    maximumDate: "Son müsait tarih",
    minimumDate: "İlk müsait tarih",
    next: "Sonraki",
    previous: "Önceki",
    selectedDateDescription: "Seçilen Tarih: {date}",
    selectedRangeDescription: "Seçilen Aralık: {dateRange}",
    startRangeSelectionPrompt: "Tarih aralığı seçimini başlatmak için tıklayın",
    todayDate: "Bugün, {date}",
    todayDateSelected: "Bugün, {date} seçildi"
  },
  "uk-UA": {
    dateRange: "{startDate} — {endDate}",
    dateSelected: "Вибрано {date}",
    finishRangeSelectionPrompt: "Натисніть, щоб завершити вибір діапазону дат",
    maximumDate: "Остання доступна дата",
    minimumDate: "Перша доступна дата",
    next: "Наступний",
    previous: "Попередній",
    selectedDateDescription: "Вибрана дата: {date}",
    selectedRangeDescription: "Вибраний діапазон: {dateRange}",
    startRangeSelectionPrompt: "Натисніть, щоб почати вибір діапазону дат",
    todayDate: "Сьогодні, {date}",
    todayDateSelected: "Сьогодні, вибрано {date}"
  },
  "zh-CN": {
    dateRange: "{startDate} 至 {endDate}",
    dateSelected: "已选定 {date}",
    finishRangeSelectionPrompt: "单击以完成选择日期范围",
    maximumDate: "最后一个可用日期",
    minimumDate: "第一个可用日期",
    next: "下一页",
    previous: "上一页",
    selectedDateDescription: "选定的日期：{date}",
    selectedRangeDescription: "选定的范围：{dateRange}",
    startRangeSelectionPrompt: "单击以开始选择日期范围",
    todayDate: "今天，即 {date}",
    todayDateSelected: "已选定今天，即 {date}"
  },
  "zh-TW": {
    dateRange: "{startDate} 至 {endDate}",
    dateSelected: "已選取 {date}",
    finishRangeSelectionPrompt: "按一下以完成選取日期範圍",
    maximumDate: "最後一個可用日期",
    minimumDate: "第一個可用日期",
    next: "下一頁",
    previous: "上一頁",
    selectedDateDescription: "選定的日期：{date}",
    selectedRangeDescription: "選定的範圍：{dateRange}",
    startRangeSelectionPrompt: "按一下以開始選取日期範圍",
    todayDate: "今天，{date}",
    todayDateSelected: "已選取今天，{date}"
  }
};

/**
 * A calendar displays one or more date grids and allows users to select a single, multiple or range of dates.
 */
function CalendarRoot(props) {
  let ref;
  props = mergeDefaultProps({
    visibleDuration: {
      months: 1
    },
    selectionMode: "single"
  }, props);
  const [local, others] = splitProps(props, ["ref", "locale", "createCalendar", "visibleDuration", "selectionAlignment", "selectionMode", "value", "defaultValue", "onChange", "minValue", "maxValue", "isDateUnavailable", "allowsNonContiguousRanges", "autoFocus", "focusedValue", "defaultFocusedValue", "onFocusChange", "validationState", "disabled", "readOnly", "aria-label"]);
  const messageFormatter = createMessageFormatter(() => CALENDAR_INTL_MESSAGES);
  const locale = createMemo(() => {
    return local.locale ?? useLocale().locale();
  });
  const resolvedOptions = createMemo(() => {
    return new DateFormatter(locale()).resolvedOptions();
  });
  const direction = createMemo(() => {
    return getReadingDirection(locale());
  });
  const calendar = createMemo(() => {
    return local.createCalendar(resolvedOptions().calendar);
  });
  const [value, setControlledValue] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: value => local.onChange?.(value)
  });
  const [availableRange, setAvailableRange] = createSignal();
  const selectionAlignment = createMemo(() => {
    if (local.selectionMode === "range") {
      const valueRange = asRangeValue(value());
      if (valueRange?.start && valueRange.end) {
        const start = alignCenter(toCalendarDate(valueRange.start), local.visibleDuration, locale(), local.minValue, local.maxValue);
        const end = start.add(local.visibleDuration).subtract({
          days: 1
        });
        if (valueRange.end.compare(end) > 0) {
          return "start";
        }
      }
      return "center";
    }
    return local.selectionAlignment ?? "center";
  });
  const min = createMemo(() => {
    const startRange = availableRange()?.start;
    if (local.selectionMode === "range" && local.minValue && startRange) {
      return maxDate(local.minValue, startRange);
    }
    return local.minValue;
  });
  const max = createMemo(() => {
    const endRange = availableRange()?.end;
    if (local.selectionMode === "range" && local.maxValue && endRange) {
      return minDate(local.maxValue, endRange);
    }
    return local.maxValue;
  });
  const calendarDateValue = createMemo(() => {
    return getArrayValueOfSelection(local.selectionMode, value()).map(date => toCalendar(toCalendarDate(date), calendar()));
  });
  const timeZone = createMemo(() => {
    const firstValue = getFirstValueOfSelection(local.selectionMode, value());
    if (firstValue && "timeZone" in firstValue) {
      return firstValue.timeZone;
    }
    return resolvedOptions().timeZone;
  });
  const focusedCalendarDate = createMemo(() => {
    if (local.focusedValue) {
      return constrainValue(toCalendar(toCalendarDate(local.focusedValue), calendar()), min(), max());
    }
    return undefined;
  });
  const defaultFocusedCalendarDate = createMemo(() => {
    return constrainValue(local.defaultFocusedValue ? toCalendar(toCalendarDate(local.defaultFocusedValue), calendar()) : calendarDateValue()[0] || toCalendar(today(timeZone()), calendar()), min(), max());
  });
  const [focusedDate, setFocusedDate] = createControllableSignal({
    value: focusedCalendarDate,
    defaultValue: defaultFocusedCalendarDate,
    onChange: value => local.onFocusChange?.(value)
  });
  const [startDate, setStartDate] = createSignal(alignDate(focusedDate(), selectionAlignment(), local.visibleDuration, locale(), min(), max()));
  const endDate = createMemo(() => {
    return getEndDate(startDate(), local.visibleDuration);
  });
  const [isFocused, setIsFocused] = createSignal(local.autoFocus || false);
  const [isDragging, setIsDragging] = createSignal(false);
  const visibleRangeDescription = createMemo(() => {
    return getVisibleRangeDescription(messageFormatter(), startDate(), endDate(), timeZone(), true);
  });
  const ariaLabel = () => {
    return [local["aria-label"], visibleRangeDescription()].filter(Boolean).join(", ");
  };
  const isCellDisabled = date => {
    return local.disabled || date.compare(startDate()) < 0 || date.compare(endDate()) > 0 || isDateInvalid(date, min(), max());
  };
  const isCellUnavailable = date => {
    return local.isDateUnavailable?.(date) ?? false;
  };
  const updateAvailableRange = date => {
    if (date && local.isDateUnavailable && !local.allowsNonContiguousRanges) {
      setAvailableRange({
        start: getNextUnavailableDate(date, startDate(), endDate(), isCellUnavailable, -1),
        end: getNextUnavailableDate(date, startDate(), endDate(), isCellUnavailable, 1)
      });
    } else {
      setAvailableRange(undefined);
    }
  };
  const [anchorDate, setAnchorDate] = createControllableSignal({
    onChange: value => updateAvailableRange(value)
  });
  const highlightedRange = createMemo(() => {
    if (local.selectionMode !== "range") {
      return undefined;
    }
    const resolvedAnchorDate = anchorDate();
    if (resolvedAnchorDate) {
      return makeCalendarDateRange(resolvedAnchorDate, focusedDate());
    }
    const {
      start,
      end
    } = asRangeValue(value()) ?? {};
    return makeCalendarDateRange(start, end);
  });
  const validationState = createMemo(() => {
    if (local.validationState) {
      return local.validationState;
    }
    if (calendarDateValue().length <= 0) {
      return null;
    }
    if (local.selectionMode === "range" && anchorDate()) {
      return null;
    }
    const isSomeDateInvalid = calendarDateValue().some(date => {
      return local.isDateUnavailable?.(date) || isDateInvalid(date, min(), max());
    });
    return isSomeDateInvalid ? "invalid" : null;
  });
  const isCellSelected = cellDate => {
    const isAvailable = !isCellDisabled(cellDate) && !isCellUnavailable(cellDate);
    if (local.selectionMode === "range") {
      const {
        start,
        end
      } = highlightedRange() ?? {};
      const isInRange = start != null && cellDate.compare(start) >= 0 && end != null && cellDate.compare(end) <= 0;
      return isInRange && isAvailable;
    }
    return calendarDateValue().some(date => isSameDay(cellDate, date)) && isAvailable;
  };
  const isCellFocused = date => {
    const resolvedFocusedDate = focusedDate();
    return isFocused() && resolvedFocusedDate != null && isSameDay(date, resolvedFocusedDate);
  };
  const isCellInvalid = date => {
    if (local.selectionMode === "range") {
      return isDateInvalid(date, min(), max()) || isDateInvalid(date, availableRange()?.start, availableRange()?.end);
    }
    return isDateInvalid(date, min(), max());
  };
  const selectDate = date => {
    if (local.readOnly || local.disabled) {
      return;
    }
    let newValue = getPreviousAvailableDate(constrainValue(date, min(), max()), startDate(), local.isDateUnavailable);
    if (!newValue) {
      return;
    }
    if (local.selectionMode === "single") {
      setControlledValue(prev => {
        const prevValue = asSingleValue(prev);
        if (!newValue) {
          return prevValue;
        }
        return convertValue$1(newValue, prevValue);
      });
    } else if (local.selectionMode === "multiple") {
      setControlledValue(prev => {
        const prevValue = asArrayValue(prev) ?? [];
        if (!newValue) {
          return prevValue;
        }
        newValue = convertValue$1(newValue, prevValue[0]);
        const index = prevValue.findIndex(date => newValue != null && isSameDay(date, newValue));

        // If new value is already selected, remove it.
        if (index !== -1) {
          const nextValues = [...prevValue];
          nextValues.splice(index, 1);
          return sortDates(nextValues);
        } else {
          return sortDates([...prevValue, newValue]);
        }
      });
    } else if (local.selectionMode === "range") {
      if (!anchorDate()) {
        setAnchorDate(newValue);
      } else {
        setControlledValue(prev => {
          const prevRange = asRangeValue(prev);
          const range = makeCalendarDateRange(anchorDate(), newValue);
          if (!range) {
            return prevRange;
          }
          return {
            start: convertValue$1(range.start, prevRange?.start),
            end: convertValue$1(range.end, prevRange?.end)
          };
        });
        setAnchorDate(undefined);
      }
    }
  };
  const selectFocusedDate = () => {
    selectDate(focusedDate());
  };
  const focusCell = date => {
    setFocusedDate(constrainValue(date, min(), max()));
    if (!isFocused()) {
      setIsFocused(true);
    }
  };
  const highlightDate = date => {
    if (anchorDate()) {
      focusCell(date);
    }
  };
  const focusNextDay = () => {
    focusCell(focusedDate().add({
      days: 1
    }));
  };
  const focusPreviousDay = () => {
    focusCell(focusedDate().subtract({
      days: 1
    }));
  };
  const focusNextRow = () => {
    const row = getNextRow(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    if (row) {
      setStartDate(row.startDate);
      focusCell(row.focusedDate);
    }
  };
  const focusPreviousRow = () => {
    const row = getPreviousRow(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    if (row) {
      setStartDate(row.startDate);
      focusCell(row.focusedDate);
    }
  };
  const focusNextPage = () => {
    const page = getNextPage(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    setFocusedDate(constrainValue(page.focusedDate, min(), max()));
    setStartDate(page.startDate);
  };
  const focusPreviousPage = () => {
    const page = getPreviousPage(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    setFocusedDate(constrainValue(page.focusedDate, min(), max()));
    setStartDate(page.startDate);
  };
  const focusSectionStart = () => {
    const section = getSectionStart(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    if (section) {
      setStartDate(section.startDate);
      focusCell(section.focusedDate);
    }
  };
  const focusSectionEnd = () => {
    const section = getSectionEnd(focusedDate(), startDate(), local.visibleDuration, locale(), min(), max());
    if (section) {
      setStartDate(section.startDate);
      focusCell(section.focusedDate);
    }
  };
  const focusNextSection = larger => {
    const section = getNextSection(focusedDate(), startDate(), larger, local.visibleDuration, locale(), min(), max());
    if (section) {
      setStartDate(section.startDate);
      focusCell(section.focusedDate);
    }
  };
  const focusPreviousSection = larger => {
    const section = getPreviousSection(focusedDate(), startDate(), larger, local.visibleDuration, locale(), min(), max());
    if (section) {
      setStartDate(section.startDate);
      focusCell(section.focusedDate);
    }
  };
  const getDatesInWeek = (weekIndex, from) => {
    let date = from.add({
      weeks: weekIndex
    });
    const dates = [];
    date = startOfWeek(date, locale());

    // startOfWeek will clamp dates within the calendar system's valid range, which may
    // start in the middle of a week. In this case, add null placeholders.
    const dayOfWeek = getDayOfWeek(date, locale());
    for (let i = 0; i < dayOfWeek; i++) {
      dates.push(null);
    }
    while (dates.length < 7) {
      dates.push(date);
      const nextDate = date.add({
        days: 1
      });
      if (isSameDay(date, nextDate)) {
        // If the next day is the same, we have hit the end of the calendar system.
        break;
      }
      date = nextDate;
    }

    // Add null placeholders if at the end of the calendar system.
    while (dates.length < 7) {
      dates.push(null);
    }
    return dates;
  };
  createInteractOutside({
    onInteractOutside: e => {
      // Stop range selection on interaction outside the calendar, e.g. tabbing away from the calendar.
      if (local.selectionMode === "range" && anchorDate()) {
        selectFocusedDate();
      }
    }
  }, () => ref);

  // Reset focused date and visible range when calendar changes.
  let lastCalendarIdentifier = calendar().identifier;
  createEffect(on(calendar, calendar => {
    if (calendar.identifier !== lastCalendarIdentifier) {
      const newFocusedDate = toCalendar(focusedDate(), calendar);
      setStartDate(alignCenter(newFocusedDate, local.visibleDuration, locale(), min(), max()));
      setFocusedDate(newFocusedDate);
      lastCalendarIdentifier = calendar.identifier;
    }
  }));
  createEffect(() => {
    const adjust = getAdjustedDateFn(local.visibleDuration, locale(), min(), max());
    const adjustment = adjust({
      startDate: startDate(),
      focusedDate: focusedDate()
    });
    setStartDate(adjustment.startDate);
    setFocusedDate(adjustment.focusedDate);
  });

  // Announce when the visible date range changes only when pressing the Previous or Next triggers.
  createEffect(() => {
    if (!isFocused()) {
      announce(visibleRangeDescription());
    }
  });

  // Announce when the selected value changes
  createEffect(() => {
    let description;
    if (local.selectionMode === "single") {
      const date = asSingleValue(value());
      description = date && getSelectedDateDescription(messageFormatter(), date, timeZone());
    } else if (local.selectionMode === "multiple") {
      const dates = asArrayValue(value());
      description = dates?.map(date => getSelectedDateDescription(messageFormatter(), date, timeZone())).join(", ");
    } else if (local.selectionMode === "range") {
      const dateRange = asRangeValue(value()) ?? {};
      description = getSelectedDateRangeDescription(messageFormatter(), dateRange, anchorDate(), timeZone());
    }
    if (description) {
      announce(description, "polite", 4000);
    }
  });

  // In "range" selection mode, update the available range if the visible range changes.
  createEffect(on([startDate, endDate], () => {
    if (local.selectionMode === "range") {
      updateAvailableRange(anchorDate());
    }
  }));
  let isVirtualClick = false;
  createEffect(() => {
    if (isServer) {
      return;
    }
    if (local.selectionMode !== "range" || !ref) {
      return;
    }
    const win = getWindow(ref);
    const doc = getDocument(ref);

    // We need to ignore virtual pointer events from VoiceOver due to these bugs.
    // https://bugs.webkit.org/show_bug.cgi?id=222627
    // https://bugs.webkit.org/show_bug.cgi?id=223202
    const onWindowPointerDown = e => {
      isVirtualClick = e.width === 0 && e.height === 0;
    };

    // Stop range selection when pressing or releasing a pointer outside the calendar body,
    // except when pressing the next or previous buttons to switch months.
    const endDragging = e => {
      if (isVirtualClick) {
        isVirtualClick = false;
        return;
      }
      setIsDragging(false);
      if (!anchorDate()) {
        return;
      }
      const target = e.target;
      if (contains(ref, doc.activeElement) && (!contains(ref, target) || !target.closest('button, [role="button"]'))) {
        selectFocusedDate();
      }
    };

    // Prevent touch scrolling while dragging
    const onTouchMove = e => {
      if (isDragging()) {
        e.preventDefault();
      }
    };
    win.addEventListener("pointerdown", onWindowPointerDown);
    win.addEventListener("pointerup", endDragging);
    win.addEventListener("pointercancel", endDragging);
    ref.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true
    });
    onCleanup(() => {
      win.removeEventListener("pointerdown", onWindowPointerDown);
      win.removeEventListener("pointerup", endDragging);
      win.removeEventListener("pointercancel", endDragging);
      ref?.removeEventListener("touchmove", onTouchMove, {
        capture: true
      });
    });
  });
  const dataset = createMemo(() => ({}));
  const context = {
    dataset,
    value,
    isDisabled: () => local.disabled ?? false,
    isReadOnly: () => local.readOnly ?? false,
    isDragging,
    isCellUnavailable,
    isCellDisabled,
    isCellSelected,
    isCellFocused,
    isCellInvalid,
    validationState,
    startDate,
    endDate,
    anchorDate,
    focusedDate: () => focusedDate(),
    visibleDuration: () => local.visibleDuration,
    selectionMode: () => local.selectionMode,
    locale,
    highlightedRange,
    direction,
    min,
    max,
    timeZone,
    messageFormatter,
    setStartDate,
    setAnchorDate,
    setIsFocused,
    setIsDragging,
    selectFocusedDate,
    selectDate,
    highlightDate,
    focusCell,
    focusNextDay,
    focusPreviousDay,
    focusNextPage,
    focusPreviousPage,
    focusNextRow,
    focusPreviousRow,
    focusSectionStart,
    focusSectionEnd,
    focusNextSection,
    focusPreviousSection,
    getDatesInWeek
  };
  return createComponent(CalendarContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        as: "div",
        role: "group",
        get ["aria-label"]() {
          return ariaLabel();
        }
      }, others));
    }
  });
}
function convertValue$1(newValue, oldValue) {
  // The display calendar should not have any effect on the emitted value.
  // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
  newValue = toCalendar(newValue, oldValue?.calendar || new GregorianCalendar());

  // Preserve time if the input value had one.
  if (oldValue && "hour" in oldValue) {
    return oldValue.set(newValue);
  }
  return newValue;
}

var index$m = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Body: CalendarBody,
  Grid: CalendarGrid,
  GridBody: CalendarGridBody,
  GridBodyCell: CalendarGridBodyCell,
  GridBodyCellTrigger: CalendarGridBodyCellTrigger,
  GridBodyRow: CalendarGridBodyRow,
  GridHeader: CalendarGridHeader,
  GridHeaderCell: CalendarGridHeaderCell,
  GridHeaderRow: CalendarGridHeaderRow,
  Header: CalendarHeader,
  Heading: CalendarHeading,
  NextTrigger: CalendarNextTrigger,
  PrevTrigger: CalendarPrevTrigger,
  Root: CalendarRoot
});

const CheckboxContext = createContext();
function useCheckboxContext() {
  const context = useContext(CheckboxContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCheckboxContext` must be used within a `Checkbox` component");
  }
  return context;
}

/**
 * The element that visually represents a checkbox.
 */
function CheckboxControl(props) {
  const formControlContext = useFormControlContext();
  const context = useCheckboxContext();
  props = mergeDefaultProps({
    id: context.generateId("control")
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
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    onClick: onClick,
    onKeyDown: onKeyDown
  }, () => formControlContext.dataset(), () => context.dataset(), others));
}

/**
 * The description that gives the user more information on the checkbox.
 */
function CheckboxDescription(props) {
  const context = useCheckboxContext();
  return createComponent(FormControlDescription, mergeProps$1(() => context.dataset(), props));
}

/**
 * The error message that gives the user information about how to fix a validation error on the checkbox.
 */
function CheckboxErrorMessage(props) {
  const context = useCheckboxContext();
  return createComponent(FormControlErrorMessage, mergeProps$1(() => context.dataset(), props));
}

/**
 * The visual indicator rendered when the checkbox is in a checked or indeterminate state.
 * You can style this element directly, or you can use it as a wrapper to put an icon into, or both.
 */
function CheckboxIndicator(props) {
  const formControlContext = useFormControlContext();
  const context = useCheckboxContext();
  props = mergeDefaultProps({
    id: context.generateId("indicator")
  }, props);
  const [local, others] = splitProps(props, ["ref", "forceMount"]);
  const presence = createPresence(() => local.forceMount || context.indeterminate() || context.checked());
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(presence.setRef, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        }
      }, () => formControlContext.dataset(), () => context.dataset(), others));
    }
  });
}

const _tmpl$$g = /*#__PURE__*/template(`<input type="checkbox">`);
/**
 * The native html input that is visually hidden in the checkbox.
 */
function CheckboxInput(props) {
  let ref;
  const formControlContext = useFormControlContext();
  const context = useCheckboxContext();
  props = mergeDefaultProps({
    id: context.generateId("input")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "style", "onChange", "onFocus", "onBlur"], FORM_CONTROL_FIELD_PROP_NAMES);
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  const onChange = e => {
    callHandler(e, local.onChange);
    e.stopPropagation();
    const target = e.target;
    context.setIsChecked(target.checked);

    // Unlike in React, inputs `checked` state can be out of sync with our toggle state.
    // for example a readonly `<input type="checkbox" />` is always "checkable".
    //
    // Also, even if an input is controlled (ex: `<input type="checkbox" checked={isChecked} />`,
    // clicking on the input will change its internal `checked` state.
    //
    // To prevent this, we need to force the input `checked` state to be in sync with the toggle state.
    target.checked = context.checked();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    context.setIsFocused(true);
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    context.setIsFocused(false);
  };

  // indeterminate is a property, but it can only be set via javascript
  // https://css-tricks.com/indeterminate-checkboxes/
  // Unlike in React, inputs `indeterminate` state can be out of sync with our.
  // Clicking on the input will change its internal `indeterminate` state.
  // To prevent this, we need to force the input `indeterminate` state to be in sync with our.
  createEffect(on([() => ref, () => context.indeterminate(), () => context.checked()], ([ref, indeterminate]) => {
    if (ref) {
      ref.indeterminate = !!indeterminate;
    }
  }));
  return (() => {
    const _el$ = _tmpl$$g();
    _el$.addEventListener("blur", onBlur);
    _el$.addEventListener("focus", onFocus);
    _el$.addEventListener("change", onChange);
    const _ref$ = mergeRefs(el => {
      context.setInputRef(el);
      ref = el;
    }, local.ref);
    typeof _ref$ === "function" && use(_ref$, _el$);
    spread(_el$, mergeProps$1({
      get id() {
        return fieldProps.id();
      },
      get name() {
        return formControlContext.name();
      },
      get value() {
        return context.value();
      },
      get checked() {
        return context.checked();
      },
      get required() {
        return formControlContext.isRequired();
      },
      get disabled() {
        return formControlContext.isDisabled();
      },
      get readonly() {
        return formControlContext.isReadOnly();
      },
      get style() {
        return {
          ...visuallyHiddenStyles,
          ...local.style
        };
      },
      get ["aria-label"]() {
        return fieldProps.ariaLabel();
      },
      get ["aria-labelledby"]() {
        return fieldProps.ariaLabelledBy();
      },
      get ["aria-describedby"]() {
        return fieldProps.ariaDescribedBy();
      },
      get ["aria-invalid"]() {
        return formControlContext.validationState() === "invalid" || undefined;
      },
      get ["aria-required"]() {
        return formControlContext.isRequired() || undefined;
      },
      get ["aria-disabled"]() {
        return formControlContext.isDisabled() || undefined;
      },
      get ["aria-readonly"]() {
        return formControlContext.isReadOnly() || undefined;
      }
    }, () => formControlContext.dataset(), () => context.dataset(), others), false, false);
    return _el$;
  })();
}

/**
 * The label that gives the user information on the checkbox.
 */
function CheckboxLabel(props) {
  const context = useCheckboxContext();
  return createComponent(FormControlLabel, mergeProps$1(() => context.dataset(), props));
}

/**
 * A control that allows the user to toggle between checked and not checked.
 */
function CheckboxRoot(props) {
  let ref;
  const defaultId = `checkbox-${createUniqueId()}`;
  props = mergeDefaultProps({
    value: "on",
    id: defaultId
  }, props);
  const [local, formControlProps, others] = splitProps(props, ["ref", "children", "value", "checked", "defaultChecked", "indeterminate", "onChange", "onPointerDown"], FORM_CONTROL_PROP_NAMES);
  const [inputRef, setInputRef] = createSignal();
  const [isFocused, setIsFocused] = createSignal(false);
  const {
    formControlContext
  } = createFormControl(formControlProps);
  const state = createToggleState({
    isSelected: () => local.checked,
    defaultIsSelected: () => local.defaultChecked,
    onSelectedChange: selected => local.onChange?.(selected),
    isDisabled: () => formControlContext.isDisabled(),
    isReadOnly: () => formControlContext.isReadOnly()
  });
  createFormResetListener(() => ref, () => state.setIsSelected(local.defaultChecked ?? false));
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // For consistency with native, prevent the input blurs on pointer down.
    if (isFocused()) {
      e.preventDefault();
    }
  };
  const dataset = createMemo(() => ({
    "data-checked": state.isSelected() ? "" : undefined,
    "data-indeterminate": local.indeterminate ? "" : undefined
  }));
  const context = {
    value: () => local.value,
    dataset,
    checked: () => state.isSelected(),
    indeterminate: () => local.indeterminate ?? false,
    inputRef,
    generateId: createGenerateId(() => access(formControlProps.id)),
    toggle: () => state.toggle(),
    setIsChecked: isChecked => state.setIsSelected(isChecked),
    setIsFocused,
    setInputRef
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(CheckboxContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            ref(r$) {
              const _ref$ = mergeRefs(el => ref = el, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "group",
            get id() {
              return access(formControlProps.id);
            },
            onPointerDown: onPointerDown
          }, () => formControlContext.dataset(), dataset, others, {
            get children() {
              return createComponent(CheckboxRootChild, {
                state: context,
                get children() {
                  return local.children;
                }
              });
            }
          }));
        }
      });
    }
  });
}
function CheckboxRootChild(props) {
  const resolvedChildren = children(() => {
    const body = props.children;
    return isFunction(body) ? body(props.state) : body;
  });
  return memo(resolvedChildren);
}

var index$l = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Control: CheckboxControl,
  Description: CheckboxDescription,
  ErrorMessage: CheckboxErrorMessage,
  Indicator: CheckboxIndicator,
  Input: CheckboxInput,
  Label: CheckboxLabel,
  Root: CheckboxRoot
});

const PopperContext = createContext();
function usePopperContext() {
  const context = useContext(PopperContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `usePopperContext` must be used within a `Popper` component");
  }
  return context;
}

const _tmpl$$f = /*#__PURE__*/template(`<svg display="block" viewBox="0 0 30 30"><g><path fill="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z"></path><path stroke="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z">`);
const DEFAULT_SIZE = 30;
const HALF_DEFAULT_SIZE = DEFAULT_SIZE / 2;
const ROTATION_DEG = {
  top: 180,
  right: -90,
  bottom: 0,
  left: 90
};
/**
 * An optional arrow element to render alongside the popper content.
 * Must be rendered in the popper content.
 */
function PopperArrow(props) {
  const context = usePopperContext();
  props = mergeDefaultProps({
    size: DEFAULT_SIZE
  }, props);
  const [local, others] = splitProps(props, ["ref", "style", "children", "size"]);
  const dir = () => context.currentPlacement().split("-")[0];
  const contentStyle = createComputedStyle(context.contentRef);
  const fill = () => contentStyle()?.getPropertyValue("background-color") || "none";
  const stroke = () => contentStyle()?.getPropertyValue(`border-${dir()}-color`) || "none";
  const borderWidth = () => contentStyle()?.getPropertyValue(`border-${dir()}-width`) || "0px";
  const strokeWidth = () => {
    return parseInt(borderWidth()) * 2 * (DEFAULT_SIZE / local.size);
  };
  const rotate = () => {
    return `rotate(${ROTATION_DEG[dir()]} ${HALF_DEFAULT_SIZE} ${HALF_DEFAULT_SIZE})`;
  };
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.setArrowRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    "aria-hidden": "true",
    get style() {
      return {
        // server side rendering
        position: "absolute",
        "font-size": `${local.size}px`,
        width: "1em",
        height: "1em",
        "pointer-events": "none",
        fill: fill(),
        stroke: stroke(),
        "stroke-width": strokeWidth(),
        ...local.style
      };
    }
  }, others, {
    get children() {
      const _el$ = _tmpl$$f(),
        _el$2 = _el$.firstChild,
        _el$3 = _el$2.firstChild;
        _el$3.nextSibling;
      effect(() => setAttribute(_el$2, "transform", rotate()));
      return _el$;
    }
  }));
}
function createComputedStyle(element) {
  const [style, setStyle] = createSignal();
  createEffect(() => {
    const el = element();
    el && setStyle(getWindow(el).getComputedStyle(el));
  });
  return style;
}

/**
 * The wrapper component that positions the popper content relative to the popper anchor.
 */
function PopperPositioner(props) {
  const context = usePopperContext();
  const [local, others] = splitProps(props, ["ref", "style"]);
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.setPositionerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    "data-popper-positioner": "",
    get style() {
      return {
        position: "absolute",
        top: 0,
        left: 0,
        "min-width": "max-content",
        ...local.style
      };
    }
  }, others));
}

function createDOMRect(anchorRect) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0
  } = anchorRect ?? {};
  if (typeof DOMRect === "function") {
    return new DOMRect(x, y, width, height);
  }

  // JSDOM doesn't support DOMRect constructor.
  const rect = {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x
  };
  return {
    ...rect,
    toJSON: () => rect
  };
}
function getAnchorElement(anchor, getAnchorRect) {
  // https://floating-ui.com/docs/virtual-elements
  const contextElement = anchor;
  return {
    contextElement,
    getBoundingClientRect: () => {
      const anchorRect = getAnchorRect(anchor);
      if (anchorRect) {
        return createDOMRect(anchorRect);
      }
      if (anchor) {
        return anchor.getBoundingClientRect();
      }
      return createDOMRect();
    }
  };
}
function isValidPlacement(flip) {
  return /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(flip);
}
const REVERSE_BASE_PLACEMENT = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
};
function getTransformOrigin(placement, readingDirection) {
  const [basePlacement, alignment] = placement.split("-");
  const reversePlacement = REVERSE_BASE_PLACEMENT[basePlacement];
  if (!alignment) {
    return `${reversePlacement} center`;
  }
  if (basePlacement === "left" || basePlacement === "right") {
    return `${reversePlacement} ${alignment === "start" ? "top" : "bottom"}`;
  }
  if (alignment === "start") {
    return `${reversePlacement} ${readingDirection === "rtl" ? "right" : "left"}`;
  }
  return `${reversePlacement} ${readingDirection === "rtl" ? "left" : "right"}`;
}

/**
 * Display a floating content relative to an anchor element with an optional arrow.
 */
function PopperRoot(props) {
  props = mergeDefaultProps({
    getAnchorRect: anchor => anchor?.getBoundingClientRect(),
    placement: "bottom",
    gutter: 0,
    shift: 0,
    flip: true,
    slide: true,
    overlap: false,
    sameWidth: false,
    fitViewport: false,
    hideWhenDetached: false,
    detachedPadding: 0,
    arrowPadding: 4,
    overflowPadding: 8
  }, props);
  const [positionerRef, setPositionerRef] = createSignal();
  const [arrowRef, setArrowRef] = createSignal();
  const [currentPlacement, setCurrentPlacement] = createSignal(props.placement);

  // Floating UI - reference element.
  const anchorRef = () => getAnchorElement(props.anchorRef(), props.getAnchorRect);
  const {
    direction
  } = useLocale();
  async function updatePosition() {
    const referenceEl = anchorRef();
    const floatingEl = positionerRef();
    const arrowEl = arrowRef();
    if (!referenceEl || !floatingEl) {
      return;
    }
    const arrowOffset = (arrowEl?.clientHeight || 0) / 2;
    const finalGutter = typeof props.gutter === "number" ? props.gutter + arrowOffset : props.gutter ?? arrowOffset;
    floatingEl.style.setProperty("--kb-popper-content-overflow-padding", `${props.overflowPadding}px`);

    // Virtual element doesn't work without this ¯\_(ツ)_/¯
    referenceEl.getBoundingClientRect();
    const middleware = [
    // https://floating-ui.com/docs/offset
    offset(({
      placement
    }) => {
      // If there's no placement alignment (*-start or *-end), we'll
      // fall back to the crossAxis offset as it also works for
      // center-aligned placements.
      const hasAlignment = !!placement.split("-")[1];
      return {
        mainAxis: finalGutter,
        crossAxis: !hasAlignment ? props.shift : undefined,
        alignmentAxis: props.shift
      };
    })];
    if (props.flip !== false) {
      const fallbackPlacements = typeof props.flip === "string" ? props.flip.split(" ") : undefined;
      if (fallbackPlacements !== undefined && !fallbackPlacements.every(isValidPlacement)) {
        throw new Error("`flip` expects a spaced-delimited list of placements");
      }

      // https://floating-ui.com/docs/flip
      middleware.push(flip({
        padding: props.overflowPadding,
        fallbackPlacements: fallbackPlacements
      }));
    }
    if (props.slide || props.overlap) {
      // https://floating-ui.com/docs/shift
      middleware.push(shift({
        mainAxis: props.slide,
        crossAxis: props.overlap,
        padding: props.overflowPadding
      }));
    }

    // https://floating-ui.com/docs/size
    middleware.push(size({
      padding: props.overflowPadding,
      apply({
        availableWidth,
        availableHeight,
        rects
      }) {
        const referenceWidth = Math.round(rects.reference.width);
        availableWidth = Math.floor(availableWidth);
        availableHeight = Math.floor(availableHeight);
        floatingEl.style.setProperty("--kb-popper-anchor-width", `${referenceWidth}px`);
        floatingEl.style.setProperty("--kb-popper-content-available-width", `${availableWidth}px`);
        floatingEl.style.setProperty("--kb-popper-content-available-height", `${availableHeight}px`);
        if (props.sameWidth) {
          floatingEl.style.width = `${referenceWidth}px`;
        }
        if (props.fitViewport) {
          floatingEl.style.maxWidth = `${availableWidth}px`;
          floatingEl.style.maxHeight = `${availableHeight}px`;
        }
      }
    }));

    // https://floating-ui.com/docs/hide
    if (props.hideWhenDetached) {
      middleware.push(hide({
        padding: props.detachedPadding
      }));
    }

    // https://floating-ui.com/docs/arrow
    if (arrowEl) {
      middleware.push(arrow({
        element: arrowEl,
        padding: props.arrowPadding
      }));
    }

    // https://floating-ui.com/docs/computePosition
    const pos = await computePosition(referenceEl, floatingEl, {
      placement: props.placement,
      strategy: "absolute",
      middleware,
      platform: {
        ...platform,
        isRTL: () => direction() === "rtl"
      }
    });

    // Sync the new updated placement of floating-ui with our current placement and notify parent.
    setCurrentPlacement(pos.placement);
    props.onCurrentPlacementChange?.(pos.placement);
    if (!floatingEl) {
      return;
    }
    floatingEl.style.setProperty("--kb-popper-content-transform-origin", getTransformOrigin(pos.placement, direction()));
    const x = Math.round(pos.x);
    const y = Math.round(pos.y);
    let visibility;
    if (props.hideWhenDetached) {
      visibility = pos.middlewareData.hide?.referenceHidden ? "hidden" : "visible";
    }

    // https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
    Object.assign(floatingEl.style, {
      top: "0",
      left: "0",
      transform: `translate3d(${x}px, ${y}px, 0)`,
      visibility
    });

    // https://floating-ui.com/docs/arrow#usage
    if (arrowEl && pos.middlewareData.arrow) {
      const {
        x: arrowX,
        y: arrowY
      } = pos.middlewareData.arrow;
      const dir = pos.placement.split("-")[0];
      Object.assign(arrowEl.style, {
        left: arrowX != null ? `${arrowX}px` : "",
        top: arrowY != null ? `${arrowY}px` : "",
        [dir]: "100%"
      });
    }
  }
  createEffect(() => {
    const referenceEl = anchorRef();
    const floatingEl = positionerRef();
    if (!referenceEl || !floatingEl) {
      return;
    }

    // https://floating-ui.com/docs/autoUpdate
    const cleanupAutoUpdate = autoUpdate(referenceEl, floatingEl, updatePosition, {
      // JSDOM doesn't support ResizeObserver
      elementResize: typeof ResizeObserver === "function"
    });
    onCleanup(cleanupAutoUpdate);
  });

  // Makes sure the positioner element has the same z-index as the popper content element,
  // so users only need to set the z-index once.
  createEffect(() => {
    const positioner = positionerRef();
    const content = props.contentRef();
    if (!positioner || !content) {
      return;
    }
    queueMicrotask(() => {
      positioner.style.zIndex = getComputedStyle(content).zIndex;
    });
  });
  const context = {
    currentPlacement,
    contentRef: () => props.contentRef(),
    setPositionerRef,
    setArrowRef
  };
  return createComponent(PopperContext.Provider, {
    value: context,
    get children() {
      return props.children;
    }
  });
}

const ComboboxContext = createContext();
function useComboboxContext() {
  const context = useContext(ComboboxContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useComboboxContext` must be used within a `Combobox` component");
  }
  return context;
}

/**
 * The component that pops out when the combobox is open.
 */
function ComboboxContent(props) {
  let ref;
  const context = useComboboxContext();
  const [local, others] = splitProps(props, ["ref", "id", "style", "onCloseAutoFocus", "onFocusOutside"]);
  const close = () => {
    context.resetInputValue(context.listState().selectionManager().selectedKeys());
    context.close();
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);

    // When focus is trapped (in modal mode), a `focusout` event may still happen.
    // We make sure we don't trigger our `onDismiss` in such case.
    if (context.isOpen() && context.isModal()) {
      e.preventDefault();
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => !(context.isOpen() && context.isModal()),
    targets: () => {
      const excludedElements = [];
      if (ref) {
        excludedElements.push(ref);
      }
      const controlEl = context.controlRef();
      if (controlEl) {
        excludedElements.push(controlEl);
      }
      return excludedElements;
    }
  });
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isOpen() && (context.isModal() || context.preventScroll()))
  });
  createFocusScope({
    trapFocus: () => context.isOpen() && context.isModal(),
    onMountAutoFocus: e => {
      // We prevent open autofocus because it's handled by the `Listbox`.
      e.preventDefault();
    },
    onUnmountAutoFocus: e => {
      local.onCloseAutoFocus?.(e);
      if (!e.defaultPrevented) {
        focusWithoutScrolling(context.inputRef());
        e.preventDefault();
      }
    }
  }, () => ref);
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
                ref = el;
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            get disableOutsidePointerEvents() {
              return memo(() => !!context.isModal())() && context.isOpen();
            },
            get excludedElements() {
              return [context.controlRef];
            },
            get style() {
              return {
                "--kb-combobox-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            onFocusOutside: onFocusOutside,
            onDismiss: close
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

function ComboboxInput(props) {
  let ref;
  const formControlContext = useFormControlContext();
  const context = useComboboxContext();
  props = mergeDefaultProps({
    id: context.generateId("input")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "disabled", "onInput", "onPointerDown", "onClick", "onKeyDown", "onFocus", "onBlur"], FORM_CONTROL_FIELD_PROP_NAMES);
  const collection = () => context.listState().collection();
  const selectionManager = () => context.listState().selectionManager();
  const isDisabled = () => {
    return local.disabled || context.isDisabled() || formControlContext.isDisabled();
  };
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  const onInput = e => {
    callHandler(e, local.onInput);
    if (formControlContext.isReadOnly() || isDisabled()) {
      return;
    }
    const target = e.target;
    context.setInputValue(target.value);

    // Unlike in React, inputs `value` can be out of sync with our value state.
    // even if an input is controlled (ex: `<input value="foo" />`,
    // typing on the input will change its internal `value`.
    //
    // To prevent this, we need to force the input `value` to be in sync with the input value state.
    target.value = context.inputValue() ?? "";
    if (context.isOpen()) {
      if (collection().getSize() <= 0 && !context.allowsEmptyCollection()) {
        context.close();
      }
    } else {
      if (collection().getSize() > 0) {
        context.open(false, "input");
      }
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (formControlContext.isReadOnly() || isDisabled()) {
      return;
    }
    if (context.isOpen()) {
      callHandler(e, context.onInputKeyDown);
    }
    switch (e.key) {
      case "Enter":
        // Prevent form submission if menu is open since we may be selecting an option.
        if (context.isOpen()) {
          e.preventDefault();
          const focusedKey = selectionManager().focusedKey();
          if (focusedKey != null) {
            selectionManager().select(focusedKey);
          }
        }
        break;
      case "Tab":
        if (context.isOpen()) {
          context.close();
          context.resetInputValue(context.listState().selectionManager().selectedKeys());
        }
        break;
      case "Escape":
        if (context.isOpen()) {
          context.close();
          context.resetInputValue(context.listState().selectionManager().selectedKeys());
        } else {
          // trigger a remove selection.
          context.setInputValue("");
        }
        break;
      case "ArrowDown":
        if (!context.isOpen()) {
          context.open(e.altKey ? false : "first", "manual");
        }
        break;
      case "ArrowUp":
        if (!context.isOpen()) {
          context.open("last", "manual");
        } else {
          if (e.altKey) {
            context.close();
            context.resetInputValue(context.listState().selectionManager().selectedKeys());
          }
        }
        break;
      case "ArrowLeft":
      case "ArrowRight":
        selectionManager().setFocusedKey(undefined);
        break;
      case "Backspace":
        // Remove last selection in multiple mode if input is empty.
        if (context.removeOnBackspace() && selectionManager().selectionMode() === "multiple" && context.inputValue() === "") {
          const lastSelectedKey = [...selectionManager().selectedKeys()].pop() ?? "";
          selectionManager().toggleSelection(lastSelectedKey);
        }
        break;
    }
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    if (context.isInputFocused()) {
      return;
    }
    context.setIsInputFocused(true);
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);

    // Ignore blur if focused moved into the control or menu.
    if (contains(context.controlRef(), e.relatedTarget) || contains(context.contentRef(), e.relatedTarget)) {
      return;
    }
    context.setIsInputFocused(false);
  };

  // If a touch happens on direct center of Combobox input, might be virtual click from iPad so open ComboBox menu
  let lastEventTime = 0;
  const onTouchEnd = e => {
    if (!ref || formControlContext.isReadOnly() || isDisabled()) {
      return;
    }

    // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
    if (e.timeStamp - lastEventTime < 500) {
      e.preventDefault();
      ref.focus();
      return;
    }
    const rect = e.target.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const centerX = Math.ceil(rect.left + 0.5 * rect.width);
    const centerY = Math.ceil(rect.top + 0.5 * rect.height);
    if (touch.clientX === centerX && touch.clientY === centerY) {
      e.preventDefault();
      ref.focus();
      context.toggle(false, "manual");
      lastEventTime = e.timeStamp;
    }
  };

  // Omit `formControlContext.name()` here because it's used in the hidden select.
  return createComponent(Polymorphic, mergeProps$1({
    as: "input",
    ref(r$) {
      const _ref$ = mergeRefs(el => {
        context.setInputRef(el);
        ref = el;
      }, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return fieldProps.id();
    },
    get value() {
      return context.inputValue();
    },
    get required() {
      return formControlContext.isRequired();
    },
    get disabled() {
      return formControlContext.isDisabled();
    },
    get readonly() {
      return formControlContext.isReadOnly();
    },
    get placeholder() {
      return context.placeholder();
    },
    type: "text",
    role: "combobox",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: "false",
    "aria-haspopup": "listbox",
    "aria-autocomplete": "list",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.listboxId() : undefined;
    },
    get ["aria-activedescendant"]() {
      return context.activeDescendant();
    },
    get ["aria-label"]() {
      return fieldProps.ariaLabel();
    },
    get ["aria-labelledby"]() {
      return fieldProps.ariaLabelledBy();
    },
    get ["aria-describedby"]() {
      return fieldProps.ariaDescribedBy();
    },
    get ["aria-invalid"]() {
      return formControlContext.validationState() === "invalid" || undefined;
    },
    get ["aria-required"]() {
      return formControlContext.isRequired() || undefined;
    },
    get ["aria-disabled"]() {
      return formControlContext.isDisabled() || undefined;
    },
    get ["aria-readonly"]() {
      return formControlContext.isReadOnly() || undefined;
    },
    onInput: onInput,
    onKeyDown: onKeyDown,
    onFocus: onFocus,
    onBlur: onBlur,
    onTouchEnd: onTouchEnd
  }, () => context.dataset(), () => formControlContext.dataset(), others));
}

const ListboxContext = createContext();
function useListboxContext() {
  const context = useContext(ListboxContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useListboxContext` must be used within a `Listbox` component");
  }
  return context;
}

const ListboxItemContext = createContext();
function useListboxItemContext() {
  const context = useContext(ListboxItemContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useListboxItemContext` must be used within a `Listbox.Item` component");
  }
  return context;
}

/**
 * An item of the listbox.
 */
function ListboxItem(props) {
  let ref;
  const listBoxContext = useListboxContext();
  const defaultId = `${listBoxContext.generateId("item")}-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["ref", "item", "aria-label", "aria-labelledby", "aria-describedby", "onPointerMove", "onPointerDown", "onPointerUp", "onClick", "onKeyDown", "onMouseDown", "onFocus"]);
  const [labelId, setLabelId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const selectionManager = () => listBoxContext.listState().selectionManager();
  const isHighlighted = () => selectionManager().focusedKey() === local.item.key;
  const selectableItem = createSelectableItem({
    key: () => local.item.key,
    selectionManager: selectionManager,
    shouldSelectOnPressUp: listBoxContext.shouldSelectOnPressUp,
    allowsDifferentPressOrigin: () => {
      return listBoxContext.shouldSelectOnPressUp() && listBoxContext.shouldFocusOnHover();
    },
    shouldUseVirtualFocus: listBoxContext.shouldUseVirtualFocus,
    disabled: () => local.item.disabled
  }, () => ref);
  const ariaSelected = () => {
    if (selectionManager().selectionMode() === "none") {
      return undefined;
    }
    return selectableItem.isSelected();
  };

  // Safari with VoiceOver on macOS misreads options with aria-labelledby or aria-label as simply "text".
  // We should not map slots to the label and description on Safari and instead just have VoiceOver read the textContent.
  // https://bugs.webkit.org/show_bug.cgi?id=209279
  const isNotSafariMacOS = createMemo(() => !(isMac() && isWebKit()));
  const ariaLabel = () => isNotSafariMacOS() ? local["aria-label"] : undefined;
  const ariaLabelledBy = () => isNotSafariMacOS() ? labelId() : undefined;
  const ariaDescribedBy = () => isNotSafariMacOS() ? descriptionId() : undefined;
  const ariaPosInSet = () => {
    if (!listBoxContext.isVirtualized()) {
      return undefined;
    }
    const index = listBoxContext.listState().collection().getItem(local.item.key)?.index;
    return index != null ? index + 1 : undefined;
  };
  const ariaSetSize = () => {
    if (!listBoxContext.isVirtualized()) {
      return undefined;
    }
    return getItemCount(listBoxContext.listState().collection());
  };

  /**
   * We focus items on `pointerMove` to achieve the following:
   *
   * - Mouse over an item (it focuses)
   * - Leave mouse where it is and use keyboard to focus a different item
   * - Wiggle mouse without it leaving previously focused item
   * - Previously focused item should re-focus
   *
   * If we used `mouseOver`/`mouseEnter` it would not re-focus when the mouse
   * wiggles. This is to match native select implementation.
   */
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (e.pointerType !== "mouse") {
      return;
    }
    if (!selectableItem.isDisabled() && listBoxContext.shouldFocusOnHover()) {
      focusWithoutScrolling(e.currentTarget);
      selectionManager().setFocused(true);
      selectionManager().setFocusedKey(local.item.key);
    }
  };
  const dataset = createMemo(() => ({
    "data-disabled": selectableItem.isDisabled() ? "" : undefined,
    "data-selected": selectableItem.isSelected() ? "" : undefined,
    "data-highlighted": isHighlighted() ? "" : undefined
  }));
  const context = {
    isSelected: selectableItem.isSelected,
    dataset,
    generateId: createGenerateId(() => others.id),
    registerLabelId: createRegisterId(setLabelId),
    registerDescriptionId: createRegisterId(setDescriptionId)
  };
  return createComponent(ListboxItemContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "li",
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        role: "option",
        get tabIndex() {
          return selectableItem.tabIndex();
        },
        get ["aria-disabled"]() {
          return selectableItem.isDisabled();
        },
        get ["aria-selected"]() {
          return ariaSelected();
        },
        get ["aria-label"]() {
          return ariaLabel();
        },
        get ["aria-labelledby"]() {
          return ariaLabelledBy();
        },
        get ["aria-describedby"]() {
          return ariaDescribedBy();
        },
        get ["aria-posinset"]() {
          return ariaPosInSet();
        },
        get ["aria-setsize"]() {
          return ariaSetSize();
        },
        get ["data-key"]() {
          return selectableItem.dataKey();
        },
        get onPointerDown() {
          return composeEventHandlers([local.onPointerDown, selectableItem.onPointerDown]);
        },
        get onPointerUp() {
          return composeEventHandlers([local.onPointerUp, selectableItem.onPointerUp]);
        },
        get onClick() {
          return composeEventHandlers([local.onClick, selectableItem.onClick]);
        },
        get onKeyDown() {
          return composeEventHandlers([local.onKeyDown, selectableItem.onKeyDown]);
        },
        get onMouseDown() {
          return composeEventHandlers([local.onMouseDown, selectableItem.onMouseDown]);
        },
        get onFocus() {
          return composeEventHandlers([local.onFocus, selectableItem.onFocus]);
        },
        onPointerMove: onPointerMove
      }, dataset, others));
    }
  });
}

/**
 * An optional accessible description to be announced for the item.
 * Useful for items that have more complex content (e.g. icons, multiple lines of text, etc.)
 */
function ListboxItemDescription(props) {
  const context = useListboxItemContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerDescriptionId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * The visual indicator rendered when the item is selected.
 * You can style this element directly, or you can use it as a wrapper to put an icon into, or both.
 */
function ListboxItemIndicator(props) {
  const context = useListboxItemContext();
  props = mergeDefaultProps({
    id: context.generateId("indicator")
  }, props);
  const [local, others] = splitProps(props, ["forceMount"]);
  return createComponent(Show, {
    get when() {
      return local.forceMount || context.isSelected();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        "aria-hidden": "true"
      }, () => context.dataset(), others));
    }
  });
}

/**
 * An accessible label to be announced for the item.
 * Useful for items that have more complex content (e.g. icons, multiple lines of text, etc.)
 */
function ListboxItemLabel(props) {
  const context = useListboxItemContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerLabelId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * Listbox presents a list of options and allows a user to select one or more of them.
 */
function ListboxRoot(props) {
  let ref;
  const defaultId = `listbox-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    selectionMode: "single",
    virtualized: false
  }, props);
  const [local, others] = splitProps(props, ["ref", "children", "renderItem", "renderSection", "value", "defaultValue", "onChange", "options", "optionValue", "optionTextValue", "optionDisabled", "optionGroupChildren", "state", "keyboardDelegate", "autoFocus", "selectionMode", "shouldFocusWrap", "shouldUseVirtualFocus", "shouldSelectOnPressUp", "shouldFocusOnHover", "allowDuplicateSelectionEvents", "disallowEmptySelection", "selectionBehavior", "selectOnFocus", "disallowTypeAhead", "allowsTabNavigation", "virtualized", "scrollToItem", "scrollRef", "onKeyDown", "onMouseDown", "onFocusIn", "onFocusOut"]);
  const listState = createMemo(() => {
    if (local.state) {
      return local.state;
    }
    return createListState({
      selectedKeys: () => local.value,
      defaultSelectedKeys: () => local.defaultValue,
      onSelectionChange: local.onChange,
      allowDuplicateSelectionEvents: () => access(local.allowDuplicateSelectionEvents),
      disallowEmptySelection: () => access(local.disallowEmptySelection),
      selectionBehavior: () => access(local.selectionBehavior),
      selectionMode: () => access(local.selectionMode),
      dataSource: () => local.options ?? [],
      getKey: () => local.optionValue,
      getTextValue: () => local.optionTextValue,
      getDisabled: () => local.optionDisabled,
      getSectionChildren: () => local.optionGroupChildren
    });
  });
  const selectableList = createSelectableList({
    selectionManager: () => listState().selectionManager(),
    collection: () => listState().collection(),
    autoFocus: () => access(local.autoFocus),
    shouldFocusWrap: () => access(local.shouldFocusWrap),
    keyboardDelegate: () => local.keyboardDelegate,
    disallowEmptySelection: () => access(local.disallowEmptySelection),
    selectOnFocus: () => access(local.selectOnFocus),
    disallowTypeAhead: () => access(local.disallowTypeAhead),
    shouldUseVirtualFocus: () => access(local.shouldUseVirtualFocus),
    allowsTabNavigation: () => access(local.allowsTabNavigation),
    isVirtualized: () => local.virtualized,
    scrollToKey: () => local.scrollToItem
  }, () => ref, () => local.scrollRef?.());
  const context = {
    listState,
    generateId: createGenerateId(() => others.id),
    shouldUseVirtualFocus: () => props.shouldUseVirtualFocus,
    shouldSelectOnPressUp: () => props.shouldSelectOnPressUp,
    shouldFocusOnHover: () => props.shouldFocusOnHover,
    isVirtualized: () => local.virtualized
  };
  return createComponent(ListboxContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "ul",
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        role: "listbox",
        get tabIndex() {
          return selectableList.tabIndex();
        },
        get ["aria-multiselectable"]() {
          return listState().selectionManager().selectionMode() === "multiple" ? true : undefined;
        },
        get onKeyDown() {
          return composeEventHandlers([local.onKeyDown, selectableList.onKeyDown]);
        },
        get onMouseDown() {
          return composeEventHandlers([local.onMouseDown, selectableList.onMouseDown]);
        },
        get onFocusIn() {
          return composeEventHandlers([local.onFocusIn, selectableList.onFocusIn]);
        },
        get onFocusOut() {
          return composeEventHandlers([local.onFocusOut, selectableList.onFocusOut]);
        }
      }, others, {
        get children() {
          return createComponent(Show, {
            get when() {
              return !local.virtualized;
            },
            get fallback() {
              return local.children?.(listState().collection);
            },
            get children() {
              return createComponent(Key, {
                get each() {
                  return [...listState().collection()];
                },
                by: "key",
                children: item => createComponent(Switch, {
                  get children() {
                    return [createComponent(Match, {
                      get when() {
                        return item().type === "section";
                      },
                      get children() {
                        return local.renderSection?.(item());
                      }
                    }), createComponent(Match, {
                      get when() {
                        return item().type === "item";
                      },
                      get children() {
                        return local.renderItem?.(item());
                      }
                    })];
                  }
                })
              });
            }
          });
        }
      }));
    }
  });
}

/**
 * A component used to render the label of a listbox option group.
 * It won't be focusable using arrow keys.
 */
function ListboxSection(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "li",
    role: "presentation"
  }, props));
}

var index$k = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Item: ListboxItem,
  ItemDescription: ListboxItemDescription,
  ItemIndicator: ListboxItemIndicator,
  ItemLabel: ListboxItemLabel,
  Root: ListboxRoot,
  Section: ListboxSection
});

/**
 * Contains all the items of a `Combobox`.
 */
function ComboboxListbox(props) {
  const formControlContext = useFormControlContext();
  const context = useComboboxContext();
  props = mergeDefaultProps({
    id: context.generateId("listbox")
  }, props);
  const [local, others] = splitProps(props, ["ref"]);
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(others.id, context.listboxAriaLabel(), undefined);
  };
  createEffect(() => onCleanup(context.registerListboxId(others.id)));
  return createComponent(ListboxRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setListboxRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get state() {
      return context.listState();
    },
    get autoFocus() {
      return context.autoFocus();
    },
    shouldUseVirtualFocus: true,
    shouldSelectOnPressUp: true,
    shouldFocusOnHover: true,
    get ["aria-label"]() {
      return context.listboxAriaLabel();
    },
    get ["aria-labelledby"]() {
      return ariaLabelledBy();
    },
    get renderItem() {
      return context.renderItem;
    },
    get renderSection() {
      return context.renderSection;
    }
  }, others));
}

/**
 * Portals its children into the `body` when the combobox is open.
 */
function ComboboxPortal(props) {
  const context = useComboboxContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/**
 * Contains the combobox input and trigger.
 */
function ComboboxControl(props) {
  const formControlContext = useFormControlContext();
  const context = useComboboxContext();
  const [local, others] = splitProps(props, ["ref", "children"]);
  const selectionManager = () => context.listState().selectionManager();
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.setControlRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    }
  }, () => context.dataset(), () => formControlContext.dataset(), others, {
    get children() {
      return createComponent(ComboboxControlChild, {
        state: {
          selectedOptions: () => context.selectedOptions(),
          remove: option => context.removeOptionFromSelection(option),
          clear: () => selectionManager().clearSelection()
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
}
function ComboboxControlChild(props) {
  const resolvedChildren = children(() => {
    const body = props.children;
    return isFunction(body) ? body(props.state) : body;
  });
  return memo(resolvedChildren);
}

const _tmpl$$e = /*#__PURE__*/template(`<option>`),
  _tmpl$2 = /*#__PURE__*/template(`<div aria-hidden="true"><input type="text"><select tabindex="-1"><option>`);

// In Safari, the <select> cannot have `display: none` or `hidden` for autofill to work.
// In Firefox, there must be a <label> to identify the <select> whereas other browsers
// seem to identify it just by surrounding text.
// The solution is to use <VisuallyHidden> to hide the elements, which clips the elements to a
// 1px rectangle. In addition, we hide from screen readers with aria-hidden, and make the <select>
// non tabbable with tabIndex={-1}.
//
// In mobile browsers, there are next/previous buttons above the software keyboard for navigating
// between fields in a form. These only support native form inputs that are tabbable. In order to
// support those, an additional hidden input is used to marshall focus to the button. It is tabbable
// except when the button is focused, so that shift tab works properly to go to the actual previous
// input in the form. Using the <select> for this also works, but Safari on iOS briefly flashes
// the native menu on focus, so this isn't ideal. A font-size of 16px or greater is required to
// prevent Safari from zooming in on the input when it is focused.
//
// If the current interaction modality is null, then the user hasn't interacted with the page yet.
// In this case, we set the tabIndex to -1 on the input element so that automated accessibility
// checkers don't throw false-positives about focusable elements inside an aria-hidden parent.
/**
 * Renders a hidden native `<select>` element, which can be used to support browser
 * form autofill, mobile form navigation, and native form submission.
 */
function HiddenSelectBase(props) {
  let ref;
  const [local, others] = splitProps(props, ["ref", "onChange", "collection", "selectionManager", "isOpen", "isMultiple", "isVirtualized", "focusTrigger"]);
  const formControlContext = useFormControlContext();
  const [isInternalChangeEvent, setIsInternalChangeEvent] = createSignal(false);
  const renderOption = key => {
    const item = local.collection.getItem(key);
    return createComponent(Show, {
      get when() {
        return item?.type === "item";
      },
      get children() {
        const _el$ = _tmpl$$e();
        _el$.value = key;
        insert(_el$, () => item?.textValue);
        effect(() => _el$.selected = local.selectionManager.isSelected(key));
        return _el$;
      }
    });
  };

  // Dispatch native event on selection change for form libraries.
  createEffect(on(() => local.selectionManager.selectedKeys(), (keys, prevKeys) => {
    if (prevKeys && isSameSelection(keys, prevKeys)) {
      return;
    }
    setIsInternalChangeEvent(true);
    ref?.dispatchEvent(new Event("input", {
      bubbles: true,
      cancelable: true
    }));
    ref?.dispatchEvent(new Event("change", {
      bubbles: true,
      cancelable: true
    }));
  }, {
    defer: true
  }));

  // If virtualized, only render the selected options in the hidden <select> so the value can be submitted to a server.
  // Otherwise, render all options so that browser autofill will work.
  return (() => {
    const _el$2 = _tmpl$2(),
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.nextSibling;
      _el$4.firstChild;
    _el$3.addEventListener("focus", () => local.focusTrigger());
    _el$3.style.setProperty("font-size", "16px");
    _el$4.addEventListener("change", e => {
      callHandler(e, local.onChange);

      // Prevent internally fired change event to update the selection
      // which would result in an infinite loop.
      if (!isInternalChangeEvent()) {
        // enable form autofill
        local.selectionManager.setSelectedKeys(new Set([e.target.value]));
      }
      setIsInternalChangeEvent(false);
    });
    const _ref$ = mergeRefs(el => ref = el, local.ref);
    typeof _ref$ === "function" && use(_ref$, _el$4);
    spread(_el$4, mergeProps$1({
      get multiple() {
        return local.isMultiple;
      },
      get name() {
        return formControlContext.name();
      },
      get required() {
        return formControlContext.isRequired();
      },
      get disabled() {
        return formControlContext.isDisabled();
      },
      get size() {
        return local.collection.getSize();
      },
      get value() {
        return local.selectionManager.firstSelectedKey() ?? "";
      }
    }, others), false, true);
    insert(_el$4, createComponent(Show, {
      get when() {
        return local.isVirtualized;
      },
      get fallback() {
        return createComponent(For, {
          get each() {
            return [...local.collection.getKeys()];
          },
          children: renderOption
        });
      },
      get children() {
        return createComponent(For, {
          get each() {
            return [...local.selectionManager.selectedKeys()];
          },
          children: renderOption
        });
      }
    }), null);
    effect(_p$ => {
      const _v$ = visuallyHiddenStyles,
        _v$2 = local.selectionManager.isFocused() || local.isOpen ? -1 : 0,
        _v$3 = formControlContext.isRequired(),
        _v$4 = formControlContext.isDisabled(),
        _v$5 = formControlContext.isReadOnly();
      _p$._v$ = style(_el$2, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && setAttribute(_el$3, "tabindex", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && (_el$3.required = _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && (_el$3.disabled = _p$._v$4 = _v$4);
      _v$5 !== _p$._v$5 && (_el$3.readOnly = _p$._v$5 = _v$5);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$2;
  })();
}

function ComboboxHiddenSelect(props) {
  const context = useComboboxContext();
  return createComponent(HiddenSelectBase, mergeProps$1({
    get collection() {
      return context.listState().collection();
    },
    get selectionManager() {
      return context.listState().selectionManager();
    },
    get isOpen() {
      return context.isOpen();
    },
    get isMultiple() {
      return context.isMultiple();
    },
    get isVirtualized() {
      return context.isVirtualized();
    },
    focusTrigger: () => context.inputRef()?.focus()
  }, props));
}

/**
 * A small icon often displayed next to the value as a visual affordance for the fact it can be open.
 * It renders a `▼` by default, but you can use your own icon `children`.
 */
function ComboboxIcon(props) {
  const context = useComboboxContext();
  props = mergeDefaultProps({
    children: "▼"
  }, props);
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    "aria-hidden": "true"
  }, () => context.dataset(), props));
}

const COMBOBOX_INTL_MESSAGES = {
  "ar-AE": {
    triggerLabel: "عرض المقترحات",
    countAnnouncement: "{optionCount, plural, one {# خيار} other {# خيارات}} متاحة.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, محدد} other {}}",
    listboxLabel: "مقترحات",
    selectedAnnouncement: "{optionText}، محدد"
  },
  "bg-BG": {
    triggerLabel: "Покажи предложения",
    countAnnouncement: "{optionCount, plural, one {# опция} other {# опции}} на разположение.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, избрани} other {}}",
    listboxLabel: "Предложения",
    selectedAnnouncement: "{optionText}, избрани"
  },
  "cs-CZ": {
    triggerLabel: "Zobrazit doporučení",
    countAnnouncement: "K dispozici {optionCount, plural, one {je # možnost} other {jsou/je # možnosti/-í}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true { (vybráno)} other {}}",
    listboxLabel: "Návrhy",
    selectedAnnouncement: "{optionText}, vybráno"
  },
  "da-DK": {
    triggerLabel: "Vis forslag",
    countAnnouncement: "{optionCount, plural, one {# mulighed tilgængelig} other {# muligheder tilgængelige}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, valgt} other {}}",
    listboxLabel: "Forslag",
    selectedAnnouncement: "{optionText}, valgt"
  },
  "de-DE": {
    triggerLabel: "Empfehlungen anzeigen",
    countAnnouncement: "{optionCount, plural, one {# Option} other {# Optionen}} verfügbar.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, ausgewählt} other {}}",
    listboxLabel: "Empfehlungen",
    selectedAnnouncement: "{optionText}, ausgewählt"
  },
  "el-GR": {
    triggerLabel: "Προβολή προτάσεων",
    countAnnouncement: "{optionCount, plural, one {# επιλογή} other {# επιλογές }} διαθέσιμες.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, επιλεγμένο} other {}}",
    listboxLabel: "Προτάσεις",
    selectedAnnouncement: "{optionText}, επιλέχθηκε"
  },
  "en-US": {
    focusAnnouncement: "{optionText}{isSelected, select, true {, selected} other {}}",
    countAnnouncement: "{optionCount, plural, one {# option} other {# options}} available.",
    selectedAnnouncement: "{optionText}, selected",
    triggerLabel: "Show suggestions",
    listboxLabel: "Suggestions"
  },
  "es-ES": {
    triggerLabel: "Mostrar sugerencias",
    countAnnouncement: "{optionCount, plural, one {# opción} other {# opciones}} disponible(s).",
    focusAnnouncement: "{optionText}{isSelected, select, true {, seleccionado} other {}}",
    listboxLabel: "Sugerencias",
    selectedAnnouncement: "{optionText}, seleccionado"
  },
  "et-EE": {
    triggerLabel: "Kuva soovitused",
    countAnnouncement: "{optionCount, plural, one {# valik} other {# valikud}} saadaval.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, valitud} other {}}",
    listboxLabel: "Soovitused",
    selectedAnnouncement: "{optionText}, valitud"
  },
  "fi-FI": {
    triggerLabel: "Näytä ehdotukset",
    countAnnouncement: "{optionCount, plural, one {# vaihtoehto} other {# vaihtoehdot}} saatavilla.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, valittu} other {}}",
    listboxLabel: "Ehdotukset",
    selectedAnnouncement: "{optionText}, valittu"
  },
  "fr-FR": {
    triggerLabel: "Afficher les suggestions",
    countAnnouncement: "{optionCount, plural, one {# option} other {# options}} disponible(s).",
    focusAnnouncement: "{optionText}{isSelected, select, true {, sélectionné(s)} other {}}",
    listboxLabel: "Suggestions",
    selectedAnnouncement: "{optionText}, sélectionné"
  },
  "he-IL": {
    triggerLabel: "הצג הצעות",
    countAnnouncement: "{optionCount, plural, one {אפשרות #} other {# אפשרויות}} במצב זמין.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, נבחר} other {}}",
    listboxLabel: "הצעות",
    selectedAnnouncement: "{optionText}, נבחר"
  },
  "hr-HR": {
    triggerLabel: "Prikaži prijedloge",
    countAnnouncement: "Dostupno još: {optionCount, plural, one {# opcija} other {# opcije/a}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, odabranih} other {}}",
    listboxLabel: "Prijedlozi",
    selectedAnnouncement: "{optionText}, odabrano"
  },
  "hu-HU": {
    triggerLabel: "Javaslatok megjelenítése",
    countAnnouncement: "{optionCount, plural, one {# lehetőség} other {# lehetőség}} áll rendelkezésre.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, kijelölve} other {}}",
    listboxLabel: "Javaslatok",
    selectedAnnouncement: "{optionText}, kijelölve"
  },
  "it-IT": {
    triggerLabel: "Mostra suggerimenti",
    countAnnouncement: "{optionCount, plural, one {# opzione disponibile} other {# opzioni disponibili}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, selezionato} other {}}",
    listboxLabel: "Suggerimenti",
    selectedAnnouncement: "{optionText}, selezionato"
  },
  "ja-JP": {
    triggerLabel: "候補を表示",
    countAnnouncement: "{optionCount, plural, one {# 個のオプション} other {# 個のオプション}}を利用できます。",
    focusAnnouncement: "{optionText}{isSelected, select, true {、選択済み} other {}}",
    listboxLabel: "候補",
    selectedAnnouncement: "{optionText}、選択済み"
  },
  "ko-KR": {
    triggerLabel: "제안 사항 표시",
    countAnnouncement: "{optionCount, plural, one {#개 옵션} other {#개 옵션}}을 사용할 수 있습니다.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, 선택됨} other {}}",
    listboxLabel: "제안",
    selectedAnnouncement: "{optionText}, 선택됨"
  },
  "lt-LT": {
    triggerLabel: "Rodyti pasiūlymus",
    countAnnouncement: "Yra {optionCount, plural, one {# parinktis} other {# parinktys (-ių)}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, pasirinkta} other {}}",
    listboxLabel: "Pasiūlymai",
    selectedAnnouncement: "{optionText}, pasirinkta"
  },
  "lv-LV": {
    triggerLabel: "Rādīt ieteikumus",
    countAnnouncement: "Pieejamo opciju skaits: {optionCount, plural, one {# opcija} other {# opcijas}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, atlasīta} other {}}",
    listboxLabel: "Ieteikumi",
    selectedAnnouncement: "{optionText}, atlasīta"
  },
  "nb-NO": {
    triggerLabel: "Vis forslag",
    countAnnouncement: "{optionCount, plural, one {# alternativ} other {# alternativer}} finnes.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, valgt} other {}}",
    listboxLabel: "Forslag",
    selectedAnnouncement: "{optionText}, valgt"
  },
  "nl-NL": {
    triggerLabel: "Suggesties weergeven",
    countAnnouncement: "{optionCount, plural, one {# optie} other {# opties}} beschikbaar.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, geselecteerd} other {}}",
    listboxLabel: "Suggesties",
    selectedAnnouncement: "{optionText}, geselecteerd"
  },
  "pl-PL": {
    triggerLabel: "Wyświetlaj sugestie",
    countAnnouncement: "dostępna/dostępne(-nych) {optionCount, plural, one {# opcja} other {# opcje(-i)}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, wybrano} other {}}",
    listboxLabel: "Sugestie",
    selectedAnnouncement: "{optionText}, wybrano"
  },
  "pt-BR": {
    triggerLabel: "Mostrar sugestões",
    countAnnouncement: "{optionCount, plural, one {# opção} other {# opções}} disponível.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, selecionado} other {}}",
    listboxLabel: "Sugestões",
    selectedAnnouncement: "{optionText}, selecionado"
  },
  "pt-PT": {
    triggerLabel: "Apresentar sugestões",
    countAnnouncement: "{optionCount, plural, one {# opção} other {# opções}} disponível.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, selecionado} other {}}",
    listboxLabel: "Sugestões",
    selectedAnnouncement: "{optionText}, selecionado"
  },
  "ro-RO": {
    triggerLabel: "Afișare sugestii",
    countAnnouncement: "{optionCount, plural, one {# opțiune} other {# opțiuni}} disponibile.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, selectat} other {}}",
    listboxLabel: "Sugestii",
    selectedAnnouncement: "{optionText}, selectat"
  },
  "ru-RU": {
    triggerLabel: "Показать предложения",
    countAnnouncement: "{optionCount, plural, one {# параметр} other {# параметров}} доступно.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, выбранными} other {}}",
    listboxLabel: "Предложения",
    selectedAnnouncement: "{optionText}, выбрано"
  },
  "sk-SK": {
    triggerLabel: "Zobraziť návrhy",
    countAnnouncement: "{optionCount, plural, one {# možnosť} other {# možnosti/-í}} k dispozícii.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, vybraté} other {}}",
    listboxLabel: "Návrhy",
    selectedAnnouncement: "{optionText}, vybraté"
  },
  "sl-SI": {
    triggerLabel: "Prikaži predloge",
    countAnnouncement: "Na voljo je {optionCount, plural, one {# opcija} other {# opcije}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, izbrano} other {}}",
    listboxLabel: "Predlogi",
    selectedAnnouncement: "{optionText}, izbrano"
  },
  "sr-SP": {
    triggerLabel: "Prikaži predloge",
    countAnnouncement: "Dostupno još: {optionCount, plural, one {# opcija} other {# opcije/a}}.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, izabranih} other {}}",
    listboxLabel: "Predlozi",
    selectedAnnouncement: "{optionText}, izabrano"
  },
  "sv-SE": {
    triggerLabel: "Visa förslag",
    countAnnouncement: "{optionCount, plural, one {# alternativ} other {# alternativ}} tillgängliga.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, valda} other {}}",
    listboxLabel: "Förslag",
    selectedAnnouncement: "{optionText}, valda"
  },
  "tr-TR": {
    triggerLabel: "Önerileri göster",
    countAnnouncement: "{optionCount, plural, one {# seçenek} other {# seçenekler}} kullanılabilir.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, seçildi} other {}}",
    listboxLabel: "Öneriler",
    selectedAnnouncement: "{optionText}, seçildi"
  },
  "uk-UA": {
    triggerLabel: "Показати пропозиції",
    countAnnouncement: "{optionCount, plural, one {# параметр} other {# параметри(-ів)}} доступно.",
    focusAnnouncement: "{optionText}{isSelected, select, true {, вибрано} other {}}",
    listboxLabel: "Пропозиції",
    selectedAnnouncement: "{optionText}, вибрано"
  },
  "zh-CN": {
    triggerLabel: "显示建议",
    countAnnouncement: "有 {optionCount, plural, one {# 个选项} other {# 个选项}}可用。",
    focusAnnouncement: "{optionText}{isSelected, select, true {, 已选择} other {}}",
    listboxLabel: "建议",
    selectedAnnouncement: "{optionText}, 已选择"
  },
  "zh-TW": {
    triggerLabel: "顯示建議",
    countAnnouncement: "{optionCount, plural, one {# 選項} other {# 選項}} 可用。",
    focusAnnouncement: "{optionText}{isSelected, select, true {, 已選取} other {}}",
    listboxLabel: "建議",
    selectedAnnouncement: "{optionText}, 已選取"
  }
};

/**
 * Base component for a combobox, provide context for its children.
 */
function ComboboxBase(props) {
  const defaultId = `combobox-${createUniqueId()}`;
  const filter = createFilter({
    sensitivity: "base"
  });
  props = mergeDefaultProps({
    id: defaultId,
    selectionMode: "single",
    allowsEmptyCollection: false,
    disallowEmptySelection: false,
    allowDuplicateSelectionEvents: true,
    removeOnBackspace: true,
    gutter: 8,
    sameWidth: true,
    modal: false,
    preventScroll: false,
    defaultFilter: "contains",
    triggerMode: "input"
  }, props);
  const [local, popperProps, formControlProps, others] = splitProps(props, ["itemComponent", "sectionComponent", "open", "defaultOpen", "onOpenChange", "onInputChange", "value", "defaultValue", "onChange", "triggerMode", "placeholder", "options", "optionValue", "optionTextValue", "optionLabel", "optionDisabled", "optionGroupChildren", "keyboardDelegate", "allowDuplicateSelectionEvents", "disallowEmptySelection", "defaultFilter", "shouldFocusWrap", "allowsEmptyCollection", "removeOnBackspace", "selectionBehavior", "selectionMode", "virtualized", "modal", "preventScroll", "forceMount"], ["getAnchorRect", "placement", "gutter", "shift", "flip", "slide", "overlap", "sameWidth", "fitViewport", "hideWhenDetached", "detachedPadding", "arrowPadding", "overflowPadding"], FORM_CONTROL_PROP_NAMES);
  const [listboxId, setListboxId] = createSignal();
  const [controlRef, setControlRef] = createSignal();
  const [inputRef, setInputRef] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [listboxRef, setListboxRef] = createSignal();
  const [focusStrategy, setFocusStrategy] = createSignal(false);
  const [isInputFocused, setIsInputFocusedState] = createSignal(false);
  const [showAllOptions, setShowAllOptions] = createSignal(false);
  const [lastDisplayedOptions, setLastDisplayedOptions] = createSignal(local.options);
  const messageFormatter = createMessageFormatter(() => COMBOBOX_INTL_MESSAGES);
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen, openTriggerMode)
  });
  const [inputValue, setInputValue] = createControllableSignal({
    defaultValue: () => "",
    onChange: value => {
      local.onInputChange?.(value);

      // Remove selection when input is cleared and value is uncontrolled (in single selection mode).
      // If controlled, this is the application developer's responsibility.
      if (value === "" && local.selectionMode === "single" && !listState.selectionManager().isEmpty() && local.value === undefined) {
        // Bypass `disallowEmptySelection`.
        listState.selectionManager().setSelectedKeys([]);
      }

      // Clear focused key when input value changes.
      listState.selectionManager().setFocusedKey(undefined);
    }
  });
  const getOptionValue = option => {
    const optionValue = local.optionValue;
    if (optionValue == null) {
      // If no `optionValue`, the option itself is the value (ex: string[] of options).
      return String(option);
    }

    // Get the value from the option object as a string.
    return String(isFunction(optionValue) ? optionValue(option) : option[optionValue]);
  };
  const getOptionLabel = option => {
    const optionLabel = local.optionLabel;
    if (optionLabel == null) {
      // If no `optionLabel`, the option itself is the label (ex: string[] of options).
      return String(option);
    }

    // Get the label from the option object as a string.
    return String(isFunction(optionLabel) ? optionLabel(option) : option[optionLabel]);
  };

  // All options flattened without option groups.
  const allOptions = createMemo(() => {
    const optionGroupChildren = local.optionGroupChildren;

    // The combobox doesn't contains option groups.
    if (optionGroupChildren == null) {
      return local.options;
    }
    return local.options.flatMap(item => item[optionGroupChildren] ?? item);
  });
  const filterFn = option => {
    const inputVal = inputValue() ?? "";
    if (isFunction(local.defaultFilter)) {
      return local.defaultFilter?.(option, inputVal);
    }
    const textVal = getOptionLabel(option);
    switch (local.defaultFilter) {
      case "startsWith":
        return filter.startsWith(textVal, inputVal);
      case "endsWith":
        return filter.endsWith(textVal, inputVal);
      case "contains":
        return filter.contains(textVal, inputVal);
    }
  };

  // Filtered options with same structure as `local.options`
  const filteredOptions = createMemo(() => {
    const optionGroupChildren = local.optionGroupChildren;

    // The combobox doesn't contains option groups.
    if (optionGroupChildren == null) {
      return local.options.filter(filterFn);
    }
    const filteredGroups = [];
    for (const optGroup of local.options) {
      // Filter options of the group
      const filteredChildrenOptions = optGroup[optionGroupChildren].filter(filterFn);
      // Don't add any groups that are empty
      if (filteredChildrenOptions.length === 0) continue;

      // Add the group with the filtered options
      filteredGroups.push({
        ...optGroup,
        [optionGroupChildren]: filteredChildrenOptions
      });
    }
    return filteredGroups;
  });
  const displayedOptions = createMemo(() => {
    if (disclosureState.isOpen()) {
      if (showAllOptions()) {
        return local.options;
      } else {
        return filteredOptions();
      }
    } else {
      return lastDisplayedOptions();
    }
  });

  // Track what action is attempting to open the combobox.
  let openTriggerMode = "focus";
  const getOptionsFromValues = values => {
    return [...values].map(value => allOptions().find(option => getOptionValue(option) === value)).filter(option => option != null);
  };
  const listState = createListState({
    selectedKeys: () => {
      if (local.value != null) {
        return local.value.map(getOptionValue);
      }
      return local.value;
    },
    defaultSelectedKeys: () => {
      if (local.defaultValue != null) {
        return local.defaultValue.map(getOptionValue);
      }
      return local.defaultValue;
    },
    onSelectionChange: selectedKeys => {
      local.onChange?.(getOptionsFromValues(selectedKeys));
      if (local.selectionMode === "single") {
        // Only close if an option is selected.
        // Prevents the combobox to close and reopen when the input is cleared.
        if (disclosureState.isOpen() && selectedKeys.size > 0) {
          close();
        }
      }
      const inputEl = inputRef();
      if (inputEl) {
        // Move cursor to the end of the input.
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        focusWithoutScrolling(inputEl);
      }
    },
    allowDuplicateSelectionEvents: () => access(local.allowDuplicateSelectionEvents),
    disallowEmptySelection: () => local.disallowEmptySelection,
    selectionBehavior: () => access(local.selectionBehavior),
    selectionMode: () => local.selectionMode,
    dataSource: displayedOptions,
    getKey: () => local.optionValue,
    getTextValue: () => local.optionTextValue,
    getDisabled: () => local.optionDisabled,
    getSectionChildren: () => local.optionGroupChildren
  });
  const selectedOptions = createMemo(() => {
    return getOptionsFromValues(listState.selectionManager().selectedKeys());
  });
  const removeOptionFromSelection = option => {
    listState.selectionManager().toggleSelection(getOptionValue(option));
  };
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const open = (focusStrategy, triggerMode) => {
    // Show all option if menu is manually opened.
    const showAllOptions = setShowAllOptions(triggerMode === "manual");
    const hasOptions = showAllOptions ? local.options.length > 0 : filteredOptions().length > 0;

    // Don't open if there is no option.
    if (!hasOptions && !local.allowsEmptyCollection) {
      return;
    }
    openTriggerMode = triggerMode;
    setFocusStrategy(focusStrategy);
    disclosureState.open();
    let focusedKey = listState.selectionManager().firstSelectedKey();
    if (focusedKey == null) {
      if (focusStrategy === "first") {
        focusedKey = listState.collection().getFirstKey();
      } else if (focusStrategy === "last") {
        focusedKey = listState.collection().getLastKey();
      }
    }
    listState.selectionManager().setFocused(true);
    listState.selectionManager().setFocusedKey(focusedKey);
  };
  const close = () => {
    disclosureState.close();
    listState.selectionManager().setFocused(false);
    listState.selectionManager().setFocusedKey(undefined);
  };
  const toggle = (focusStrategy, triggerMode) => {
    if (disclosureState.isOpen()) {
      close();
    } else {
      open(focusStrategy, triggerMode);
    }
  };
  const {
    formControlContext
  } = createFormControl(formControlProps);
  createFormResetListener(inputRef, () => {
    const defaultSelectedKeys = local.defaultValue ? [...local.defaultValue].map(getOptionValue) : new Selection();
    listState.selectionManager().setSelectedKeys(defaultSelectedKeys);
  });

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  const delegate = createMemo(() => {
    const keyboardDelegate = access(local.keyboardDelegate);
    if (keyboardDelegate) {
      return keyboardDelegate;
    }
    return new ListKeyboardDelegate(listState.collection, listboxRef, undefined);
  });

  // Use `createSelectableCollection` to get the keyboard handlers to apply to the input.
  const selectableCollection = createSelectableCollection({
    selectionManager: () => listState.selectionManager(),
    keyboardDelegate: delegate,
    disallowTypeAhead: true,
    disallowEmptySelection: true,
    shouldFocusWrap: () => local.shouldFocusWrap,
    // Prevent item scroll behavior from being applied here, handled in the Listbox component.
    isVirtualized: true
  }, inputRef);
  const setIsInputFocused = isFocused => {
    if (isFocused && local.triggerMode === "focus") {
      open(false, "focus");
    }
    setIsInputFocusedState(isFocused);
    listState.selectionManager().setFocused(isFocused);
  };
  const activeDescendant = createMemo(() => {
    const focusedKey = listState.selectionManager().focusedKey();
    if (focusedKey) {
      return listboxRef()?.querySelector(`[data-key="${focusedKey}"]`)?.id;
    }
    return undefined;
  });
  const resetInputValue = selectedKeys => {
    if (local.selectionMode === "single") {
      const selectedKey = [...selectedKeys][0];
      const selectedOption = allOptions().find(option => getOptionValue(option) === selectedKey);
      setInputValue(selectedOption ? getOptionLabel(selectedOption) : "");
    } else {
      setInputValue("");
    }
  };
  const renderItem = item => {
    return local.itemComponent?.({
      item
    });
  };
  const renderSection = section => {
    return local.sectionComponent?.({
      section
    });
  };

  // If combobox is going to close, freeze the displayed options
  // Prevents the popover contents from updating as the combobox closes.
  createEffect(on([filteredOptions, showAllOptions], (input, prevInput) => {
    if (disclosureState.isOpen() && prevInput != null) {
      const prevFilteredOptions = prevInput[0];
      const prevShowAllOptions = prevInput[1];
      setLastDisplayedOptions(prevShowAllOptions ? local.options : prevFilteredOptions);
    } else {
      const filteredOptions = input[0];
      const showAllOptions = input[1];
      setLastDisplayedOptions(showAllOptions ? local.options : filteredOptions);
    }
  }));

  // Display filtered collection again when input value changes.
  createEffect(on(inputValue, () => {
    if (showAllOptions()) {
      setShowAllOptions(false);
    }
  }));

  // Reset input value when selection change
  createEffect(on(() => listState.selectionManager().selectedKeys(), resetInputValue));

  // VoiceOver has issues with announcing aria-activedescendant properly on change.
  // We use a live region announcer to announce focus changes manually.
  let lastAnnouncedFocusedKey = "";
  createEffect(() => {
    const focusedKey = listState.selectionManager().focusedKey() ?? "";
    const focusedItem = listState.collection().getItem(focusedKey);
    if (isAppleDevice() && focusedItem != null && focusedKey !== lastAnnouncedFocusedKey) {
      const isSelected = listState.selectionManager().isSelected(focusedKey);
      const announcement = messageFormatter().format("focusAnnouncement", {
        optionText: focusedItem?.textValue || "",
        isSelected
      });
      announce(announcement);
    }
    if (focusedKey) {
      lastAnnouncedFocusedKey = focusedKey;
    }
  });

  // Announce the number of available suggestions when it changes.
  let lastOptionCount = getItemCount(listState.collection());
  let lastOpen = disclosureState.isOpen();
  createEffect(() => {
    const optionCount = getItemCount(listState.collection());
    const isOpen = disclosureState.isOpen();

    // Only announce the number of options available when the menu opens if there is no
    // focused item, otherwise screen readers will typically read e.g. "1 of 6".
    // The exception is VoiceOver since this isn't included in the message above.
    const didOpenWithoutFocusedItem = isOpen !== lastOpen && (listState.selectionManager().focusedKey() == null || isAppleDevice());
    if (isOpen && (didOpenWithoutFocusedItem || optionCount !== lastOptionCount)) {
      const announcement = messageFormatter().format("countAnnouncement", {
        optionCount
      });
      announce(announcement);
    }
    lastOptionCount = optionCount;
    lastOpen = isOpen;
  });

  // Announce when a selection occurs for VoiceOver.
  // Other screen readers typically do this automatically.
  let lastAnnouncedSelectedKey = "";
  createEffect(() => {
    const lastSelectedKey = [...listState.selectionManager().selectedKeys()].pop() ?? "";
    const lastSelectedItem = listState.collection().getItem(lastSelectedKey);
    if (isAppleDevice() && isInputFocused() && lastSelectedItem && lastSelectedKey !== lastAnnouncedSelectedKey) {
      const announcement = messageFormatter().format("selectedAnnouncement", {
        optionText: lastSelectedItem?.textValue || ""
      });
      announce(announcement);
    }
    if (lastSelectedKey) {
      lastAnnouncedSelectedKey = lastSelectedKey;
    }
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isDisabled: () => formControlContext.isDisabled() ?? false,
    isMultiple: () => access(local.selectionMode) === "multiple",
    isVirtualized: () => local.virtualized ?? false,
    isModal: () => local.modal ?? false,
    preventScroll: () => local.preventScroll ?? false,
    allowsEmptyCollection: () => local.allowsEmptyCollection ?? false,
    shouldFocusWrap: () => local.shouldFocusWrap ?? false,
    removeOnBackspace: () => local.removeOnBackspace ?? true,
    selectedOptions,
    isInputFocused,
    contentPresence,
    autoFocus: focusStrategy,
    inputValue,
    triggerMode: () => local.triggerMode,
    activeDescendant,
    controlRef,
    inputRef,
    triggerRef,
    contentRef,
    listState: () => listState,
    keyboardDelegate: delegate,
    listboxId,
    triggerAriaLabel: () => messageFormatter().format("triggerLabel"),
    listboxAriaLabel: () => messageFormatter().format("listboxLabel"),
    setIsInputFocused,
    resetInputValue,
    setInputValue,
    setControlRef,
    setInputRef,
    setTriggerRef,
    setContentRef,
    setListboxRef,
    open,
    close,
    toggle,
    placeholder: () => local.placeholder,
    renderItem,
    renderSection,
    removeOptionFromSelection,
    onInputKeyDown: e => selectableCollection.onKeyDown(e),
    generateId: createGenerateId(() => access(formControlProps.id)),
    registerListboxId: createRegisterId(setListboxId)
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(ComboboxContext.Provider, {
        value: context,
        get children() {
          return createComponent(PopperRoot, mergeProps$1({
            anchorRef: controlRef,
            contentRef: contentRef
          }, popperProps, {
            get children() {
              return createComponent(Polymorphic, mergeProps$1({
                as: "div",
                role: "group",
                get id() {
                  return access(formControlProps.id);
                }
              }, () => formControlContext.dataset(), dataset, others));
            }
          }));
        }
      });
    }
  });
}

/**
 * A combo box combines a text input with a listbox, allowing users to filter a list of options to items matching a query.
 */
function ComboboxRoot(props) {
  const [local, others] = splitProps(props, ["value", "defaultValue", "onChange", "multiple"]);
  const value = createMemo(() => {
    if (local.value != null) {
      return local.multiple ? local.value : [local.value];
    }
    return local.value;
  });
  const defaultValue = createMemo(() => {
    if (local.defaultValue != null) {
      return local.multiple ? local.defaultValue : [local.defaultValue];
    }
    return local.defaultValue;
  });
  const onChange = value => {
    if (local.multiple) {
      local.onChange?.(value);
    } else {
      // use `null` as "no value" because `undefined` mean the component is "uncontrolled".
      local.onChange?.(value[0] ?? null);
    }
  };
  return createComponent(ComboboxBase, mergeProps$1({
    get value() {
      return value();
    },
    get defaultValue() {
      return defaultValue();
    },
    onChange: onChange,
    get selectionMode() {
      return local.multiple ? "multiple" : "single";
    }
  }, others));
}

function ComboboxTrigger(props) {
  const formControlContext = useFormControlContext();
  const context = useComboboxContext();
  props = mergeDefaultProps({
    id: context.generateId("trigger")
  }, props);
  const [local, others] = splitProps(props, ["ref", "disabled", "onPointerDown", "onClick", "aria-labelledby"]);
  const isDisabled = () => {
    return local.disabled || context.isDisabled() || formControlContext.isDisabled() || formControlContext.isReadOnly();
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    e.currentTarget.dataset.pointerType = e.pointerType;

    // For consistency with native, open the combobox on mouse down (main button), but touch up.
    if (!isDisabled() && e.pointerType !== "touch" && e.button === 0) {
      // prevent trigger from stealing focus from the active item after opening.
      e.preventDefault();
      context.toggle(false, "manual");
    }
  };
  const onClick = e => {
    callHandler(e, local.onClick);
    if (!isDisabled()) {
      if (e.currentTarget.dataset.pointerType === "touch") {
        context.toggle(false, "manual");
      }

      // Focus the input field in case it isn't focused yet.
      context.inputRef()?.focus();
    }
  };
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(others.id, context.triggerAriaLabel(), local["aria-labelledby"]);
  };
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get disabled() {
      return isDisabled();
    },
    tabIndex: "-1",
    "aria-haspopup": "listbox",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.listboxId() : undefined;
    },
    get ["aria-label"]() {
      return context.triggerAriaLabel();
    },
    get ["aria-labelledby"]() {
      return ariaLabelledBy();
    },
    onPointerDown: onPointerDown,
    onClick: onClick
  }, () => context.dataset(), others));
}

var index$j = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  Content: ComboboxContent,
  Control: ComboboxControl,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  HiddenSelect: ComboboxHiddenSelect,
  Icon: ComboboxIcon,
  Input: ComboboxInput,
  Item: ListboxItem,
  ItemDescription: ListboxItemDescription,
  ItemIndicator: ListboxItemIndicator,
  ItemLabel: ListboxItemLabel,
  Label: FormControlLabel,
  Listbox: ComboboxListbox,
  Portal: ComboboxPortal,
  Root: ComboboxRoot,
  Section: ListboxSection,
  Trigger: ComboboxTrigger
});

const MenuContext = createContext();
function useOptionalMenuContext() {
  return useContext(MenuContext);
}
function useMenuContext() {
  const context = useOptionalMenuContext();
  if (context === undefined) {
    throw new Error("[kobalte]: `useMenuContext` must be used within a `Menu` component");
  }
  return context;
}

const MenuRootContext = createContext();
function useMenuRootContext() {
  const context = useContext(MenuRootContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useMenuRootContext` must be used within a `MenuRoot` component");
  }
  return context;
}

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/81b25f4b40c54f72aeb106ca0e64e1e09655153e/packages/react/menu/src/Menu.tsx
 */

/**
 * Construct a polygon based on pointer clientX/clientY and an element bounding rect.
 */
function getPointerGraceArea(placement, event, contentEl) {
  const basePlacement = placement.split("-")[0];
  const contentRect = contentEl.getBoundingClientRect();
  const polygon = [];
  const pointerX = event.clientX;
  const pointerY = event.clientY;
  switch (basePlacement) {
    case "top":
      polygon.push([pointerX, pointerY + 5]);
      polygon.push([contentRect.left, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.top]);
      polygon.push([contentRect.right, contentRect.top]);
      polygon.push([contentRect.right, contentRect.bottom]);
      break;
    case "right":
      polygon.push([pointerX - 5, pointerY]);
      polygon.push([contentRect.left, contentRect.top]);
      polygon.push([contentRect.right, contentRect.top]);
      polygon.push([contentRect.right, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.bottom]);
      break;
    case "bottom":
      polygon.push([pointerX, pointerY - 5]);
      polygon.push([contentRect.right, contentRect.top]);
      polygon.push([contentRect.right, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.top]);
      break;
    case "left":
      polygon.push([pointerX + 5, pointerY]);
      polygon.push([contentRect.right, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.bottom]);
      polygon.push([contentRect.left, contentRect.top]);
      polygon.push([contentRect.right, contentRect.top]);
      break;
  }
  return polygon;
}
function isPointerInGraceArea(event, area) {
  if (!area) {
    return false;
  }
  return isPointInPolygon([event.clientX, event.clientY], area);
}

/**
 * Container for menu items and nested menu, provide context for its children.
 */
function Menu(props) {
  const rootContext = useMenuRootContext();
  const parentDomCollectionContext = useOptionalDomCollectionContext();
  const parentMenuContext = useOptionalMenuContext();
  props = mergeDefaultProps({
    placement: "bottom-start"
  }, props);
  const [local, others] = splitProps(props, ["open", "defaultOpen", "onOpenChange"]);
  let pointerGraceTimeoutId = 0;
  let pointerGraceIntent = null;
  let pointerDir = "right";
  const [triggerId, setTriggerId] = createSignal();
  const [contentId, setContentId] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [focusStrategy, setFocusStrategy] = createSignal(true);
  const [currentPlacement, setCurrentPlacement] = createSignal(others.placement);
  const [nestedMenus, setNestedMenus] = createSignal([]);
  const [items, setItems] = createSignal([]);
  const {
    DomCollectionProvider
  } = createDomCollection({
    items,
    onItemsChange: setItems
  });
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const contentPresence = createPresence(() => rootContext.forceMount() || disclosureState.isOpen());
  const listState = createListState({
    selectionMode: "none",
    dataSource: items
  });
  const open = focusStrategy => {
    setFocusStrategy(focusStrategy);
    disclosureState.open();
  };
  const close = (recursively = false) => {
    disclosureState.close();
    if (recursively && parentMenuContext) {
      parentMenuContext.close(true);
    }
  };
  const toggle = focusStrategy => {
    setFocusStrategy(focusStrategy);
    disclosureState.toggle();
  };
  const focusContent = () => {
    const content = contentRef();
    if (content) {
      focusWithoutScrolling(content);
      listState.selectionManager().setFocused(true);
      listState.selectionManager().setFocusedKey(undefined);
    }
  };
  const registerNestedMenu = element => {
    setNestedMenus(prev => [...prev, element]);
    const parentUnregister = parentMenuContext?.registerNestedMenu(element);
    return () => {
      setNestedMenus(prev => removeItemFromArray(prev, element));
      parentUnregister?.();
    };
  };
  const isPointerMovingToSubmenu = e => {
    const isMovingTowards = pointerDir === pointerGraceIntent?.side;
    return isMovingTowards && isPointerInGraceArea(e, pointerGraceIntent?.area);
  };
  const onItemEnter = e => {
    if (isPointerMovingToSubmenu(e)) {
      e.preventDefault();
    }
  };
  const onItemLeave = e => {
    if (isPointerMovingToSubmenu(e)) {
      return;
    }
    focusContent();
  };
  const onTriggerLeave = e => {
    if (isPointerMovingToSubmenu(e)) {
      e.preventDefault();
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => {
      // Apply only on root menu when opened and modal.
      return !(parentMenuContext == null && disclosureState.isOpen() && rootContext.isModal());
    },
    targets: () => [contentRef(), ...nestedMenus()].filter(Boolean)
  });
  createEffect(() => {
    const contentEl = contentRef();
    if (!contentEl || !parentMenuContext) {
      return;
    }
    const parentUnregister = parentMenuContext.registerNestedMenu(contentEl);
    onCleanup(() => {
      parentUnregister();
    });
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    contentPresence,
    currentPlacement,
    pointerGraceTimeoutId: () => pointerGraceTimeoutId,
    autoFocus: focusStrategy,
    listState: () => listState,
    parentMenuContext: () => parentMenuContext,
    triggerRef,
    contentRef,
    triggerId,
    contentId,
    setTriggerRef,
    setContentRef,
    open,
    close,
    toggle,
    focusContent,
    onItemEnter,
    onItemLeave,
    onTriggerLeave,
    setPointerDir: dir => pointerDir = dir,
    setPointerGraceTimeoutId: id => pointerGraceTimeoutId = id,
    setPointerGraceIntent: intent => pointerGraceIntent = intent,
    registerNestedMenu,
    registerItemToParentDomCollection: parentDomCollectionContext?.registerItem,
    registerTriggerId: createRegisterId(setTriggerId),
    registerContentId: createRegisterId(setContentId)
  };
  return createComponent(DomCollectionProvider, {
    get children() {
      return createComponent(MenuContext.Provider, {
        value: context,
        get children() {
          return createComponent(PopperRoot, mergeProps$1({
            anchorRef: triggerRef,
            contentRef: contentRef,
            onCurrentPlacementChange: setCurrentPlacement
          }, others));
        }
      });
    }
  });
}

const MenuItemContext = createContext();
function useMenuItemContext() {
  const context = useContext(MenuItemContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useMenuItemContext` must be used within a `Menu.Item` component");
  }
  return context;
}

/**
 * Base component for a menu item.
 */
function MenuItemBase(props) {
  let ref;
  const rootContext = useMenuRootContext();
  const menuContext = useMenuContext();
  props = mergeDefaultProps({
    id: rootContext.generateId(`item-${createUniqueId()}`)
  }, props);
  const [local, others] = splitProps(props, ["ref", "textValue", "disabled", "closeOnSelect", "checked", "indeterminate", "onSelect", "onPointerMove", "onPointerLeave", "onPointerDown", "onPointerUp", "onClick", "onKeyDown", "onMouseDown", "onFocus"]);
  const [labelId, setLabelId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const [labelRef, setLabelRef] = createSignal();
  const selectionManager = () => menuContext.listState().selectionManager();
  const key = () => others.id;
  const isHighlighted = () => selectionManager().focusedKey() === key();
  const onSelect = () => {
    local.onSelect?.();
    if (local.closeOnSelect) {
      menuContext.close(true);
    }
  };
  createDomCollectionItem({
    getItem: () => ({
      ref: () => ref,
      type: "item",
      key: key(),
      textValue: local.textValue ?? labelRef()?.textContent ?? ref?.textContent ?? "",
      disabled: local.disabled ?? false
    })
  });
  const selectableItem = createSelectableItem({
    key,
    selectionManager: selectionManager,
    shouldSelectOnPressUp: true,
    allowsDifferentPressOrigin: true,
    disabled: () => local.disabled
  }, () => ref);

  /**
   * We focus items on `pointerMove` to achieve the following:
   *
   * - Mouse over an item (it focuses)
   * - Leave mouse where it is and use keyboard to focus a different item
   * - Wiggle mouse without it leaving previously focused item
   * - Previously focused item should re-focus
   *
   * If we used `mouseOver`/`mouseEnter` it would not re-focus when the mouse
   * wiggles. This is to match native menu implementation.
   */
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (e.pointerType !== "mouse") {
      return;
    }
    if (local.disabled) {
      menuContext.onItemLeave(e);
    } else {
      menuContext.onItemEnter(e);
      if (!e.defaultPrevented) {
        focusWithoutScrolling(e.currentTarget);
        menuContext.listState().selectionManager().setFocused(true);
        menuContext.listState().selectionManager().setFocusedKey(key());
      }
    }
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);
    if (e.pointerType !== "mouse") {
      return;
    }
    menuContext.onItemLeave(e);
  };
  const onPointerUp = e => {
    callHandler(e, local.onPointerUp);

    // Selection occurs on pointer up (main button).
    if (!local.disabled && e.button === 0) {
      onSelect();
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);

    // Ignore repeating events, which may have started on the menu trigger before moving
    // focus to the menu item. We want to wait for a second complete key press sequence.
    if (e.repeat) {
      return;
    }
    if (local.disabled) {
      return;
    }
    switch (e.key) {
      case "Enter":
      case " ":
        onSelect();
        break;
    }
  };
  const ariaChecked = createMemo(() => {
    if (local.indeterminate) {
      return "mixed";
    }
    if (local.checked == null) {
      return undefined;
    }
    return local.checked;
  });
  const dataset = createMemo(() => ({
    "data-indeterminate": local.indeterminate ? "" : undefined,
    "data-checked": local.checked && !local.indeterminate ? "" : undefined,
    "data-disabled": local.disabled ? "" : undefined,
    "data-highlighted": isHighlighted() ? "" : undefined
  }));
  const context = {
    isChecked: () => local.checked,
    dataset,
    setLabelRef,
    generateId: createGenerateId(() => others.id),
    registerLabel: createRegisterId(setLabelId),
    registerDescription: createRegisterId(setDescriptionId)
  };
  return createComponent(MenuItemContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        get tabIndex() {
          return selectableItem.tabIndex();
        },
        get ["aria-checked"]() {
          return ariaChecked();
        },
        get ["aria-disabled"]() {
          return local.disabled;
        },
        get ["aria-labelledby"]() {
          return labelId();
        },
        get ["aria-describedby"]() {
          return descriptionId();
        },
        get ["data-key"]() {
          return selectableItem.dataKey();
        },
        get onPointerDown() {
          return composeEventHandlers([local.onPointerDown, selectableItem.onPointerDown]);
        },
        get onPointerUp() {
          return composeEventHandlers([onPointerUp, selectableItem.onPointerUp]);
        },
        get onClick() {
          return composeEventHandlers([local.onClick, selectableItem.onClick]);
        },
        get onKeyDown() {
          return composeEventHandlers([onKeyDown, selectableItem.onKeyDown]);
        },
        get onMouseDown() {
          return composeEventHandlers([local.onMouseDown, selectableItem.onMouseDown]);
        },
        get onFocus() {
          return composeEventHandlers([local.onFocus, selectableItem.onFocus]);
        },
        onPointerMove: onPointerMove,
        onPointerLeave: onPointerLeave
      }, dataset, others));
    }
  });
}

/**
 * An item that can be controlled and rendered like a checkbox.
 */
function MenuCheckboxItem(props) {
  props = mergeDefaultProps({
    closeOnSelect: false
  }, props);
  const [local, others] = splitProps(props, ["checked", "defaultChecked", "onChange", "onSelect"]);
  const state = createToggleState({
    isSelected: () => local.checked,
    defaultIsSelected: () => local.defaultChecked,
    onSelectedChange: checked => local.onChange?.(checked),
    isDisabled: () => others.disabled
  });
  const onSelect = () => {
    local.onSelect?.();
    state.toggle();
  };
  return createComponent(MenuItemBase, mergeProps$1({
    role: "menuitemcheckbox",
    get checked() {
      return state.isSelected();
    },
    onSelect: onSelect
  }, others));
}

function MenuContentBase(props) {
  let ref;
  const rootContext = useMenuRootContext();
  const context = useMenuContext();
  props = mergeDefaultProps({
    id: rootContext.generateId(`content-${createUniqueId()}`)
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "style", "onOpenAutoFocus", "onCloseAutoFocus", "onEscapeKeyDown", "onFocusOutside", "onPointerEnter", "onPointerMove", "onKeyDown", "onMouseDown", "onFocusIn", "onFocusOut"]);
  let lastPointerX = 0;

  // Only the root menu can apply "modal" behavior (block pointer-events and trap focus).
  const isRootModalContent = () => {
    return context.parentMenuContext() == null && rootContext.isModal();
  };
  const selectableList = createSelectableList({
    selectionManager: context.listState().selectionManager,
    collection: context.listState().collection,
    autoFocus: context.autoFocus,
    deferAutoFocus: true,
    // ensure all menu items are mounted and collection is not empty before trying to autofocus.
    shouldFocusWrap: true,
    disallowTypeAhead: () => !context.listState().selectionManager().isFocused()
  }, () => ref);
  createFocusScope({
    trapFocus: () => isRootModalContent() && context.isOpen(),
    onMountAutoFocus: local.onOpenAutoFocus,
    onUnmountAutoFocus: local.onCloseAutoFocus
  }, () => ref);
  const onKeyDown = e => {
    // Submenu key events bubble through portals. We only care about keys in this menu.
    if (!contains(e.currentTarget, e.target)) {
      return;
    }

    // Menus should not be navigated using tab key, so we prevent it.
    if (e.key === "Tab" && context.isOpen()) {
      e.preventDefault();
    }
  };
  const onEscapeKeyDown = e => {
    local.onEscapeKeyDown?.(e);

    // `createSelectableList` prevent escape key down,
    // which prevent our `onDismiss` in `DismissableLayer` to run,
    // so we force "close on escape" here.
    context.close(true);
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);
    if (rootContext.isModal()) {
      // When focus is trapped, a `focusout` event may still happen.
      // We make sure we don't trigger our `onDismiss` in such case.
      e.preventDefault();
    }
  };
  const onPointerEnter = e => {
    callHandler(e, local.onPointerEnter);
    if (!context.isOpen()) {
      return;
    }

    // Remove visual focus from parent menu content.
    context.parentMenuContext()?.listState().selectionManager().setFocused(false);
    context.parentMenuContext()?.listState().selectionManager().setFocusedKey(undefined);
  };
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (e.pointerType !== "mouse") {
      return;
    }
    const target = e.target;
    const pointerXHasChanged = lastPointerX !== e.clientX;

    // We don't use `event.movementX` for this check because Safari will
    // always return `0` on a pointer event.
    if (contains(e.currentTarget, target) && pointerXHasChanged) {
      context.setPointerDir(e.clientX > lastPointerX ? "right" : "left");
      lastPointerX = e.clientX;
    }
  };
  createEffect(() => onCleanup(context.registerContentId(local.id)));
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
                ref = el;
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "menu",
            get id() {
              return local.id;
            },
            get tabIndex() {
              return selectableList.tabIndex();
            },
            get disableOutsidePointerEvents() {
              return memo(() => !!isRootModalContent())() && context.isOpen();
            },
            get excludedElements() {
              return [context.triggerRef];
            },
            bypassTopMostLayerCheck: true,
            get style() {
              return {
                "--kb-menu-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            get ["aria-labelledby"]() {
              return context.triggerId();
            },
            onEscapeKeyDown: onEscapeKeyDown,
            onFocusOutside: onFocusOutside,
            get onDismiss() {
              return context.close;
            },
            get onKeyDown() {
              return composeEventHandlers([local.onKeyDown, selectableList.onKeyDown, onKeyDown]);
            },
            get onMouseDown() {
              return composeEventHandlers([local.onMouseDown, selectableList.onMouseDown]);
            },
            get onFocusIn() {
              return composeEventHandlers([local.onFocusIn, selectableList.onFocusIn]);
            },
            get onFocusOut() {
              return composeEventHandlers([local.onFocusOut, selectableList.onFocusOut]);
            },
            onPointerEnter: onPointerEnter,
            onPointerMove: onPointerMove
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

function MenuContent(props) {
  let ref;
  const rootContext = useMenuRootContext();
  const context = useMenuContext();
  const [local, others] = splitProps(props, ["ref"]);
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isOpen() && (rootContext.isModal() || rootContext.preventScroll()))
  });
  return createComponent(MenuContentBase, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    }
  }, others));
}

const MenuGroupContext = createContext();
function useMenuGroupContext() {
  const context = useContext(MenuGroupContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useMenuGroupContext` must be used within a `Menu.Group` component");
  }
  return context;
}

/**
 * A container used to group multiple `Menu.Item`s.
 */
function MenuGroup(props) {
  const rootContext = useMenuRootContext();
  props = mergeDefaultProps({
    id: rootContext.generateId(`group-${createUniqueId()}`)
  }, props);
  const [labelId, setLabelId] = createSignal();
  const context = {
    generateId: createGenerateId(() => props.id),
    registerLabelId: createRegisterId(setLabelId)
  };
  return createComponent(MenuGroupContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        role: "group",
        get ["aria-labelledby"]() {
          return labelId();
        }
      }, props));
    }
  });
}

/**
 * A component used to render the label of a `Menu.Group`.
 * It won't be focusable using arrow keys.
 */
function MenuGroupLabel(props) {
  const context = useMenuGroupContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerLabelId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    get id() {
      return local.id;
    },
    "aria-hidden": "true"
  }, others));
}

/**
 * A small icon often displayed inside the menu trigger as a visual affordance for the fact it can be open.
 * It renders a `▼` by default, but you can use your own icon by providing a `children`.
 */
function MenuIcon(props) {
  const context = useMenuContext();
  props = mergeDefaultProps({
    children: "▼"
  }, props);
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    "aria-hidden": "true"
  }, () => context.dataset(), props));
}

/**
 * An item of the menu.
 */
function MenuItem(props) {
  return createComponent(MenuItemBase, mergeProps$1({
    role: "menuitem",
    closeOnSelect: true
  }, props));
}

/**
 * An optional accessible description to be announced for the menu item.
 * Useful for menu items that have more complex content (e.g. icons, multiple lines of text, etc.)
 */
function MenuItemDescription(props) {
  const context = useMenuItemContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerDescription(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * The visual indicator rendered when the parent menu `CheckboxItem` or `RadioItem` is checked.
 * You can style this element directly, or you can use it as a wrapper to put an icon into, or both.
 */
function MenuItemIndicator(props) {
  const context = useMenuItemContext();
  props = mergeDefaultProps({
    id: context.generateId("indicator")
  }, props);
  const [local, others] = splitProps(props, ["forceMount"]);
  return createComponent(Show, {
    get when() {
      return local.forceMount || context.isChecked();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div"
      }, () => context.dataset(), others));
    }
  });
}

/**
 * An accessible label to be announced for the menu item.
 * Useful for menu items that have more complex content (e.g. icons, multiple lines of text, etc.)
 */
function MenuItemLabel(props) {
  const context = useMenuItemContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  const [local, others] = splitProps(props, ["ref", "id"]);
  createEffect(() => onCleanup(context.registerLabel(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.setLabelRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * Portals its children into the `body` when the menu is open.
 */
function MenuPortal(props) {
  const context = useMenuContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

const MenuRadioGroupContext = createContext();
function useMenuRadioGroupContext() {
  const context = useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useMenuRadioGroupContext` must be used within a `Menu.RadioGroup` component");
  }
  return context;
}

/**
 * A container used to group multiple `Menu.RadioItem`s and manage the selection.
 */
function MenuRadioGroup(props) {
  const rootContext = useMenuRootContext();
  const defaultId = rootContext.generateId(`radiogroup-${createUniqueId()}`);
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["value", "defaultValue", "onChange", "disabled"]);
  const [selected, setSelected] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: value => local.onChange?.(value)
  });
  const context = {
    isDisabled: () => local.disabled,
    isSelectedValue: value => value === selected(),
    setSelectedValue: setSelected
  };
  return createComponent(MenuRadioGroupContext.Provider, {
    value: context,
    get children() {
      return createComponent(MenuGroup, others);
    }
  });
}

/**
 * An item that can be controlled and rendered like a radio.
 */
function MenuRadioItem(props) {
  const context = useMenuRadioGroupContext();
  props = mergeDefaultProps({
    closeOnSelect: false
  }, props);
  const [local, others] = splitProps(props, ["value", "onSelect"]);
  const onSelect = () => {
    local.onSelect?.();
    context.setSelectedValue(local.value);
  };
  return createComponent(MenuItemBase, mergeProps$1({
    role: "menuitemradio",
    get checked() {
      return context.isSelectedValue(local.value);
    },
    onSelect: onSelect
  }, others));
}

/**
 * Root component for a menu, provide context for its children.
 * Used to build dropdown menu, context menu and menubar.
 */
function MenuRoot(props) {
  const defaultId = `menu-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    modal: true,
    preventScroll: false
  }, props);
  const [local, others] = splitProps(props, ["id", "modal", "preventScroll", "forceMount", "open", "defaultOpen", "onOpenChange"]);
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const context = {
    isModal: () => local.modal ?? true,
    preventScroll: () => local.preventScroll ?? false,
    forceMount: () => local.forceMount ?? false,
    generateId: createGenerateId(() => local.id)
  };
  return createComponent(MenuRootContext.Provider, {
    value: context,
    get children() {
      return createComponent(Menu, mergeProps$1({
        get open() {
          return disclosureState.isOpen();
        },
        get onOpenChange() {
          return disclosureState.setIsOpen;
        }
      }, others));
    }
  });
}

/**
 * Contains all the parts of a submenu.
 */
function MenuSub(props) {
  const {
    direction
  } = useLocale();
  return createComponent(Menu, mergeProps$1({
    get placement() {
      return direction() === "rtl" ? "left-start" : "right-start";
    },
    flip: true
  }, props));
}

const SUB_CLOSE_KEYS = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
};
/**
 * The component that pops out when a submenu is open.
 */
function MenuSubContent(props) {
  const context = useMenuContext();
  const [local, others] = splitProps(props, ["onFocusOutside", "onKeyDown", "onFocusOut"]);
  const {
    direction
  } = useLocale();
  const onOpenAutoFocus = e => {
    // when opening a submenu, focus content for keyboard users only (handled by `MenuSubTrigger`).
    e.preventDefault();
  };
  const onCloseAutoFocus = e => {
    // The menu might close because of focusing another menu item in the parent menu.
    // We don't want it to refocus the trigger in that case, so we handle trigger focus ourselves.
    e.preventDefault();
  };
  const onFocusOutside = e => {
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
  return createComponent(MenuContentBase, mergeProps$1({
    onOpenAutoFocus: onOpenAutoFocus,
    onCloseAutoFocus: onCloseAutoFocus,
    onFocusOutside: onFocusOutside,
    onKeyDown: onKeyDown
  }, others));
}

const SELECTION_KEYS = ["Enter", " "];
const SUB_OPEN_KEYS = {
  ltr: [...SELECTION_KEYS, "ArrowRight"],
  rtl: [...SELECTION_KEYS, "ArrowLeft"]
};
/**
 * An item that opens a submenu.
 */
function MenuSubTrigger(props) {
  let ref;
  const rootContext = useMenuRootContext();
  const context = useMenuContext();
  props = mergeDefaultProps({
    id: rootContext.generateId(`sub-trigger-${createUniqueId()}`)
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "textValue", "disabled", "onPointerMove", "onPointerLeave", "onPointerDown", "onPointerUp", "onClick", "onKeyDown", "onMouseDown", "onFocus"]);
  let openTimeoutId = null;
  const clearOpenTimeout = () => {
    if (isServer) {
      return;
    }
    if (openTimeoutId) {
      window.clearTimeout(openTimeoutId);
    }
    openTimeoutId = null;
  };
  const {
    direction
  } = useLocale();
  const key = () => local.id;
  const parentSelectionManager = () => {
    const parentMenuContext = context.parentMenuContext();
    if (parentMenuContext == null) {
      throw new Error("[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component");
    }
    return parentMenuContext.listState().selectionManager();
  };
  const collection = () => context.listState().collection();
  const isHighlighted = () => parentSelectionManager().focusedKey() === key();
  const selectableItem = createSelectableItem({
    key,
    selectionManager: parentSelectionManager,
    shouldSelectOnPressUp: true,
    allowsDifferentPressOrigin: true,
    disabled: () => local.disabled
  }, () => ref);
  const onClick = e => {
    callHandler(e, local.onClick);
    if (!context.isOpen() && !local.disabled) {
      context.open(true);
    }
  };
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (e.pointerType !== "mouse") {
      return;
    }
    const parentMenuContext = context.parentMenuContext();
    parentMenuContext?.onItemEnter(e);
    if (e.defaultPrevented) {
      return;
    }
    if (local.disabled) {
      parentMenuContext?.onItemLeave(e);
      return;
    }
    if (!context.isOpen() && !openTimeoutId) {
      context.parentMenuContext()?.setPointerGraceIntent(null);
      openTimeoutId = window.setTimeout(() => {
        context.open(false);
        clearOpenTimeout();
      }, 100);
    }
    parentMenuContext?.onItemEnter(e);
    if (!e.defaultPrevented) {
      // Remove visual focus from sub menu content.
      if (context.listState().selectionManager().isFocused()) {
        context.listState().selectionManager().setFocused(false);
        context.listState().selectionManager().setFocusedKey(undefined);
      }

      // Restore visual focus to parent menu content.
      focusWithoutScrolling(e.currentTarget);
      parentMenuContext?.listState().selectionManager().setFocused(true);
      parentMenuContext?.listState().selectionManager().setFocusedKey(key());
    }
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);
    if (e.pointerType !== "mouse") {
      return;
    }
    clearOpenTimeout();
    const parentMenuContext = context.parentMenuContext();
    const contentEl = context.contentRef();
    if (contentEl) {
      parentMenuContext?.setPointerGraceIntent({
        area: getPointerGraceArea(context.currentPlacement(), e, contentEl),
        // Safe because sub menu always open "left" or "right".
        side: context.currentPlacement().split("-")[0]
      });
      window.clearTimeout(parentMenuContext?.pointerGraceTimeoutId());
      const pointerGraceTimeoutId = window.setTimeout(() => {
        parentMenuContext?.setPointerGraceIntent(null);
      }, 300);
      parentMenuContext?.setPointerGraceTimeoutId(pointerGraceTimeoutId);
    } else {
      parentMenuContext?.onTriggerLeave(e);
      if (e.defaultPrevented) {
        return;
      }

      // There's 100ms where the user may leave an item before the submenu was opened.
      parentMenuContext?.setPointerGraceIntent(null);
    }
    parentMenuContext?.onItemLeave(e);
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);

    // Ignore repeating events, which may have started on the menu trigger before moving
    // focus to the menu item. We want to wait for a second complete key press sequence.
    if (e.repeat) {
      return;
    }
    if (local.disabled) {
      return;
    }

    // For consistency with native, open the menu on key down.
    if (SUB_OPEN_KEYS[direction()].includes(e.key)) {
      e.stopPropagation();
      e.preventDefault();

      // Clear focus on parent menu (e.g. the menu containing the trigger).
      parentSelectionManager().setFocused(false);
      parentSelectionManager().setFocusedKey(undefined);
      if (!context.isOpen()) {
        context.open("first");
      }

      // We focus manually because we prevented it in MenuSubContent's `onOpenAutoFocus`.
      context.focusContent();
      context.listState().selectionManager().setFocused(true);
      context.listState().selectionManager().setFocusedKey(collection().getFirstKey());
    }
  };
  createEffect(() => {
    // Not able to register the trigger as a menu item on parent menu means
    // `Menu.SubTrigger` is not used in the correct place, so throw an error.
    if (context.registerItemToParentDomCollection == null) {
      throw new Error("[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component");
    }

    // Register the item trigger on the parent menu that contains it.
    const unregister = context.registerItemToParentDomCollection({
      ref: () => ref,
      type: "item",
      key: key(),
      textValue: local.textValue ?? ref?.textContent ?? "",
      disabled: local.disabled ?? false
    });
    onCleanup(unregister);
  });
  createEffect(on(() => context.parentMenuContext()?.pointerGraceTimeoutId(), pointerGraceTimer => {
    onCleanup(() => {
      window.clearTimeout(pointerGraceTimer);
      context.parentMenuContext()?.setPointerGraceIntent(null);
    });
  }));
  createEffect(() => onCleanup(context.registerTriggerId(local.id)));
  onCleanup(() => {
    clearOpenTimeout();
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(el => {
        context.setTriggerRef(el);
        ref = el;
      }, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return local.id;
    },
    role: "menuitem",
    get tabIndex() {
      return selectableItem.tabIndex();
    },
    "aria-haspopup": "true",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    get ["aria-disabled"]() {
      return local.disabled;
    },
    get ["data-key"]() {
      return selectableItem.dataKey();
    },
    get ["data-highlighted"]() {
      return isHighlighted() ? "" : undefined;
    },
    get ["data-disabled"]() {
      return local.disabled ? "" : undefined;
    },
    get onPointerDown() {
      return composeEventHandlers([local.onPointerDown, selectableItem.onPointerDown]);
    },
    get onPointerUp() {
      return composeEventHandlers([local.onPointerUp, selectableItem.onPointerUp]);
    },
    get onClick() {
      return composeEventHandlers([onClick, selectableItem.onClick]);
    },
    get onKeyDown() {
      return composeEventHandlers([onKeyDown, selectableItem.onKeyDown]);
    },
    get onMouseDown() {
      return composeEventHandlers([local.onMouseDown, selectableItem.onMouseDown]);
    },
    get onFocus() {
      return composeEventHandlers([local.onFocus, selectableItem.onFocus]);
    },
    onPointerMove: onPointerMove,
    onPointerLeave: onPointerLeave
  }, () => context.dataset(), others));
}

/**
 * The button that toggles the menu.
 */
function MenuTrigger(props) {
  const rootContext = useMenuRootContext();
  const context = useMenuContext();
  props = mergeDefaultProps({
    id: rootContext.generateId("trigger")
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "disabled", "onPointerDown", "onClick", "onKeyDown"]);
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    e.currentTarget.dataset.pointerType = e.pointerType;

    // For consistency with native, open the select on mouse down (main button), but touch up.
    if (!local.disabled && e.pointerType !== "touch" && e.button === 0) {
      context.toggle(true);
    }
  };
  const onClick = e => {
    callHandler(e, local.onClick);
    if (!local.disabled && e.currentTarget.dataset.pointerType === "touch") {
      context.toggle(true);
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (local.disabled) {
      return;
    }

    // For consistency with native, open the menu on key down.
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        e.stopPropagation();
        e.preventDefault();
        context.toggle("first");
        break;
      case "ArrowUp":
        e.stopPropagation();
        e.preventDefault();
        context.toggle("last");
        break;
    }
  };
  createEffect(() => onCleanup(context.registerTriggerId(local.id)));
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return local.id;
    },
    get disabled() {
      return local.disabled;
    },
    "aria-haspopup": "true",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    onPointerDown: onPointerDown,
    onClick: onClick,
    onKeyDown: onKeyDown
  }, () => context.dataset(), others));
}

/**
 * A separator visually or semantically separates content.
 */
function SeparatorRoot(props) {
  let ref;
  props = mergeDefaultProps({
    orientation: "horizontal"
  }, props);
  const [local, others] = splitProps(props, ["ref", "orientation"]);
  const tagName = createTagName(() => ref, () => "hr");
  return createComponent(Polymorphic, mergeProps$1({
    as: "hr",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get role() {
      return tagName() !== "hr" ? "separator" : undefined;
    },
    get ["aria-orientation"]() {
      return local.orientation === "vertical" ? "vertical" : undefined;
    },
    get ["data-orientation"]() {
      return local.orientation;
    }
  }, others));
}

var index$i = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: SeparatorRoot
});

function ContextMenuContent(props) {
  const rootContext = useMenuRootContext();
  const [local, others] = splitProps(props, ["onCloseAutoFocus", "onInteractOutside"]);
  let hasInteractedOutside = false;
  const onCloseAutoFocus = e => {
    local.onCloseAutoFocus?.(e);
    if (!e.defaultPrevented && hasInteractedOutside) {
      e.preventDefault();
    }
    hasInteractedOutside = false;
  };
  const onInteractOutside = e => {
    local.onInteractOutside?.(e);
    if (!e.defaultPrevented && !rootContext.isModal()) {
      hasInteractedOutside = true;
    }
  };
  return createComponent(MenuContent, mergeProps$1({
    onCloseAutoFocus: onCloseAutoFocus,
    onInteractOutside: onInteractOutside
  }, others));
}

const ContextMenuContext = createContext();
function useOptionalContextMenuContext() {
  return useContext(ContextMenuContext);
}
function useContextMenuContext() {
  const context = useOptionalContextMenuContext();
  if (context === undefined) {
    throw new Error("[kobalte]: `useContextMenuContext` must be used within a `ContextMenu` component");
  }
  return context;
}

/**
 * Displays a menu located at the pointer, triggered by a right-click or a long-press.
 */
function ContextMenuRoot(props) {
  const defaultId = `contextmenu-${createUniqueId()}`;
  const {
    direction
  } = useLocale();
  props = mergeDefaultProps({
    id: defaultId,
    placement: direction() === "rtl" ? "left-start" : "right-start",
    gutter: 2,
    shift: 2
  }, props);
  const [local, others] = splitProps(props, ["onOpenChange"]);
  const [anchorRect, setAnchorRect] = createSignal({
    x: 0,
    y: 0
  });
  const disclosureState = createDisclosureState({
    defaultOpen: false,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const context = {
    setAnchorRect
  };
  return createComponent(ContextMenuContext.Provider, {
    value: context,
    get children() {
      return createComponent(MenuRoot, mergeProps$1({
        get open() {
          return disclosureState.isOpen();
        },
        get onOpenChange() {
          return disclosureState.setIsOpen;
        },
        getAnchorRect: anchorRect
      }, others));
    }
  });
}

function ContextMenuTrigger(props) {
  const rootContext = useMenuRootContext();
  const menuContext = useMenuContext();
  const context = useContextMenuContext();
  props = mergeDefaultProps({
    id: rootContext.generateId("trigger")
  }, props);
  const [local, others] = splitProps(props, ["ref", "style", "disabled", "onContextMenu", "onPointerDown", "onPointerMove", "onPointerCancel", "onPointerUp"]);
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
    context.setAnchorRect({
      x: e.clientX,
      y: e.clientY
    });
    if (menuContext.isOpen()) {
      // If the menu is already open, focus the menu itself.
      menuContext.focusContent();
    } else {
      menuContext.open(true);
    }
  };
  const isTouchOrPen = e => e.pointerType === "touch" || e.pointerType === "pen";
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
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(menuContext.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get style() {
      return {
        // prevent iOS context menu from appearing
        "-webkit-touch-callout": "none",
        ...local.style
      };
    },
    get ["data-disabled"]() {
      return local.disabled ? "" : undefined;
    },
    onContextMenu: onContextMenu,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerCancel: onPointerCancel,
    onPointerUp: onPointerUp
  }, () => menuContext.dataset(), others));
}

var index$h = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  CheckboxItem: MenuCheckboxItem,
  Content: ContextMenuContent,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Icon: MenuIcon,
  Item: MenuItem,
  ItemDescription: MenuItemDescription,
  ItemIndicator: MenuItemIndicator,
  ItemLabel: MenuItemLabel,
  Portal: MenuPortal,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Root: ContextMenuRoot,
  Separator: SeparatorRoot,
  Sub: MenuSub,
  SubContent: MenuSubContent,
  SubTrigger: MenuSubTrigger,
  Trigger: ContextMenuTrigger
});

const DatePickerContext = createContext();
function useDatePickerContext() {
  const context = useContext(DatePickerContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useDatePickerContext` must be used within a `DatePicker` component");
  }
  return context;
}

function DatePickerCalendar(props) {
  const formControlContext = useFormControlContext();
  const context = useDatePickerContext();
  props = mergeDefaultProps({
    id: context.generateId("calendar")
  }, props);
  return createComponent(CalendarRoot, mergeProps$1({
    autoFocus: true,
    get selectionMode() {
      return context.selectionMode();
    },
    get value() {
      return context.dateValue();
    },
    get onChange() {
      return context.setDateValue;
    },
    get locale() {
      return context.locale();
    },
    get createCalendar() {
      return context.createCalendar;
    },
    get isDateUnavailable() {
      return context.isDateUnavailable;
    },
    get visibleDuration() {
      return context.visibleDuration();
    },
    get allowsNonContiguousRanges() {
      return context.allowsNonContiguousRanges();
    },
    get defaultFocusedValue() {
      return memo(() => !!context.dateValue())() ? undefined : context.placeholderValue();
    },
    get minValue() {
      return context.minValue();
    },
    get maxValue() {
      return context.maxValue();
    },
    get disabled() {
      return formControlContext.isDisabled();
    },
    get readOnly() {
      return formControlContext.isReadOnly();
    },
    get validationState() {
      return context.validationState();
    }
  }, props));
}

/**
 * The component that pops out when the date picker is open.
 */
function DatePickerContent(props) {
  let ref;
  const formControlContext = useFormControlContext();
  const context = useDatePickerContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "style", "onCloseAutoFocus", "onPointerDownOutside", "onFocusOutside", "onInteractOutside", "aria-labelledby"]);
  let isRightClickOutside = false;
  let hasInteractedOutside = false;
  let hasPointerDownOutside = false;
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(context.triggerId(), others["aria-label"], local["aria-labelledby"]);
  };
  const onCloseAutoFocus = e => {
    local.onCloseAutoFocus?.(e);
    if (context.isModal()) {
      e.preventDefault();
      if (!isRightClickOutside) {
        focusWithoutScrolling(context.triggerRef());
      }
    } else {
      if (!e.defaultPrevented) {
        if (!hasInteractedOutside) {
          focusWithoutScrolling(context.triggerRef());
        }

        // Always prevent autofocus because we either focus manually or want user agent focus
        e.preventDefault();
      }
      hasInteractedOutside = false;
      hasPointerDownOutside = false;
    }
  };
  const onPointerDownOutside = e => {
    local.onPointerDownOutside?.(e);
    if (context.isModal()) {
      isRightClickOutside = e.detail.isContextMenu;
    }
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);

    // When focus is trapped, a `focusout` event may still happen.
    // We make sure we don't trigger our `onDismiss` in such case.
    if (context.isModal()) {
      e.preventDefault();
    }
  };
  const onInteractOutside = e => {
    local.onInteractOutside?.(e);
    if (context.isModal()) {
      return;
    }

    // Non-modal behavior below

    if (!e.defaultPrevented) {
      hasInteractedOutside = true;
      if (e.detail.originalEvent.type === "pointerdown") {
        hasPointerDownOutside = true;
      }
    }

    // Prevent dismissing when clicking the trigger.
    // As the trigger is already setup to close, without doing so would
    // cause it to close and immediately open.
    if (contains(context.triggerRef(), e.target)) {
      e.preventDefault();
    }

    // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
    // we will get the pointer down outside event on the trigger, but then a subsequent
    // focus outside event on the container, we ignore any focus outside event when we've
    // already had a pointer down outside event.
    if (e.detail.originalEvent.type === "focusin" && hasPointerDownOutside) {
      e.preventDefault();
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => !(context.isModal() && context.isOpen()),
    targets: () => {
      const excludedElements = [];
      if (ref) {
        excludedElements.push(ref);
      }
      const controlEl = context.controlRef();
      if (controlEl) {
        excludedElements.push(controlEl);
      }
      return excludedElements;
    }
  });
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isModal() && context.isOpen())
  });
  createFocusScope({
    trapFocus: () => context.isModal() && context.isOpen(),
    onMountAutoFocus: e => {
      // We prevent open autofocus because it's handled by the `Calendar`.
      e.preventDefault();
    },
    onUnmountAutoFocus: onCloseAutoFocus
  }, () => ref);
  createEffect(() => onCleanup(context.registerContentId(others.id)));
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
                ref = el;
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "dialog",
            tabIndex: -1,
            get disableOutsidePointerEvents() {
              return memo(() => !!context.isModal())() && context.isOpen();
            },
            get excludedElements() {
              return [context.controlRef];
            },
            get style() {
              return {
                "--kb-date-picker-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            get ["aria-labelledby"]() {
              return ariaLabelledBy();
            },
            onPointerDownOutside: onPointerDownOutside,
            onFocusOutside: onFocusOutside,
            onInteractOutside: onInteractOutside,
            get onDismiss() {
              return context.close;
            }
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

/**
 * Contains the date picker input and trigger.
 */
function DatePickerControl(props) {
  let ref;
  const formControlContext = useFormControlContext();
  const context = useDatePickerContext();
  props = mergeDefaultProps({
    id: context.generateId("control")
  }, props);
  const [local, others] = splitProps(props, ["ref", "onPointerDown", "onClick", "onKeyDown", "aria-labelledby"]);
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(others.id, others["aria-label"], local["aria-labelledby"]);
  };

  // Focus the first placeholder segment from the end on mouse down/touch up in the field.
  const focusLast = () => {
    if (!ref) {
      return;
    }

    // Try to find the segment prior to the element that was clicked on.
    let target = getWindow(ref).event?.target;
    const walker = getFocusableTreeWalker(ref, {
      tabbable: true
    });
    if (target) {
      walker.currentNode = target;
      target = walker.previousNode();
    }

    // If no target found, find the last element from the end.
    if (!target) {
      let last;
      do {
        last = walker.lastChild();
        if (last) {
          target = last;
        }
      } while (last);
    }

    // Now go backwards until we find an element that is not a placeholder.
    while (target?.hasAttribute("data-placeholder")) {
      const prev = walker.previousNode();
      if (prev && prev.hasAttribute("data-placeholder")) {
        target = prev;
      } else {
        break;
      }
    }
    if (target) {
      target.focus();
    }
  };
  let pointerDownType = null;
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    pointerDownType = e.pointerType;

    // Focus last occurs on mouse down.
    if (e.pointerType === "mouse") {
      focusLast();
    }
  };
  const onClick = e => {
    callHandler(e, local.onClick);

    // If pointerType is touch/pen, make focus last happen on click.
    if (pointerDownType !== "mouse") {
      focusLast();
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);

    // Open the popover on alt + arrow down/up
    if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      e.stopPropagation();
      context.open();
    }
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        e.stopPropagation();
        if (context.direction() === "rtl") {
          context.focusManager().focusNext();
        } else {
          context.focusManager().focusPrevious();
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        e.stopPropagation();
        if (context.direction() === "rtl") {
          context.focusManager().focusPrevious();
        } else {
          context.focusManager().focusNext();
        }
        break;
    }
  };
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    role: "group",
    ref(r$) {
      const _ref$ = mergeRefs(el => {
        context.setControlRef(el);
        ref = el;
      }, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get ["aria-disabled"]() {
      return context.isDisabled() || undefined;
    },
    get ["aria-labelledby"]() {
      return ariaLabelledBy();
    },
    get ["aria-describedby"]() {
      return context.ariaDescribedBy();
    },
    onPointerDown: onPointerDown,
    onClick: onClick,
    onKeyDown: onKeyDown
  }, () => context.dataset(), () => formControlContext.dataset(), others));
}

const DatePickerInputContext = createContext();
function useDatePickerInputContext() {
  const context = useContext(DatePickerInputContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useDatePickerInputContext` must be used within a `DatePicker.Input` component");
  }
  return context;
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/950d45db36e63851f411ed0dc6a5aad0af57da68/packages/@react-stately/datepicker/src/placeholders.ts
 */


// These placeholders are based on the strings used by the <input type="date"> implementations in Chrome and Firefox.
// Additional languages are supported here than Kobalte's typical translations.
const placeholders = new MessageDictionary({
  ach: {
    year: "mwaka",
    month: "dwe",
    day: "nino"
  },
  af: {
    year: "jjjj",
    month: "mm",
    day: "dd"
  },
  am: {
    year: "ዓዓዓዓ",
    month: "ሚሜ",
    day: "ቀቀ"
  },
  an: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  ar: {
    year: "سنة",
    month: "شهر",
    day: "يوم"
  },
  ast: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  az: {
    year: "iiii",
    month: "aa",
    day: "gg"
  },
  be: {
    year: "гггг",
    month: "мм",
    day: "дд"
  },
  bg: {
    year: "гггг",
    month: "мм",
    day: "дд"
  },
  bn: {
    year: "yyyy",
    month: "মিমি",
    day: "dd"
  },
  br: {
    year: "bbbb",
    month: "mm",
    day: "dd"
  },
  bs: {
    year: "gggg",
    month: "mm",
    day: "dd"
  },
  ca: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  cak: {
    year: "jjjj",
    month: "ii",
    day: "q'q'"
  },
  ckb: {
    year: "ساڵ",
    month: "مانگ",
    day: "ڕۆژ"
  },
  cs: {
    year: "rrrr",
    month: "mm",
    day: "dd"
  },
  cy: {
    year: "bbbb",
    month: "mm",
    day: "dd"
  },
  da: {
    year: "åååå",
    month: "mm",
    day: "dd"
  },
  de: {
    year: "jjjj",
    month: "mm",
    day: "tt"
  },
  dsb: {
    year: "llll",
    month: "mm",
    day: "źź"
  },
  el: {
    year: "εεεε",
    month: "μμ",
    day: "ηη"
  },
  en: {
    year: "yyyy",
    month: "mm",
    day: "dd"
  },
  eo: {
    year: "jjjj",
    month: "mm",
    day: "tt"
  },
  es: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  et: {
    year: "aaaa",
    month: "kk",
    day: "pp"
  },
  eu: {
    year: "uuuu",
    month: "hh",
    day: "ee"
  },
  fa: {
    year: "سال",
    month: "ماه",
    day: "روز"
  },
  ff: {
    year: "hhhh",
    month: "ll",
    day: "ññ"
  },
  fi: {
    year: "vvvv",
    month: "kk",
    day: "pp"
  },
  fr: {
    year: "aaaa",
    month: "mm",
    day: "jj"
  },
  fy: {
    year: "jjjj",
    month: "mm",
    day: "dd"
  },
  ga: {
    year: "bbbb",
    month: "mm",
    day: "ll"
  },
  gd: {
    year: "bbbb",
    month: "mm",
    day: "ll"
  },
  gl: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  he: {
    year: "שנה",
    month: "חודש",
    day: "יום"
  },
  hr: {
    year: "gggg",
    month: "mm",
    day: "dd"
  },
  hsb: {
    year: "llll",
    month: "mm",
    day: "dd"
  },
  hu: {
    year: "éééé",
    month: "hh",
    day: "nn"
  },
  ia: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  id: {
    year: "tttt",
    month: "bb",
    day: "hh"
  },
  it: {
    year: "aaaa",
    month: "mm",
    day: "gg"
  },
  ja: {
    year: " 年 ",
    month: "月",
    day: "日"
  },
  ka: {
    year: "წწწწ",
    month: "თთ",
    day: "რრ"
  },
  kk: {
    year: "жжжж",
    month: "аа",
    day: "кк"
  },
  kn: {
    year: "ವವವವ",
    month: "ಮಿಮೀ",
    day: "ದಿದಿ"
  },
  ko: {
    year: "연도",
    month: "월",
    day: "일"
  },
  lb: {
    year: "jjjj",
    month: "mm",
    day: "dd"
  },
  lo: {
    year: "ປປປປ",
    month: "ດດ",
    day: "ວວ"
  },
  lt: {
    year: "mmmm",
    month: "mm",
    day: "dd"
  },
  lv: {
    year: "gggg",
    month: "mm",
    day: "dd"
  },
  meh: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  ml: {
    year: "വർഷം",
    month: "മാസം",
    day: "തീയതി"
  },
  ms: {
    year: "tttt",
    month: "mm",
    day: "hh"
  },
  nl: {
    year: "jjjj",
    month: "mm",
    day: "dd"
  },
  nn: {
    year: "åååå",
    month: "mm",
    day: "dd"
  },
  no: {
    year: "åååå",
    month: "mm",
    day: "dd"
  },
  oc: {
    year: "aaaa",
    month: "mm",
    day: "jj"
  },
  pl: {
    year: "rrrr",
    month: "mm",
    day: "dd"
  },
  pt: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  rm: {
    year: "oooo",
    month: "mm",
    day: "dd"
  },
  ro: {
    year: "aaaa",
    month: "ll",
    day: "zz"
  },
  ru: {
    year: "гггг",
    month: "мм",
    day: "дд"
  },
  sc: {
    year: "aaaa",
    month: "mm",
    day: "dd"
  },
  scn: {
    year: "aaaa",
    month: "mm",
    day: "jj"
  },
  sk: {
    year: "rrrr",
    month: "mm",
    day: "dd"
  },
  sl: {
    year: "llll",
    month: "mm",
    day: "dd"
  },
  sr: {
    year: "гггг",
    month: "мм",
    day: "дд"
  },
  sv: {
    year: "åååå",
    month: "mm",
    day: "dd"
  },
  szl: {
    year: "rrrr",
    month: "mm",
    day: "dd"
  },
  tg: {
    year: "сссс",
    month: "мм",
    day: "рр"
  },
  th: {
    year: "ปปปป",
    month: "ดด",
    day: "วว"
  },
  tr: {
    year: "yyyy",
    month: "aa",
    day: "gg"
  },
  uk: {
    year: "рррр",
    month: "мм",
    day: "дд"
  },
  "zh-CN": {
    year: "年",
    month: "月",
    day: "日"
  },
  "zh-TW": {
    year: "年",
    month: "月",
    day: "日"
  }
}, "en");
function getPlaceholder(field, value, locale) {
  // Use the actual placeholder value for the era and day period fields.
  if (field === "era" || field === "dayPeriod") {
    return value;
  }
  if (field === "year" || field === "month" || field === "day") {
    return placeholders.getStringForLocale(field, locale);
  }

  // For time fields (e.g. hour, minute, etc.), use two dashes as the placeholder.
  return "––";
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/950d45db36e63851f411ed0dc6a5aad0af57da68/packages/@react-stately/datepicker/src/utils.ts
 */

const DEFAULT_FIELD_OPTIONS = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit"
};
const TWO_DIGIT_FIELD_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
};
function getDateFieldFormatOptions(fieldOptions, options) {
  const defaultFieldOptions = options.shouldForceLeadingZeros ? TWO_DIGIT_FIELD_OPTIONS : DEFAULT_FIELD_OPTIONS;
  const finalFieldOptions = {
    ...defaultFieldOptions,
    ...fieldOptions
  };
  const granularity = options.granularity || "minute";
  const keys = Object.keys(finalFieldOptions);
  let startIdx = keys.indexOf(options.maxGranularity ?? "year");
  if (startIdx < 0) {
    startIdx = 0;
  }
  let endIdx = keys.indexOf(granularity);
  if (endIdx < 0) {
    endIdx = 2;
  }
  if (startIdx > endIdx) {
    throw new Error("maxGranularity must be greater than granularity");
  }
  const opts = keys.slice(startIdx, endIdx + 1).reduce((opts, key) => {
    // @ts-ignore
    opts[key] = finalFieldOptions[key];
    return opts;
  }, {});
  if (options.hourCycle != null) {
    opts.hour12 = options.hourCycle === 12;
  }
  opts.timeZone = options.timeZone || "UTC";
  const hasTime = granularity === "hour" || granularity === "minute" || granularity === "second";
  if (hasTime && options.timeZone && !options.hideTimeZone) {
    opts.timeZoneName = "short";
  }
  if (options.showEra && startIdx === 0) {
    opts.era = "short";
  }
  return opts;
}
function getPlaceholderTime(placeholderValue) {
  if (placeholderValue && "hour" in placeholderValue) {
    return placeholderValue;
  }
  return new Time();
}
function convertValue(value, calendar) {
  if (value === null) {
    return null;
  }
  if (!value) {
    return undefined;
  }
  return toCalendar(value, calendar);
}
function createPlaceholderDate(placeholderValue, granularity, calendar, timeZone) {
  if (placeholderValue) {
    return convertValue(placeholderValue, calendar);
  }
  const date = toCalendar(now(timeZone).set({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  }), calendar);
  if (granularity === "year" || granularity === "month" || granularity === "day") {
    return toCalendarDate(date);
  }
  if (!timeZone) {
    return toCalendarDateTime(date);
  }
  return date;
}
function createDefaultProps(props) {
  let lastValue;

  // Compute default granularity and time zone from the value.
  // If the value becomes null, keep the last value.
  const value = createMemo(() => {
    const resolvedValue = props.value();
    if (resolvedValue) {
      lastValue = resolvedValue;
    }
    return lastValue;
  });
  const defaultTimeZone = createMemo(() => {
    const resolvedValue = value();
    if (resolvedValue && "timeZone" in resolvedValue) {
      return resolvedValue.timeZone;
    }
    return undefined;
  });
  const granularity = createMemo(() => {
    const resolvedValue = value();
    return props.granularity() || (resolvedValue && "minute" in resolvedValue ? "minute" : "day");
  });
  createEffect(() => {
    const resolvedValue = value();
    const resolvedGranularity = granularity();

    // granularity must actually exist in the value if one is provided.
    if (resolvedValue && !(resolvedGranularity in resolvedValue)) {
      throw new Error("Invalid granularity " + resolvedGranularity + " for value " + resolvedValue.toString());
    }
  });
  return {
    granularity,
    defaultTimeZone
  };
}

const EDITABLE_SEGMENTS = {
  year: true,
  month: true,
  day: true,
  hour: true,
  minute: true,
  second: true,
  dayPeriod: true,
  era: true
};
const PAGE_STEP = {
  year: 5,
  month: 2,
  day: 7,
  hour: 2,
  minute: 15,
  second: 15
};

// Node seems to convert everything to lowercase...
const TYPE_MAPPING = {
  dayperiod: "dayPeriod"
};
function DatePickerInput(props) {
  const formControlContext = useFormControlContext();
  const datePickerContext = useDatePickerContext();
  props = mergeDefaultProps({
    id: datePickerContext.generateId("input")
  }, props);
  const [local, others] = splitProps(props, ["ref", "children", "onFocusOut", "aria-labelledby", "aria-describedby"]);
  const timeZone = createMemo(() => datePickerContext.defaultTimeZone() || "UTC");
  const defaultFormatter = createMemo(() => new DateFormatter(datePickerContext.locale()));
  const calendar = createMemo(() => {
    return datePickerContext.createCalendar(defaultFormatter().resolvedOptions().calendar);
  });
  const calendarValue = createMemo(() => {
    if (datePickerContext.selectionMode() === "single") {
      return convertValue(asSingleValue(datePickerContext.dateValue()), calendar());
    } else if (datePickerContext.selectionMode() === "multiple") ; else if (datePickerContext.selectionMode() === "range") ;
  });

  // We keep track of the placeholder date separately in state so that onChange is not called
  // until all segments are set. If the value === null (not undefined), then assume the component
  // is controlled, so use the placeholder as the value until all segments are entered, so it doesn't
  // change from uncontrolled to controlled.
  const [placeholderDate, setPlaceholderDate] = createSignal(createPlaceholderDate(datePickerContext.placeholderValue(), datePickerContext.granularity(), calendar(), timeZone()));
  const val = createMemo(() => calendarValue() || placeholderDate());
  const showEra = createMemo(() => calendar().identifier === "gregory" && val()?.era === "BC");
  const formatOpts = createMemo(() => ({
    granularity: datePickerContext.granularity(),
    maxGranularity: datePickerContext.maxGranularity() ?? "year",
    timeZone: datePickerContext.defaultTimeZone(),
    hideTimeZone: datePickerContext.hideTimeZone(),
    hourCycle: datePickerContext.hourCycle(),
    showEra: showEra(),
    shouldForceLeadingZeros: datePickerContext.shouldForceLeadingZeros()
  }));
  const opts = createMemo(() => getDateFieldFormatOptions({}, formatOpts()));
  const dateFormatter = createMemo(() => new DateFormatter(datePickerContext.locale(), opts()));
  const resolvedOptions = createMemo(() => dateFormatter().resolvedOptions());
  const ariaLabelledBy = createMemo(() => {
    return formControlContext.getAriaLabelledBy(others.id, others["aria-label"], local["aria-labelledby"]);
  });
  const ariaDescribedBy = createMemo(() => {
    return [local["aria-describedby"], datePickerContext.ariaDescribedBy()].filter(Boolean).join(" ");
  });

  // Determine how many editable segments there are for validation purposes.
  // The result is cached for performance.
  const allSegments = createMemo(() => {
    return dateFormatter().formatToParts(new Date()).filter(segment => EDITABLE_SEGMENTS[segment.type]).reduce((acc, segment) => {
      acc[segment.type] = true;
      return acc;
    }, {});
  });
  const [validSegments, setValidSegments] = createSignal(datePickerContext.value() ? {
    ...allSegments()
  } : {});

  // If all segments are valid, use the date from state, otherwise use the placeholder date.
  const displayValue = createMemo(() => {
    return calendarValue() && Object.keys(validSegments()).length >= Object.keys(allSegments()).length ? calendarValue() : placeholderDate();
  });
  const setValue = newValue => {
    if (formControlContext.isDisabled() || formControlContext.isReadOnly()) {
      return;
    }
    if (datePickerContext.selectionMode() === "single") {
      if (Object.keys(validSegments()).length >= Object.keys(allSegments()).length) {
        const v = asSingleValue(datePickerContext.value() || datePickerContext.placeholderValue());

        // The display calendar should not have any effect on the emitted value.
        // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
        datePickerContext.setDateValue(toCalendar(newValue, v?.calendar || new GregorianCalendar()));
      } else {
        setPlaceholderDate(newValue);
      }
    } else if (datePickerContext.selectionMode() === "multiple") ; else if (datePickerContext.selectionMode() === "range") ;
  };
  const dateValue = createMemo(() => displayValue()?.toDate(timeZone()));
  const segments = createMemo(() => {
    const resolvedDateValue = dateValue();
    const resolvedDisplayValue = displayValue();
    if (!resolvedDateValue || !resolvedDisplayValue) {
      return [];
    }
    return dateFormatter().formatToParts(resolvedDateValue).map(segment => {
      const isOriginallyEditable = EDITABLE_SEGMENTS[segment.type];
      let isEditable = isOriginallyEditable;
      if (segment.type === "era" && calendar().getEras().length === 1) {
        isEditable = false;
      }
      const isPlaceholder = isOriginallyEditable && !validSegments()[segment.type];
      const placeholder = isOriginallyEditable ? getPlaceholder(segment.type, segment.value, datePickerContext.locale()) : null;
      return {
        type: TYPE_MAPPING[segment.type] || segment.type,
        text: isPlaceholder ? placeholder : segment.value,
        ...getSegmentLimits(resolvedDisplayValue, segment.type, resolvedOptions()),
        isPlaceholder,
        placeholder,
        isEditable
      };
    });
  });
  const markValid = part => {
    setValidSegments(prev => {
      const newValue = {
        ...prev,
        [part]: true
      };
      if (part === "year" && allSegments().era) {
        newValue.era = true;
      }
      return newValue;
    });
  };
  const adjustSegment = (type, amount) => {
    const resolvedDisplayValue = displayValue();
    if (!validSegments()[type]) {
      markValid(type);
      if (resolvedDisplayValue && Object.keys(validSegments()).length >= Object.keys(allSegments()).length) {
        setValue(resolvedDisplayValue);
      }
    } else if (resolvedDisplayValue) {
      const newValue = addSegment(resolvedDisplayValue, type, amount, resolvedOptions());
      if (newValue) {
        setValue(newValue);
      }
    }
  };

  /**
   * Increments the given segment.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  const increment = part => {
    adjustSegment(part, 1);
  };

  /**
   * Decrements the given segment.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  const decrement = part => {
    adjustSegment(part, -1);
  };

  /**
   * Increments the given segment by a larger amount, rounding it to the nearest increment.
   * The amount to increment by depends on the field, for example 15 minutes, 7 days, and 5 years.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  const incrementPage = part => {
    adjustSegment(part, PAGE_STEP[part] || 1);
  };

  /**
   * Decrements the given segment by a larger amount, rounding it to the nearest increment.
   * The amount to decrement by depends on the field, for example 15 minutes, 7 days, and 5 years.
   * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
   */
  const decrementPage = part => {
    adjustSegment(part, -(PAGE_STEP[part] || 1));
  };

  /** Sets the value of the given segment. */
  const setSegment = (part, value) => {
    markValid(part);
    const resolvedDisplayValue = displayValue();
    if (resolvedDisplayValue) {
      const newValue = setSegmentBase(resolvedDisplayValue, part, value, resolvedOptions());
      if (newValue) {
        setValue(newValue);
      }
    }
  };

  /** Clears the value of the given segment, reverting it to the placeholder. */
  const clearSegment = part => {
    setValidSegments(prev => {
      const newValue = {
        ...prev
      };
      delete newValue[part];
      return newValue;
    });
    const placeholder = createPlaceholderDate(datePickerContext.placeholderValue(), datePickerContext.granularity(), calendar(), timeZone());
    const resolvedDisplayValue = displayValue();
    let value = resolvedDisplayValue;

    // Reset day period to default without changing the hour.
    if (resolvedDisplayValue && placeholder) {
      if (part === "dayPeriod" && "hour" in resolvedDisplayValue && "hour" in placeholder) {
        const isPM = resolvedDisplayValue.hour >= 12;
        const shouldBePM = placeholder.hour >= 12;
        if (isPM && !shouldBePM) {
          value = resolvedDisplayValue.set({
            hour: resolvedDisplayValue.hour - 12
          });
        } else if (!isPM && shouldBePM) {
          value = resolvedDisplayValue.set({
            hour: resolvedDisplayValue.hour + 12
          });
        }
      } else if (part in resolvedDisplayValue) {
        value = resolvedDisplayValue.set({
          [part]: placeholder[part]
        });
      }
    }
    datePickerContext.setDateValue(undefined);
    if (value) {
      setValue(value);
    }
  };

  /** Formats the current date value using the given options. */
  const formatValue = fieldOptions => {
    const resolvedDateValue = dateValue();
    if (!calendarValue() || !resolvedDateValue) {
      return "";
    }
    const formatOptions = getDateFieldFormatOptions(fieldOptions, formatOpts());
    const formatter = new DateFormatter(datePickerContext.locale(), formatOptions);
    return formatter.format(resolvedDateValue);
  };
  const onFocusOut = e => {
    callHandler(e, local.onFocusOut);
    if (formControlContext.isDisabled() || formControlContext.isReadOnly()) {
      return;
    }

    // Confirm the placeholder if only the day period is not filled in.
    const validKeys = Object.keys(validSegments());
    const allKeys = Object.keys(allSegments());
    if (validKeys.length === allKeys.length - 1 && allSegments().dayPeriod && !validSegments().dayPeriod) {
      setValidSegments({
        ...allSegments()
      });
      const resolvedDisplayValue = displayValue();
      if (resolvedDisplayValue) {
        setValue(resolvedDisplayValue.copy());
      }
    }
  };

  // Reset placeholder when calendar changes
  createEffect(on([calendar, timeZone, validSegments, () => datePickerContext.placeholderValue(), () => datePickerContext.granularity()], ([calendar, timeZone, validSegments, placeholderValue, granularity]) => {
    setPlaceholderDate(placeholder => {
      return Object.keys(validSegments).length > 0 ? convertValue(placeholder, calendar) : createPlaceholderDate(placeholderValue, granularity, calendar, timeZone);
    });
  }));

  // If there is a value prop, and some segments were previously placeholders, mark them all as valid.
  createEffect(() => {
    if (datePickerContext.value() && Object.keys(validSegments()).length < Object.keys(allSegments()).length) {
      setValidSegments({
        ...allSegments()
      });
    }
  });

  // If the value is set to null and all segments are valid, reset the placeholder.
  createEffect(() => {
    if (datePickerContext.value() == null
    // && Object.keys(validSegments()).length === Object.keys(allSegments()).length
    ) {
      setValidSegments({});
      setPlaceholderDate(createPlaceholderDate(datePickerContext.placeholderValue(), datePickerContext.granularity(), calendar(), timeZone()));
    }
  });

  // When the era field appears, mark it valid if the year field is already valid.
  // If the era field disappears, remove it from the valid segments.
  createEffect(() => {
    if (allSegments().era && validSegments().year && !validSegments().era) {
      setValidSegments(prev => ({
        ...prev,
        era: true
      }));
    } else if (!allSegments().era && validSegments().era) {
      setValidSegments(prev => {
        const newValue = {
          ...prev
        };
        delete newValue.era;
        return newValue;
      });
    }
  });
  const context = {
    calendar,
    dateValue,
    dateFormatterResolvedOptions: resolvedOptions,
    ariaLabel: () => others["aria-label"],
    ariaLabelledBy,
    ariaDescribedBy,
    segments,
    increment,
    decrement,
    incrementPage,
    decrementPage,
    setSegment,
    clearSegment,
    formatValue
  };
  return createComponent(DatePickerInputContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        role: "presentation",
        ref(r$) {
          const _ref$ = mergeRefs(el => el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        onFocusOut: onFocusOut,
        get ["aria-labelledby"]() {
          return ariaLabelledBy();
        },
        get ["aria-describedby"]() {
          return ariaDescribedBy();
        }
      }, () => datePickerContext.dataset(), () => formControlContext.dataset(), others, {
        get children() {
          return createComponent(Index, {
            get each() {
              return segments();
            },
            children: segment => local.children?.(segment)
          });
        }
      }));
    }
  });
}
function getSegmentLimits(date, type, options) {
  switch (type) {
    case "era":
      {
        const eras = date.calendar.getEras();
        return {
          value: eras.indexOf(date.era),
          minValue: 0,
          maxValue: eras.length - 1
        };
      }
    case "year":
      return {
        value: date.year,
        minValue: 1,
        maxValue: date.calendar.getYearsInEra(date)
      };
    case "month":
      return {
        value: date.month,
        minValue: getMinimumMonthInYear(date),
        maxValue: date.calendar.getMonthsInYear(date)
      };
    case "day":
      return {
        value: date.day,
        minValue: getMinimumDayInMonth(date),
        maxValue: date.calendar.getDaysInMonth(date)
      };
  }
  if ("hour" in date) {
    switch (type) {
      case "dayPeriod":
        return {
          value: date.hour >= 12 ? 12 : 0,
          minValue: 0,
          maxValue: 12
        };
      case "hour":
        if (options.hour12) {
          const isPM = date.hour >= 12;
          return {
            value: date.hour,
            minValue: isPM ? 12 : 0,
            maxValue: isPM ? 23 : 11
          };
        }
        return {
          value: date.hour,
          minValue: 0,
          maxValue: 23
        };
      case "minute":
        return {
          value: date.minute,
          minValue: 0,
          maxValue: 59
        };
      case "second":
        return {
          value: date.second,
          minValue: 0,
          maxValue: 59
        };
    }
  }
  return {};
}
function addSegment(value, part, amount, options) {
  switch (part) {
    case "era":
    case "year":
    case "month":
    case "day":
      return value.cycle(part, amount, {
        round: part === "year"
      });
  }
  if ("hour" in value) {
    switch (part) {
      case "dayPeriod":
        {
          const hours = value.hour;
          const isPM = hours >= 12;
          return value.set({
            hour: isPM ? hours - 12 : hours + 12
          });
        }
      case "hour":
      case "minute":
      case "second":
        return value.cycle(part, amount, {
          round: part !== "hour",
          hourCycle: options.hour12 ? 12 : 24
        });
    }
  }
}
function setSegmentBase(value, part, segmentValue, options) {
  switch (part) {
    case "day":
    case "month":
    case "year":
    case "era":
      return value.set({
        [part]: segmentValue
      });
  }
  if ("hour" in value) {
    switch (part) {
      case "dayPeriod":
        {
          const hours = value.hour;
          const wasPM = hours >= 12;
          const isPM = segmentValue >= 12;
          if (isPM === wasPM) {
            return value;
          }
          return value.set({
            hour: wasPM ? hours - 12 : hours + 12
          });
        }
      case "hour":
        // In 12 hour time, ensure that AM/PM does not change
        if (options.hour12) {
          const hours = value.hour;
          const wasPM = hours >= 12;
          if (!wasPM && segmentValue === 12) {
            segmentValue = 0;
          }
          if (wasPM && segmentValue < 12) {
            segmentValue += 12;
          }
        }
      // fallthrough
      case "minute":
      case "second":
        return value.set({
          [part]: segmentValue
        });
    }
  }
}

/**
 * Portals its children into the `body` when the date picker is open.
 */
function DatePickerPortal(props) {
  const context = useDatePickerContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

const DATE_PICKER_INTL_MESSAGES = {
  "ar-AE": {
    calendar: "التقويم",
    day: "يوم",
    dayPeriod: "ص/م",
    endDate: "تاريخ الانتهاء",
    era: "العصر",
    hour: "الساعات",
    minute: "الدقائق",
    month: "الشهر",
    second: "الثواني",
    selectedDateDescription: "تاريخ محدد: {date}",
    selectedRangeDescription: "المدى الزمني المحدد: {startDate} إلى {endDate}",
    selectedTimeDescription: "الوقت المحدد: {time}",
    startDate: "تاريخ البدء",
    timeZoneName: "التوقيت",
    weekday: "اليوم",
    year: "السنة"
  },
  "bg-BG": {
    calendar: "Календар",
    day: "ден",
    dayPeriod: "пр.об./сл.об.",
    endDate: "Крайна дата",
    era: "ера",
    hour: "час",
    minute: "минута",
    month: "месец",
    second: "секунда",
    selectedDateDescription: "Избрана дата: {date}",
    selectedRangeDescription: "Избран диапазон: {startDate} до {endDate}",
    selectedTimeDescription: "Избрано време: {time}",
    startDate: "Начална дата",
    timeZoneName: "часова зона",
    weekday: "ден от седмицата",
    year: "година"
  },
  "cs-CZ": {
    calendar: "Kalendář",
    day: "den",
    dayPeriod: "část dne",
    endDate: "Konečné datum",
    era: "letopočet",
    hour: "hodina",
    minute: "minuta",
    month: "měsíc",
    second: "sekunda",
    selectedDateDescription: "Vybrané datum: {date}",
    selectedRangeDescription: "Vybrané období: {startDate} až {endDate}",
    selectedTimeDescription: "Vybraný čas: {time}",
    startDate: "Počáteční datum",
    timeZoneName: "časové pásmo",
    weekday: "den v týdnu",
    year: "rok"
  },
  "da-DK": {
    calendar: "Kalender",
    day: "dag",
    dayPeriod: "AM/PM",
    endDate: "Slutdato",
    era: "æra",
    hour: "time",
    minute: "minut",
    month: "måned",
    second: "sekund",
    selectedDateDescription: "Valgt dato: {date}",
    selectedRangeDescription: "Valgt interval: {startDate} til {endDate}",
    selectedTimeDescription: "Valgt tidspunkt: {time}",
    startDate: "Startdato",
    timeZoneName: "tidszone",
    weekday: "ugedag",
    year: "år"
  },
  "de-DE": {
    calendar: "Kalender",
    day: "Tag",
    dayPeriod: "Tageshälfte",
    endDate: "Enddatum",
    era: "Epoche",
    hour: "Stunde",
    minute: "Minute",
    month: "Monat",
    second: "Sekunde",
    selectedDateDescription: "Ausgewähltes Datum: {date}",
    selectedRangeDescription: "Ausgewählter Bereich: {startDate} bis {endDate}",
    selectedTimeDescription: "Ausgewählte Zeit: {time}",
    startDate: "Anfangsdatum",
    timeZoneName: "Zeitzone",
    weekday: "Wochentag",
    year: "Jahr"
  },
  "el-GR": {
    calendar: "Ημερολόγιο",
    day: "ημέρα",
    dayPeriod: "π.μ./μ.μ.",
    endDate: "Ημερομηνία λήξης",
    era: "περίοδος",
    hour: "ώρα",
    minute: "λεπτό",
    month: "μήνας",
    second: "δευτερόλεπτο",
    selectedDateDescription: "Επιλεγμένη ημερομηνία: {date}",
    selectedRangeDescription: "Επιλεγμένο εύρος: {startDate} έως {endDate}",
    selectedTimeDescription: "Επιλεγμένη ώρα: {time}",
    startDate: "Ημερομηνία έναρξης",
    timeZoneName: "ζώνη ώρας",
    weekday: "καθημερινή",
    year: "έτος"
  },
  "en-US": {
    era: "era",
    year: "year",
    month: "month",
    day: "day",
    hour: "hour",
    minute: "minute",
    second: "second",
    dayPeriod: "AM/PM",
    calendar: "Calendar",
    startDate: "Start Date",
    endDate: "End Date",
    weekday: "day of the week",
    timeZoneName: "time zone",
    selectedDateDescription: "Selected Date: {date}",
    selectedRangeDescription: "Selected Range: {startDate} to {endDate}",
    selectedTimeDescription: "Selected Time: {time}"
  },
  "es-ES": {
    calendar: "Calendario",
    day: "día",
    dayPeriod: "a. m./p. m.",
    endDate: "Fecha final",
    era: "era",
    hour: "hora",
    minute: "minuto",
    month: "mes",
    second: "segundo",
    selectedDateDescription: "Fecha seleccionada: {date}",
    selectedRangeDescription: "Rango seleccionado: {startDate} a {endDate}",
    selectedTimeDescription: "Hora seleccionada: {time}",
    startDate: "Fecha de inicio",
    timeZoneName: "zona horaria",
    weekday: "día de la semana",
    year: "año"
  },
  "et-EE": {
    calendar: "Kalender",
    day: "päev",
    dayPeriod: "enne/pärast lõunat",
    endDate: "Lõppkuupäev",
    era: "ajastu",
    hour: "tund",
    minute: "minut",
    month: "kuu",
    second: "sekund",
    selectedDateDescription: "Valitud kuupäev: {date}",
    selectedRangeDescription: "Valitud vahemik: {startDate} kuni {endDate}",
    selectedTimeDescription: "Valitud aeg: {time}",
    startDate: "Alguskuupäev",
    timeZoneName: "ajavöönd",
    weekday: "nädalapäev",
    year: "aasta"
  },
  "fi-FI": {
    calendar: "Kalenteri",
    day: "päivä",
    dayPeriod: "vuorokaudenaika",
    endDate: "Päättymispäivä",
    era: "aikakausi",
    hour: "tunti",
    minute: "minuutti",
    month: "kuukausi",
    second: "sekunti",
    selectedDateDescription: "Valittu päivämäärä: {date}",
    selectedRangeDescription: "Valittu aikaväli: {startDate} – {endDate}",
    selectedTimeDescription: "Valittu aika: {time}",
    startDate: "Alkamispäivä",
    timeZoneName: "aikavyöhyke",
    weekday: "viikonpäivä",
    year: "vuosi"
  },
  "fr-FR": {
    calendar: "Calendrier",
    day: "jour",
    dayPeriod: "cadran",
    endDate: "Date de fin",
    era: "ère",
    hour: "heure",
    minute: "minute",
    month: "mois",
    second: "seconde",
    selectedDateDescription: "Date sélectionnée : {date}",
    selectedRangeDescription: "Plage sélectionnée : {startDate} au {endDate}",
    selectedTimeDescription: "Heure choisie : {time}",
    startDate: "Date de début",
    timeZoneName: "fuseau horaire",
    weekday: "jour de la semaine",
    year: "année"
  },
  "he-IL": {
    calendar: "לוח שנה",
    day: "יום",
    dayPeriod: "לפנה״צ/אחה״צ",
    endDate: "תאריך סיום",
    era: "תקופה",
    hour: "שעה",
    minute: "דקה",
    month: "חודש",
    second: "שנייה",
    selectedDateDescription: "תאריך נבחר: {date}",
    selectedRangeDescription: "טווח נבחר: {startDate} עד {endDate}",
    selectedTimeDescription: "זמן נבחר: {time}",
    startDate: "תאריך התחלה",
    timeZoneName: "אזור זמן",
    weekday: "יום בשבוע",
    year: "שנה"
  },
  "hr-HR": {
    calendar: "Kalendar",
    day: "dan",
    dayPeriod: "AM/PM",
    endDate: "Datum završetka",
    era: "era",
    hour: "sat",
    minute: "minuta",
    month: "mjesec",
    second: "sekunda",
    selectedDateDescription: "Odabrani datum: {date}",
    selectedRangeDescription: "Odabrani raspon: {startDate} do {endDate}",
    selectedTimeDescription: "Odabrano vrijeme: {time}",
    startDate: "Datum početka",
    timeZoneName: "vremenska zona",
    weekday: "dan u tjednu",
    year: "godina"
  },
  "hu-HU": {
    calendar: "Naptár",
    day: "nap",
    dayPeriod: "napszak",
    endDate: "Befejező dátum",
    era: "éra",
    hour: "óra",
    minute: "perc",
    month: "hónap",
    second: "másodperc",
    selectedDateDescription: "Kijelölt dátum: {date}",
    selectedRangeDescription: "Kijelölt tartomány: {startDate}–{endDate}",
    selectedTimeDescription: "Kijelölt idő: {time}",
    startDate: "Kezdő dátum",
    timeZoneName: "időzóna",
    weekday: "hét napja",
    year: "év"
  },
  "it-IT": {
    calendar: "Calendario",
    day: "giorno",
    dayPeriod: "AM/PM",
    endDate: "Data finale",
    era: "era",
    hour: "ora",
    minute: "minuto",
    month: "mese",
    second: "secondo",
    selectedDateDescription: "Data selezionata: {date}",
    selectedRangeDescription: "Intervallo selezionato: da {startDate} a {endDate}",
    selectedTimeDescription: "Ora selezionata: {time}",
    startDate: "Data iniziale",
    timeZoneName: "fuso orario",
    weekday: "giorno della settimana",
    year: "anno"
  },
  "ja-JP": {
    calendar: "カレンダー",
    day: "日",
    dayPeriod: "午前/午後",
    endDate: "終了日",
    era: "時代",
    hour: "時",
    minute: "分",
    month: "月",
    second: "秒",
    selectedDateDescription: "選択した日付 : {date}",
    selectedRangeDescription: "選択範囲 : {startDate} から {endDate}",
    selectedTimeDescription: "選択した時間 : {time}",
    startDate: "開始日",
    timeZoneName: "タイムゾーン",
    weekday: "曜日",
    year: "年"
  },
  "ko-KR": {
    calendar: "달력",
    day: "일",
    dayPeriod: "오전/오후",
    endDate: "종료 날짜",
    era: "연호",
    hour: "시",
    minute: "분",
    month: "월",
    second: "초",
    selectedDateDescription: "선택 일자: {date}",
    selectedRangeDescription: "선택 범위: {startDate} ~ {endDate}",
    selectedTimeDescription: "선택 시간: {time}",
    startDate: "시작 날짜",
    timeZoneName: "시간대",
    weekday: "요일",
    year: "년"
  },
  "lt-LT": {
    calendar: "Kalendorius",
    day: "diena",
    dayPeriod: "iki pietų / po pietų",
    endDate: "Pabaigos data",
    era: "era",
    hour: "valanda",
    minute: "minutė",
    month: "mėnuo",
    second: "sekundė",
    selectedDateDescription: "Pasirinkta data: {date}",
    selectedRangeDescription: "Pasirinktas intervalas: nuo {startDate} iki {endDate}",
    selectedTimeDescription: "Pasirinktas laikas: {time}",
    startDate: "Pradžios data",
    timeZoneName: "laiko juosta",
    weekday: "savaitės diena",
    year: "metai"
  },
  "lv-LV": {
    calendar: "Kalendārs",
    day: "diena",
    dayPeriod: "priekšpusdienā/pēcpusdienā",
    endDate: "Beigu datums",
    era: "ēra",
    hour: "stundas",
    minute: "minūtes",
    month: "mēnesis",
    second: "sekundes",
    selectedDateDescription: "Atlasītais datums: {date}",
    selectedRangeDescription: "Atlasītais diapazons: no {startDate} līdz {endDate}",
    selectedTimeDescription: "Atlasītais laiks: {time}",
    startDate: "Sākuma datums",
    timeZoneName: "laika josla",
    weekday: "nedēļas diena",
    year: "gads"
  },
  "nb-NO": {
    calendar: "Kalender",
    day: "dag",
    dayPeriod: "a.m./p.m.",
    endDate: "Sluttdato",
    era: "tidsalder",
    hour: "time",
    minute: "minutt",
    month: "måned",
    second: "sekund",
    selectedDateDescription: "Valgt dato: {date}",
    selectedRangeDescription: "Valgt område: {startDate} til {endDate}",
    selectedTimeDescription: "Valgt tid: {time}",
    startDate: "Startdato",
    timeZoneName: "tidssone",
    weekday: "ukedag",
    year: "år"
  },
  "nl-NL": {
    calendar: "Kalender",
    day: "dag",
    dayPeriod: "a.m./p.m.",
    endDate: "Einddatum",
    era: "tijdperk",
    hour: "uur",
    minute: "minuut",
    month: "maand",
    second: "seconde",
    selectedDateDescription: "Geselecteerde datum: {date}",
    selectedRangeDescription: "Geselecteerd bereik: {startDate} tot {endDate}",
    selectedTimeDescription: "Geselecteerde tijd: {time}",
    startDate: "Startdatum",
    timeZoneName: "tijdzone",
    weekday: "dag van de week",
    year: "jaar"
  },
  "pl-PL": {
    calendar: "Kalendarz",
    day: "dzień",
    dayPeriod: "rano / po południu / wieczorem",
    endDate: "Data końcowa",
    era: "era",
    hour: "godzina",
    minute: "minuta",
    month: "miesiąc",
    second: "sekunda",
    selectedDateDescription: "Wybrana data: {date}",
    selectedRangeDescription: "Wybrany zakres: {startDate} do {endDate}",
    selectedTimeDescription: "Wybrany czas: {time}",
    startDate: "Data początkowa",
    timeZoneName: "strefa czasowa",
    weekday: "dzień tygodnia",
    year: "rok"
  },
  "pt-BR": {
    calendar: "Calendário",
    day: "dia",
    dayPeriod: "AM/PM",
    endDate: "Data final",
    era: "era",
    hour: "hora",
    minute: "minuto",
    month: "mês",
    second: "segundo",
    selectedDateDescription: "Data selecionada: {date}",
    selectedRangeDescription: "Intervalo selecionado: {startDate} a {endDate}",
    selectedTimeDescription: "Hora selecionada: {time}",
    startDate: "Data inicial",
    timeZoneName: "fuso horário",
    weekday: "dia da semana",
    year: "ano"
  },
  "pt-PT": {
    calendar: "Calendário",
    day: "dia",
    dayPeriod: "am/pm",
    endDate: "Data de Término",
    era: "era",
    hour: "hora",
    minute: "minuto",
    month: "mês",
    second: "segundo",
    selectedDateDescription: "Data selecionada: {date}",
    selectedRangeDescription: "Intervalo selecionado: {startDate} a {endDate}",
    selectedTimeDescription: "Hora selecionada: {time}",
    startDate: "Data de Início",
    timeZoneName: "fuso horário",
    weekday: "dia da semana",
    year: "ano"
  },
  "ro-RO": {
    calendar: "Calendar",
    day: "zi",
    dayPeriod: "a.m/p.m.",
    endDate: "Dată final",
    era: "eră",
    hour: "oră",
    minute: "minut",
    month: "lună",
    second: "secundă",
    selectedDateDescription: "Dată selectată: {date}",
    selectedRangeDescription: "Interval selectat: de la {startDate} până la {endDate}",
    selectedTimeDescription: "Ora selectată: {time}",
    startDate: "Dată început",
    timeZoneName: "fus orar",
    weekday: "ziua din săptămână",
    year: "an"
  },
  "ru-RU": {
    calendar: "Календарь",
    day: "день",
    dayPeriod: "AM/PM",
    endDate: "Дата окончания",
    era: "эра",
    hour: "час",
    minute: "минута",
    month: "месяц",
    second: "секунда",
    selectedDateDescription: "Выбранная дата: {date}",
    selectedRangeDescription: "Выбранный диапазон: с {startDate} по {endDate}",
    selectedTimeDescription: "Выбранное время: {time}",
    startDate: "Дата начала",
    timeZoneName: "часовой пояс",
    weekday: "день недели",
    year: "год"
  },
  "sk-SK": {
    calendar: "Kalendár",
    day: "deň",
    dayPeriod: "AM/PM",
    endDate: "Dátum ukončenia",
    era: "letopočet",
    hour: "hodina",
    minute: "minúta",
    month: "mesiac",
    second: "sekunda",
    selectedDateDescription: "Vybratý dátum: {date}",
    selectedRangeDescription: "Vybratý rozsah: od {startDate} do {endDate}",
    selectedTimeDescription: "Vybratý čas: {time}",
    startDate: "Dátum začatia",
    timeZoneName: "časové pásmo",
    weekday: "deň týždňa",
    year: "rok"
  },
  "sl-SI": {
    calendar: "Koledar",
    day: "dan",
    dayPeriod: "dop/pop",
    endDate: "Datum konca",
    era: "doba",
    hour: "ura",
    minute: "minuta",
    month: "mesec",
    second: "sekunda",
    selectedDateDescription: "Izbrani datum: {date}",
    selectedRangeDescription: "Izbrano območje: {startDate} do {endDate}",
    selectedTimeDescription: "Izbrani čas: {time}",
    startDate: "Datum začetka",
    timeZoneName: "časovni pas",
    weekday: "dan v tednu",
    year: "leto"
  },
  "sr-SP": {
    calendar: "Kalendar",
    day: "дан",
    dayPeriod: "пре подне/по подне",
    endDate: "Datum završetka",
    era: "ера",
    hour: "сат",
    minute: "минут",
    month: "месец",
    second: "секунд",
    selectedDateDescription: "Izabrani datum: {date}",
    selectedRangeDescription: "Izabrani opseg: od {startDate} do {endDate}",
    selectedTimeDescription: "Izabrano vreme: {time}",
    startDate: "Datum početka",
    timeZoneName: "временска зона",
    weekday: "дан у недељи",
    year: "година"
  },
  "sv-SE": {
    calendar: "Kalender",
    day: "dag",
    dayPeriod: "fm/em",
    endDate: "Slutdatum",
    era: "era",
    hour: "timme",
    minute: "minut",
    month: "månad",
    second: "sekund",
    selectedDateDescription: "Valt datum: {date}",
    selectedRangeDescription: "Valt intervall: {startDate} till {endDate}",
    selectedTimeDescription: "Vald tid: {time}",
    startDate: "Startdatum",
    timeZoneName: "tidszon",
    weekday: "veckodag",
    year: "år"
  },
  "tr-TR": {
    calendar: "Takvim",
    day: "gün",
    dayPeriod: "ÖÖ/ÖS",
    endDate: "Bitiş Tarihi",
    era: "çağ",
    hour: "saat",
    minute: "dakika",
    month: "ay",
    second: "saniye",
    selectedDateDescription: "Seçilen Tarih: {date}",
    selectedRangeDescription: "Seçilen Aralık: {startDate} - {endDate}",
    selectedTimeDescription: "Seçilen Zaman: {time}",
    startDate: "Başlangıç Tarihi",
    timeZoneName: "saat dilimi",
    weekday: "haftanın günü",
    year: "yıl"
  },
  "uk-UA": {
    calendar: "Календар",
    day: "день",
    dayPeriod: "дп/пп",
    endDate: "Дата завершення",
    era: "ера",
    hour: "година",
    minute: "хвилина",
    month: "місяць",
    second: "секунда",
    selectedDateDescription: "Вибрана дата: {date}",
    selectedRangeDescription: "Вибраний діапазон: {startDate} — {endDate}",
    selectedTimeDescription: "Вибраний час: {time}",
    startDate: "Дата початку",
    timeZoneName: "часовий пояс",
    weekday: "день тижня",
    year: "рік"
  },
  "zh-CN": {
    calendar: "日历",
    day: "日",
    dayPeriod: "上午/下午",
    endDate: "结束日期",
    era: "纪元",
    hour: "小时",
    minute: "分钟",
    month: "月",
    second: "秒",
    selectedDateDescription: "选定的日期：{date}",
    selectedRangeDescription: "选定的范围：{startDate} 至 {endDate}",
    selectedTimeDescription: "选定的时间：{time}",
    startDate: "开始日期",
    timeZoneName: "时区",
    weekday: "工作日",
    year: "年"
  },
  "zh-TW": {
    calendar: "日曆",
    day: "日",
    dayPeriod: "上午/下午",
    endDate: "結束日期",
    era: "纪元",
    hour: "小时",
    minute: "分钟",
    month: "月",
    second: "秒",
    selectedDateDescription: "選定的日期：{date}",
    selectedRangeDescription: "選定的範圍：{startDate} 至 {endDate}",
    selectedTimeDescription: "選定的時間：{time}",
    startDate: "開始日期",
    timeZoneName: "时区",
    weekday: "工作日",
    year: "年"
  }
};

/**
 * A date picker combines a `DateField` and a `Calendar` popover to allow users to enter or select a date and time value.
 */
function DatePickerRoot(props) {
  const defaultId = `date-picker-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    visibleDuration: {
      months: 1
    },
    selectionMode: "single",
    maxGranularity: "year",
    hideTimeZone: false,
    shouldForceLeadingZeros: false,
    modal: false,
    gutter: 8,
    sameWidth: false,
    placement: "bottom-start"
  }, props);
  const [local, popperProps, formControlProps, others] = splitProps(props, ["locale", "createCalendar", "visibleDuration", "selectionMode", "isDateUnavailable", "allowsNonContiguousRanges", "closeOnSelect", "minValue", "maxValue", "placeholderValue", "hourCycle", "granularity", "maxGranularity", "hideTimeZone", "shouldForceLeadingZeros", "validationState", "open", "defaultOpen", "onOpenChange", "value", "defaultValue", "onChange", "modal", "forceMount"], ["getAnchorRect", "placement", "gutter", "shift", "flip", "slide", "overlap", "sameWidth", "fitViewport", "hideWhenDetached", "detachedPadding", "arrowPadding", "overflowPadding"], FORM_CONTROL_PROP_NAMES);
  const [triggerId, setTriggerId] = createSignal();
  const [contentId, setContentId] = createSignal();
  const [controlRef, setControlRef] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const messageFormatter = createMessageFormatter(() => DATE_PICKER_INTL_MESSAGES);
  const locale = createMemo(() => {
    return local.locale ?? useLocale().locale();
  });
  const direction = createMemo(() => {
    return getReadingDirection(locale());
  });
  const focusManager = createFocusManager(controlRef);
  const closeOnSelect = createMemo(() => {
    return local.closeOnSelect ?? local.selectionMode !== "multiple";
  });
  const [value, setValue] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: value => local.onChange?.(value)
  });

  // The date portion of the selected date, dates or range.
  const [selectedDate, setSelectedDate] = createSignal();

  // The time portion of the selected date or range.
  const [selectedTime, setSelectedTime] = createSignal();
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const {
    granularity,
    defaultTimeZone
  } = createDefaultProps({
    value: () => getFirstValueOfSelection(local.selectionMode, value()) ?? local.placeholderValue,
    granularity: () => local.granularity
  });
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const validationState = createMemo(() => {
    if (local.validationState) {
      return local.validationState;
    }
    const values = getArrayValueOfSelection(local.selectionMode, value());
    if (values.length <= 0) {
      return undefined;
    }
    const isSomeDateInvalid = values.some(date => {
      return local.isDateUnavailable?.(date) || isDateInvalid(date, local.minValue, local.maxValue);
    });
    return isSomeDateInvalid ? "invalid" : undefined;
  });
  const {
    formControlContext
  } = createFormControl(mergeProps(formControlProps, {
    // override the `validationState` provided by prop to include additional logic.
    get validationState() {
      return validationState();
    }
  }));
  createFormResetListener(contentRef, () => {
    setValue(local.defaultValue);
  });
  const hasTime = createMemo(() => {
    return granularity() === "hour" || granularity() === "minute" || granularity() === "second";
  });
  const formattedValue = createMemo(() => {
    const firstValue = getFirstValueOfSelection(local.selectionMode, value());
    if (!firstValue) {
      return "";
    }
    const formatOptions = getDateFieldFormatOptions({
      month: "long"
    }, {
      granularity: granularity(),
      timeZone: defaultTimeZone(),
      hideTimeZone: local.hideTimeZone,
      hourCycle: local.hourCycle,
      showEra: firstValue.calendar.identifier === "gregory" && firstValue.era === "BC"
    });
    const dateFormatter = createMemo(() => new DateFormatter(locale(), formatOptions));
    const formatDate = date => {
      return date ? dateFormatter().format(date.toDate(defaultTimeZone() ?? "UTC")) : "";
    };
    let formattedValue;
    if (local.selectionMode === "single") {
      formattedValue = formatDate(asSingleValue(value()));
    } else if (local.selectionMode === "multiple") {
      formattedValue = asArrayValue(value())?.map(formatDate).join(", ");
    } else if (local.selectionMode === "range") ;
    return formattedValue ?? "";
  });
  const ariaDescribedBy = () => {
    let description = "";
    if (local.selectionMode === "single" || local.selectionMode === "multiple") {
      description = messageFormatter().format("selectedDateDescription", {
        date: formattedValue()
      });
    } else if (local.selectionMode === "range") ;
    return formControlContext.getAriaDescribedBy(description);
  };
  const commitSingleValue = (date, time) => {
    setValue("timeZone" in time ? time.set(toCalendarDate(date)) : toCalendarDateTime(date, time));
  };

  // Intercept `setValue` to make sure the Time section is not changed by date selection in Calendar.
  const selectDate = newValue => {
    if (local.selectionMode === "single") {
      if (hasTime()) {
        const resolvedSelectedTime = selectedTime();
        if (resolvedSelectedTime || closeOnSelect()) {
          commitSingleValue(newValue, resolvedSelectedTime || getPlaceholderTime(local.placeholderValue));
        } else {
          setSelectedDate(newValue);
        }
      } else {
        setValue(newValue);
      }
      if (closeOnSelect()) {
        disclosureState.close();
      }
    } else if (local.selectionMode === "multiple") {
      setValue(newValue);
    } else if (local.selectionMode === "range") ;
  };
  const selectTime = newValue => {
    if (local.selectionMode === "single") {
      const resolvedSelectedDate = selectedDate();
      if (resolvedSelectedDate && newValue) {
        commitSingleValue(resolvedSelectedDate, newValue);
      } else {
        setSelectedTime(newValue);
      }
    } else if (local.selectionMode === "range") ;
  };
  const close = () => {
    if (local.selectionMode === "single") {
      const resolvedSelectedDate = selectedDate();
      const resolvedSelectedTime = selectedTime();

      // Commit the selected date when the calendar is closed. Use a placeholder time if one wasn't set.
      // If only the time was set and not the date, don't commit.
      // The state will be preserved until the user opens the popover again.
      if (!value() && resolvedSelectedDate && hasTime()) {
        commitSingleValue(resolvedSelectedDate, resolvedSelectedTime || getPlaceholderTime(local.placeholderValue));
      }
    } else if (local.selectionMode === "range") ;
    disclosureState.close();
  };
  const toggle = () => {
    if (disclosureState.isOpen()) {
      close();
    } else {
      disclosureState.open();
    }
  };
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  createEffect(on(value, value => {
    if (!value) {
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      return;
    }
    if (local.selectionMode === "single") {
      setSelectedDate(value);
      if ("hour" in value) {
        setSelectedTime(value);
      }
    } else if (local.selectionMode === "multiple") {
      setSelectedDate(value);
    } else if (local.selectionMode === "range") ;
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isDisabled: () => formControlContext.isDisabled() ?? false,
    isModal: () => local.modal ?? false,
    contentPresence,
    messageFormatter,
    granularity,
    maxGranularity: () => local.maxGranularity,
    hourCycle: () => local.hourCycle,
    hideTimeZone: () => local.hideTimeZone ?? false,
    defaultTimeZone,
    shouldForceLeadingZeros: () => local.shouldForceLeadingZeros ?? false,
    visibleDuration: () => local.visibleDuration,
    selectionMode: () => local.selectionMode,
    allowsNonContiguousRanges: () => local.allowsNonContiguousRanges ?? false,
    placeholderValue: () => local.placeholderValue,
    minValue: () => local.minValue,
    maxValue: () => local.maxValue,
    focusManager: () => focusManager,
    locale,
    direction,
    ariaDescribedBy,
    validationState,
    value,
    dateValue: selectedDate,
    timeValue: selectedTime,
    triggerId,
    contentId,
    controlRef,
    triggerRef,
    contentRef,
    setControlRef,
    setTriggerRef,
    setContentRef,
    createCalendar: name => local.createCalendar(name),
    isDateUnavailable: date => local.isDateUnavailable?.(date) ?? false,
    setDateValue: selectDate,
    setTimeValue: selectTime,
    open: disclosureState.open,
    close,
    toggle,
    generateId: createGenerateId(() => access(formControlProps.id)),
    registerTriggerId: createRegisterId(setTriggerId),
    registerContentId: createRegisterId(setContentId)
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(DatePickerContext.Provider, {
        value: context,
        get children() {
          return createComponent(PopperRoot, mergeProps$1({
            anchorRef: controlRef,
            contentRef: contentRef
          }, popperProps, {
            get children() {
              return createComponent(Polymorphic, mergeProps$1({
                as: "div",
                role: "group",
                get id() {
                  return access(formControlProps.id);
                }
              }, () => formControlContext.dataset(), dataset, others));
            }
          }));
        }
      });
    }
  });
}

// TODO: finish translation
const SPIN_BUTTON_INTL_MESSAGES = {
  "ar-AE": {
    empty: ""
  },
  "bg-BG": {
    empty: ""
  },
  "cs-CZ": {
    empty: ""
  },
  "da-DK": {
    empty: ""
  },
  "de-DE": {
    empty: ""
  },
  "el-GR": {
    empty: ""
  },
  "en-US": {
    empty: "Empty"
  },
  "es-ES": {
    empty: ""
  },
  "et-EE": {
    empty: ""
  },
  "fi-FI": {
    empty: ""
  },
  "fr-FR": {
    empty: "Vide"
  },
  "he-IL": {
    empty: ""
  },
  "hr-HR": {
    empty: ""
  },
  "hu-HU": {
    empty: ""
  },
  "it-IT": {
    empty: ""
  },
  "ja-JP": {
    empty: ""
  },
  "ko-KR": {
    empty: ""
  },
  "lt-LT": {
    empty: ""
  },
  "lv-LV": {
    empty: ""
  },
  "nb-NO": {
    empty: ""
  },
  "nl-NL": {
    empty: ""
  },
  "pl-PL": {
    empty: ""
  },
  "pt-BR": {
    empty: ""
  },
  "pt-PT": {
    empty: ""
  },
  "ro-RO": {
    empty: ""
  },
  "ru-RU": {
    empty: ""
  },
  "sk-SK": {
    empty: ""
  },
  "sl-SI": {
    empty: ""
  },
  "sr-SP": {
    empty: ""
  },
  "sv-SE": {
    empty: ""
  },
  "tr-TR": {
    empty: ""
  },
  "uk-UA": {
    empty: ""
  },
  "zh-CN": {
    empty: ""
  },
  "zh-TW": {
    empty: ""
  }
};

function SpinButtonRoot(props) {
  const [local, others] = splitProps(props, ["ref", "value", "textValue", "minValue", "maxValue", "validationState", "required", "disabled", "readOnly", "onIncrement", "onIncrementPage", "onDecrement", "onDecrementPage", "onDecrementToMin", "onIncrementToMax", "onKeyDown", "onFocus", "onBlur"]);
  let isFocused = false;
  const messageFormatter = createMessageFormatter(SPIN_BUTTON_INTL_MESSAGES);

  // Replace Unicode hyphen-minus (U+002D) with minus sign (U+2212).
  // This ensures that macOS VoiceOver announces it as "minus" even with other characters between the minus sign
  // and the number (e.g. currency symbol). Otherwise, it announces nothing because it assumes the character is a hyphen.
  // In addition, replace the empty string with the word "Empty" so that iOS VoiceOver does not read "50%" for an empty field.
  const textValue = createMemo(() => {
    if (local.textValue === "") {
      return messageFormatter().format("empty");
    }
    return (local.textValue || `${local.value}`).replace("-", "\u2212");
  });
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || local.readOnly) {
      return;
    }
    switch (e.key) {
      case "PageUp":
        if (local.onIncrementPage) {
          e.preventDefault();
          local.onIncrementPage();
          break;
        }
      // fallthrough!
      case "ArrowUp":
      case "Up":
        if (local.onIncrement) {
          e.preventDefault();
          local.onIncrement();
        }
        break;
      case "PageDown":
        if (local.onDecrementPage) {
          e.preventDefault();
          local.onDecrementPage();
          break;
        }
      // fallthrough
      case "ArrowDown":
      case "Down":
        if (local.onDecrement) {
          e.preventDefault();
          local.onDecrement();
        }
        break;
      case "Home":
        if (local.onDecrementToMin) {
          e.preventDefault();
          local.onDecrementToMin();
        }
        break;
      case "End":
        if (local.onIncrementToMax) {
          e.preventDefault();
          local.onIncrementToMax();
        }
        break;
    }
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    isFocused = true;
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    isFocused = false;
  };
  createEffect(on(textValue, textValue => {
    if (isFocused) {
      clearAnnouncer("assertive");
      announce(textValue, "assertive");
    }
  }));
  return createComponent(Polymorphic, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(el => el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    as: "div",
    role: "spinbutton",
    get ["aria-valuenow"]() {
      return local.value != null && !isNaN(local.value) ? local.value : null;
    },
    get ["aria-valuetext"]() {
      return textValue();
    },
    get ["aria-valuemin"]() {
      return local.minValue;
    },
    get ["aria-valuemax"]() {
      return local.maxValue;
    },
    get ["aria-required"]() {
      return local.required || undefined;
    },
    get ["aria-disabled"]() {
      return local.disabled || undefined;
    },
    get ["aria-readonly"]() {
      return local.readOnly || undefined;
    },
    get ["aria-invalid"]() {
      return local.validationState === "invalid" || undefined;
    },
    onKeyDown: onKeyDown,
    onFocus: onFocus,
    onBlur: onBlur
  }, others));
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/99ca82e87ba2d7fdd54f5b49326fd242320b4b51/packages/%40react-aria/datepicker/src/useDisplayNames.ts
 */

class DisplayNamesPolyfill {
  constructor(locale) {
    this.locale = locale;
    this.dictionary = new MessageDictionary(DATE_PICKER_INTL_MESSAGES);
  }
  of(field) {
    return this.dictionary.getStringForLocale(field, this.locale);
  }
}
function createDisplayNames() {
  const locale = useLocale();
  return createMemo(() => {
    // Try to use `Intl.DisplayNames` if possible. It may be supported in browsers, but not support the dateTimeField
    // type as that was only added in v2. https://github.com/tc39/intl-displaynames-v2
    try {
      return new Intl.DisplayNames(locale.locale(), {
        type: "dateTimeField"
      });
    } catch (err) {
      return new DisplayNamesPolyfill(locale.locale());
    }
  });
}

function DatePickerSegment(props) {
  let ref;
  const formControlContext = useFormControlContext();
  const datePickerContext = useDatePickerContext();
  const inputContext = useDatePickerInputContext();
  const [local, others] = splitProps(props, ["ref", "segment", "children", "onKeyDown", "onBeforeInput", "onInput", "onFocus"]);
  const [textValue, setTextValue] = createSignal(local.segment.isPlaceholder ? "" : local.segment.text);
  const resolvedChildren = children(() => local.children);
  let enteredKeys = "";
  let composition = "";
  const displayNames = createDisplayNames();

  // spin buttons cannot be focused with VoiceOver on iOS.
  const touchPropOverrides = createMemo(() => {
    return isIOS() || local.segment.type === "timeZoneName" ? {
      role: "textbox",
      "aria-valuemax": undefined,
      "aria-valuemin": undefined,
      "aria-valuetext": undefined,
      "aria-valuenow": undefined
    } : {};
  });
  const firstSegment = createMemo(() => inputContext.segments().find(s => s.isEditable));

  // Prepend the label passed from the field to each segment name.
  // This is needed because VoiceOver on iOS does not announce groups.
  const name = createMemo(() => {
    return local.segment.type === "literal" ? "" : displayNames().of(local.segment.type);
  });
  const ariaLabel = createMemo(() => {
    return `${name()}${inputContext.ariaLabel() ? `, ${inputContext.ariaLabel()}` : ""}${inputContext.ariaLabelledBy() ? ", " : ""}`;
  });
  const ariaDescribedBy = createMemo(() => {
    // Only apply aria-describedby to the first segment, unless the field is invalid. This avoids it being
    // read every time the user navigates to a new segment.
    if (local.segment !== firstSegment() && formControlContext.validationState() !== "invalid") {
      return undefined;
    }
    return inputContext.ariaDescribedBy();
  });
  const isEditable = createMemo(() => {
    return !formControlContext.isDisabled() && !formControlContext.isReadOnly() && local.segment.isEditable;
  });
  const inputMode = createMemo(() => {
    return formControlContext.isDisabled() || local.segment.type === "dayPeriod" || local.segment.type === "era" || !isEditable() ? undefined : "numeric";
  });

  // Safari dayPeriod option doesn't work...
  const filter = createFilter({
    sensitivity: "base"
  });
  const options = createMemo(() => inputContext.dateFormatterResolvedOptions());

  // Get a list of formatted era names so users can type the first character to choose one.
  const eraFormatter = createDateFormatter({
    year: "numeric",
    era: "narrow",
    timeZone: "UTC"
  });
  const monthDateFormatter = createDateFormatter(() => ({
    month: "long",
    timeZone: options().timeZone
  }));
  const hourDateFormatter = createDateFormatter(() => ({
    hour: "numeric",
    hour12: options().hour12,
    timeZone: options().timeZone
  }));
  const amPmFormatter = createDateFormatter({
    hour: "numeric",
    hour12: true
  });
  const eras = createMemo(() => {
    if (local.segment.type !== "era") {
      return [];
    }
    const date = toCalendar(new CalendarDate(1, 1, 1), inputContext.calendar());
    const eras = inputContext.calendar().getEras().map(era => {
      const eraDate = date.set({
        year: 1,
        month: 1,
        day: 1,
        era
      }).toDate("UTC");
      const parts = eraFormatter().formatToParts(eraDate);
      const formatted = parts.find(p => p.type === "era")?.value ?? "";
      return {
        era,
        formatted
      };
    });

    // Remove the common prefix from formatted values. This is so that in calendars with eras like
    // ERA0 and ERA1 (e.g. Ethiopic), users can press "0" and "1" to select an era. In other cases,
    // the first letter is used.
    const prefixLength = commonPrefixLength(eras.map(era => era.formatted));
    if (prefixLength) {
      for (const era of eras) {
        era.formatted = era.formatted.slice(prefixLength);
      }
    }
    return eras;
  });
  const am = createMemo(() => {
    const date = new Date();
    date.setHours(0);
    return amPmFormatter().formatToParts(date).find(part => part.type === "dayPeriod")?.value ?? "";
  });
  const pm = createMemo(() => {
    const date = new Date();
    date.setHours(12);
    return amPmFormatter().formatToParts(date).find(part => part.type === "dayPeriod")?.value ?? "";
  });
  const numberParser = createMemo(() => {
    return new NumberParser(datePickerContext.locale(), {
      maximumFractionDigits: 0
    });
  });
  const onBackspaceKeyDown = () => {
    if (numberParser().isValidPartialNumber(local.segment.text) && !formControlContext.isReadOnly() && !local.segment.isPlaceholder) {
      const newValue = local.segment.text.slice(0, -1);
      const parsed = numberParser().parse(newValue);
      if (newValue.length === 0 || parsed === 0) {
        inputContext.clearSegment(local.segment.type);
      } else {
        inputContext.setSegment(local.segment.type, parsed);
      }
      enteredKeys = newValue;
    } else if (local.segment.type === "dayPeriod") {
      inputContext.clearSegment(local.segment.type);
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);

    // Firefox does not fire selectstart for Ctrl/Cmd + A
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1742153
    if (e.key === "a" && (isMac() ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
    }
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    switch (e.key) {
      case "Backspace":
      case "Delete":
        {
          // Safari on iOS does not fire beforeinput for the backspace key because the cursor is at the start.
          e.preventDefault();
          e.stopPropagation();
          onBackspaceKeyDown();
          break;
        }
    }
  };
  const onInputBase = key => {
    if (formControlContext.isDisabled() || formControlContext.isReadOnly()) {
      return;
    }
    const newValue = enteredKeys + key;
    switch (local.segment.type) {
      case "dayPeriod":
        if (filter.startsWith(am(), key)) {
          inputContext.setSegment("dayPeriod", 0);
        } else if (filter.startsWith(pm(), key)) {
          inputContext.setSegment("dayPeriod", 12);
        } else {
          break;
        }
        datePickerContext.focusManager().focusNext();
        break;
      case "era":
        {
          const matched = eras().find(e => filter.startsWith(e.formatted, key));
          if (matched) {
            inputContext.setSegment("era", +matched.era);
            datePickerContext.focusManager().focusNext();
          }
          break;
        }
      case "day":
      case "hour":
      case "minute":
      case "second":
      case "month":
      case "year":
        {
          if (!numberParser().isValidPartialNumber(newValue)) {
            return;
          }
          let numberValue = numberParser().parse(newValue);
          let segmentValue = numberValue;
          let allowsZero = local.segment.minValue === 0;
          if (local.segment.type === "hour" && inputContext.dateFormatterResolvedOptions().hour12) {
            switch (inputContext.dateFormatterResolvedOptions().hourCycle) {
              case "h11":
                if (numberValue > 11) {
                  segmentValue = numberParser().parse(key);
                }
                break;
              case "h12":
                allowsZero = false;
                if (numberValue > 12) {
                  segmentValue = numberParser().parse(key);
                }
                break;
            }
            if (local.segment.value != null && local.segment.value >= 12 && numberValue > 1) {
              numberValue += 12;
            }
          } else if (local.segment.maxValue != null && numberValue > local.segment.maxValue) {
            segmentValue = numberParser().parse(key);
          }
          if (isNaN(numberValue)) {
            return;
          }
          const shouldSetValue = segmentValue !== 0 || allowsZero;
          if (shouldSetValue) {
            inputContext.setSegment(local.segment.type, segmentValue);
          }
          if (local.segment.maxValue != null && Number(numberValue + "0") > local.segment.maxValue || newValue.length >= String(local.segment.maxValue).length) {
            enteredKeys = "";
            if (shouldSetValue) {
              datePickerContext.focusManager().focusNext();
            }
          } else {
            enteredKeys = newValue;
          }
          break;
        }
    }
  };
  const onBeforeInput = e => {
    callHandler(e, local.onBeforeInput);
    e.preventDefault();
    switch (e.inputType) {
      case "deleteContentBackward":
      case "deleteContentForward":
        if (numberParser().isValidPartialNumber(local.segment.text) && !formControlContext.isReadOnly()) {
          onBackspaceKeyDown();
        }
        break;
      case "insertCompositionText":
        if (ref) {
          // insertCompositionText cannot be canceled.
          // Record the current state of the element, so we can restore it in the `input` event below.
          composition = ref.textContent;

          // Safari gets stuck in a composition state unless we also assign to the value here.
          // eslint-disable-next-line no-self-assign
          ref.textContent = ref.textContent;
        }
        break;
      default:
        if (e.data != null) {
          onInputBase(e.data);
        }
        break;
    }
  };
  const onInput = e => {
    callHandler(e, local.onInput);
    const {
      inputType,
      data
    } = e;
    if (ref && data != null) {
      switch (inputType) {
        case "insertCompositionText":
          // Reset the DOM to how it was in the beforeinput event.
          ref.textContent = composition;

          // Android sometimes fires key presses of letters as composition events. Need to handle am/pm keys here too.
          // Can also happen e.g. with Pinyin keyboard on iOS.
          if (filter.startsWith(am(), data) || filter.startsWith(pm(), data)) {
            onInputBase(data);
          }
          break;
      }
    }
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    if (ref) {
      enteredKeys = "";
      scrollIntoViewport(ref, {
        containingElement: getScrollParent(ref)
      });

      // Collapse selection to start or Chrome won't fire input events.
      const selection = getWindow(ref).getSelection();
      selection?.collapse(ref);
    }
  };
  const onIncrement = () => {
    enteredKeys = "";
    inputContext.increment(local.segment.type);
  };
  const onDecrement = () => {
    enteredKeys = "";
    inputContext.decrement(local.segment.type);
  };
  const onIncrementPage = () => {
    enteredKeys = "";
    inputContext.incrementPage(local.segment.type);
  };
  const onDecrementPage = () => {
    enteredKeys = "";
    inputContext.decrementPage(local.segment.type);
  };
  const onDecrementToMin = () => {
    if (local.segment.minValue == null) {
      return;
    }
    enteredKeys = "";
    inputContext.setSegment(local.segment.type, local.segment.minValue);
  };
  const onIncrementToMax = () => {
    if (local.segment.maxValue == null) {
      return;
    }
    enteredKeys = "";
    inputContext.setSegment(local.segment.type, local.segment.maxValue);
  };
  createEffect(() => {
    const resolvedDateValue = inputContext.dateValue();
    if (resolvedDateValue) {
      if (local.segment.type === "month" && !local.segment.isPlaceholder) {
        const monthTextValue = monthDateFormatter().format(resolvedDateValue);
        setTextValue(prev => monthTextValue !== prev ? `${prev} – ${monthTextValue}` : monthTextValue);
      } else if (local.segment.type === "hour" && !local.segment.isPlaceholder) {
        setTextValue(hourDateFormatter().format(resolvedDateValue));
      }
    } else {
      setTextValue(local.segment.isPlaceholder ? "" : local.segment.text);
    }
  });
  createEffect(on([() => ref, () => datePickerContext.focusManager()], ([ref, focusManager]) => {
    const element = ref;
    onCleanup(() => {
      // If the focused segment is removed, focus the previous one, or the next one if there was no previous one.
      if (getActiveElement(element) === element) {
        const prev = focusManager.focusPrevious();
        if (!prev) {
          focusManager.focusNext();
        }
      }
    });
  }));
  return createComponent(Show, {
    get when() {
      return local.segment.type !== "literal";
    },
    get fallback() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        "aria-hidden": true,
        "data-separator": ""
      }, others, {
        get children() {
          return local.segment.text;
        }
      }));
    },
    get children() {
      return createComponent(SpinButtonRoot, mergeProps$1({
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        get tabIndex() {
          return formControlContext.isDisabled() ? undefined : 0;
        },
        get value() {
          return local.segment.value;
        },
        get textValue() {
          return textValue();
        },
        get minValue() {
          return local.segment.minValue;
        },
        get maxValue() {
          return local.segment.maxValue;
        },
        get validationState() {
          return formControlContext.validationState();
        },
        get required() {
          return formControlContext.isRequired();
        },
        get disabled() {
          return formControlContext.isDisabled();
        },
        get readOnly() {
          return formControlContext.isReadOnly() || !local.segment.isEditable;
        },
        get contentEditable() {
          return isEditable();
        },
        get inputMode() {
          return inputMode();
        },
        get autocorrect() {
          return isEditable() ? "off" : undefined;
        },
        get autoCapitalize() {
          return isEditable() ? "off" : undefined;
        },
        get spellcheck() {
          return isEditable() ? false : undefined;
        },
        get enterkeyhint() {
          return isEditable() ? "next" : undefined;
        },
        style: {
          "caret-color": "transparent"
        },
        get ["aria-label"]() {
          return ariaLabel();
        },
        get ["aria-labelledby"]() {
          return inputContext.ariaLabelledBy();
        },
        get ["aria-describedby"]() {
          return ariaDescribedBy();
        },
        get ["data-placeholder"]() {
          return local.segment.isPlaceholder ? "" : undefined;
        },
        onKeyDown: onKeyDown,
        onBeforeInput: onBeforeInput,
        onInput: onInput,
        onFocus: onFocus,
        onIncrement: onIncrement,
        onDecrement: onDecrement,
        onIncrementPage: onIncrementPage,
        onDecrementPage: onDecrementPage,
        onDecrementToMin: onDecrementToMin,
        onIncrementToMax: onIncrementToMax
      }, () => datePickerContext.dataset(), () => formControlContext.dataset(), others, touchPropOverrides, {
        get children() {
          return createComponent(Show, {
            get when() {
              return resolvedChildren();
            },
            get fallback() {
              return local.segment.text;
            },
            get children() {
              return resolvedChildren();
            }
          });
        }
      }));
    }
  });
}
function commonPrefixLength(strings) {
  // Sort the strings, and compare the characters in the first and last to find the common prefix.
  strings.sort();
  const first = strings[0];
  const last = strings[strings.length - 1];
  for (let i = 0; i < first.length; i++) {
    if (first[i] !== last[i]) {
      return i;
    }
  }
  return 0;
}

function DatePickerTrigger(props) {
  const formControlContext = useFormControlContext();
  const context = useDatePickerContext();
  props = mergeDefaultProps({
    id: context.generateId("trigger")
  }, props);
  const [local, others] = splitProps(props, ["ref", "disabled", "onPointerDown", "onClick", "aria-labelledby"]);
  const isDisabled = () => {
    return local.disabled || context.isDisabled() || formControlContext.isDisabled() || formControlContext.isReadOnly();
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // Prevent pointer events from reaching `DatePicker.Control`.
    e.stopPropagation();
  };
  const onClick = e => {
    callHandler(e, local.onClick);

    // Prevent click events from reaching `DatePicker.Control`.
    e.stopPropagation();
    if (!isDisabled()) {
      context.toggle();
    }
  };
  const ariaLabel = createMemo(() => {
    return context.messageFormatter().format("calendar");
  });
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(others.id, ariaLabel(), local["aria-labelledby"]);
  };
  createEffect(() => onCleanup(context.registerTriggerId(others.id)));
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get disabled() {
      return isDisabled();
    },
    "aria-haspopup": "dialog",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    get ["aria-label"]() {
      return ariaLabel();
    },
    get ["aria-labelledby"]() {
      return ariaLabelledBy();
    },
    get ["aria-describedby"]() {
      return context.ariaDescribedBy();
    },
    onPointerDown: onPointerDown,
    onClick: onClick
  }, () => context.dataset(), others));
}

/*

<DatePicker.Root>
  <DatePicker.Label/>
  <DatePicker.Control>
    <DatePicker.Input> // DateField
      {segment => <DatePicker.Segment segment={segment} />}
    </DatePicker.Input>
    <DatePicker.Trigger/>
  </DatePicker.Control>
  <DatePicker.Description/>
  <DatePicker.ErrorMessage/>
  <DatePicker.Portal>
    <DatePicker.Content>
      <DatePicker.Arrow/>
      <DatePicker.Calendar>
        <DatePicker.CalendarHeader>
          <DatePicker.CalendarPrevTrigger/>
          <DatePicker.CalendarViewTrigger/>
          <DatePicker.CalendarNextTrigger/>
        </DatePicker.CalendarHeader>
        <DatePicker.CalendarBody>
          <DatePicker.CalendarGrid>
            <DatePicker.CalendarGridHeader>
              <DatePicker.CalendarGridHeaderRow>
                {weekDay => (
                  <DatePicker.CalendarGridHeaderCell>
                    {weekDay()}
                  </DatePicker.CalendarGridHeaderCell>
                )}
              </DatePicker.CalendarGridHeaderRow>
            </DatePicker.CalendarGridHeader>
            <DatePicker.CalendarGridBody>
              {weekIndex => (
                <DatePicker.CalendarGridBodyRow weekIndex={weekIndex()}>
                  {date => (
                    <DatePicker.CalendarGridBodyCell date={date()}>
                      <DatePicker.CalendarGridBodyCellTrigger/>
                    </DatePicker.CalendarGridBodyCell>
                  )}
                </DatePicker.CalendarGridBodyRow>
              )}
            </DatePicker.CalendarGridBody>
          </DatePicker.CalendarGrid>
        </DatePicker.CalendarBody>
      </DatePicker.Calendar>
    </DatePicker.Content>
  </DatePicker.Portal>
</DatePicker.Root>

*/

var index$g = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  Calendar: DatePickerCalendar,
  CalendarBody: CalendarBody,
  CalendarGrid: CalendarGrid,
  CalendarGridBody: CalendarGridBody,
  CalendarGridBodyCell: CalendarGridBodyCell,
  CalendarGridBodyCellTrigger: CalendarGridBodyCellTrigger,
  CalendarGridBodyRow: CalendarGridBodyRow,
  CalendarGridHeader: CalendarGridHeader,
  CalendarGridHeaderCell: CalendarGridHeaderCell,
  CalendarGridHeaderRow: CalendarGridHeaderRow,
  CalendarHeader: CalendarHeader,
  CalendarHeading: CalendarHeading,
  CalendarNextTrigger: CalendarNextTrigger,
  CalendarPrevTrigger: CalendarPrevTrigger,
  Content: DatePickerContent,
  Control: DatePickerControl,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  Input: DatePickerInput,
  Portal: DatePickerPortal,
  Root: DatePickerRoot,
  Segment: DatePickerSegment,
  Trigger: DatePickerTrigger
});

/**
 * Contains the content to be rendered when the dropdown menu is open.
 */
function DropdownMenuContent(props) {
  const rootContext = useMenuRootContext();
  const context = useMenuContext();
  const [local, others] = splitProps(props, ["onCloseAutoFocus", "onInteractOutside"]);
  let hasInteractedOutside = false;
  const onCloseAutoFocus = e => {
    local.onCloseAutoFocus?.(e);
    if (!hasInteractedOutside) {
      focusWithoutScrolling(context.triggerRef());
    }
    hasInteractedOutside = false;

    // Always prevent autofocus because we either focus manually or want user agent focus
    e.preventDefault();
  };
  const onInteractOutside = e => {
    local.onInteractOutside?.(e);
    if (!rootContext.isModal() || e.detail.isContextMenu) {
      hasInteractedOutside = true;
    }
  };
  return createComponent(MenuContent, mergeProps$1({
    onCloseAutoFocus: onCloseAutoFocus,
    onInteractOutside: onInteractOutside
  }, others));
}

/**
 * Displays a menu to the user —such as a set of actions or functions— triggered by a button.
 */
function DropdownMenuRoot(props) {
  const defaultId = `dropdownmenu-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  return createComponent(MenuRoot, props);
}

var index$f = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  CheckboxItem: MenuCheckboxItem,
  Content: DropdownMenuContent,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Icon: MenuIcon,
  Item: MenuItem,
  ItemDescription: MenuItemDescription,
  ItemIndicator: MenuItemIndicator,
  ItemLabel: MenuItemLabel,
  Portal: MenuPortal,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Root: DropdownMenuRoot,
  Separator: SeparatorRoot,
  Sub: MenuSub,
  SubContent: MenuSubContent,
  SubTrigger: MenuSubTrigger,
  Trigger: MenuTrigger
});

const HoverCardContext = createContext();
function useHoverCardContext() {
  const context = useContext(HoverCardContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useHoverCardContext` must be used within a `HoverCard` component");
  }
  return context;
}

/**
 * Contains the content to be rendered when the hovercard is open.
 */
function HoverCardContent(props) {
  const context = useHoverCardContext();
  const [local, others] = splitProps(props, ["ref", "style"]);
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            disableOutsidePointerEvents: false,
            get style() {
              return {
                "--kb-hovercard-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            onFocusOutside: e => e.preventDefault(),
            get onDismiss() {
              return context.close;
            }
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

/**
 * Portals its children into the `body` when the hovercard is open.
 */
function HoverCardPortal(props) {
  const context = useHoverCardContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/84e97943ad637a582c01c9b56d880cd95f595737/packages/ariakit/src/hovercard/__utils/polygon.ts
 * https://github.com/ariakit/ariakit/blob/f2a96973de523d67e41eec983263936c489ef3e2/packages/ariakit/src/hovercard/__utils/debug-polygon.ts
 */

/**
 * Construct a polygon based on the floating element placement relative to the anchor.
 */
function getHoverCardSafeArea(placement, anchorEl, floatingEl) {
  const basePlacement = placement.split("-")[0];
  const anchorRect = anchorEl.getBoundingClientRect();
  const floatingRect = floatingEl.getBoundingClientRect();
  const polygon = [];
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const anchorCenterY = anchorRect.top + anchorRect.height / 2;
  switch (basePlacement) {
    case "top":
      polygon.push([anchorRect.left, anchorCenterY]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([anchorRect.right, anchorCenterY]);
      break;
    case "right":
      polygon.push([anchorCenterX, anchorRect.top]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([anchorCenterX, anchorRect.bottom]);
      break;
    case "bottom":
      polygon.push([anchorRect.left, anchorCenterY]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([anchorRect.right, anchorCenterY]);
      break;
    case "left":
      polygon.push([anchorCenterX, anchorRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([anchorCenterX, anchorRect.bottom]);
      break;
  }
  return polygon;
}

/**
 * A popover that allows sighted users to preview content available behind a link.
 */
function HoverCardRoot(props) {
  const defaultId = `hovercard-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    openDelay: 700,
    closeDelay: 300
  }, props);
  const [local, others] = splitProps(props, ["id", "open", "defaultOpen", "onOpenChange", "openDelay", "closeDelay", "ignoreSafeArea", "forceMount"]);
  let openTimeoutId;
  let closeTimeoutId;
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [currentPlacement, setCurrentPlacement] = createSignal(others.placement);
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const {
    addGlobalListener,
    removeGlobalListener
  } = createGlobalListeners();
  const openWithDelay = () => {
    if (isServer) {
      return;
    }
    openTimeoutId = window.setTimeout(() => {
      openTimeoutId = undefined;
      disclosureState.open();
    }, local.openDelay);
  };
  const closeWithDelay = () => {
    if (isServer) {
      return;
    }
    closeTimeoutId = window.setTimeout(() => {
      closeTimeoutId = undefined;
      disclosureState.close();
    }, local.closeDelay);
  };
  const cancelOpening = () => {
    if (isServer) {
      return;
    }
    window.clearTimeout(openTimeoutId);
    openTimeoutId = undefined;
  };
  const cancelClosing = () => {
    if (isServer) {
      return;
    }
    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = undefined;
  };
  const isTargetOnHoverCard = target => {
    return contains(triggerRef(), target) || contains(contentRef(), target);
  };
  const getPolygonSafeArea = placement => {
    const triggerEl = triggerRef();
    const contentEl = contentRef();
    if (!triggerEl || !contentEl) {
      return;
    }
    return getHoverCardSafeArea(placement, triggerEl, contentEl);
  };
  const onHoverOutside = event => {
    const target = event.target;

    // Don't close if the mouse is moving through valid hovercard element.
    if (isTargetOnHoverCard(target)) {
      cancelClosing();
      return;
    }
    if (!local.ignoreSafeArea) {
      const polygon = getPolygonSafeArea(currentPlacement());

      //Don't close if the current's event mouse position is inside the polygon safe area.
      if (polygon && isPointInPolygon(getEventPoint(event), polygon)) {
        cancelClosing();
        return;
      }
    }

    // If there's already a scheduled timeout to hide the hovercard, we do nothing.
    if (closeTimeoutId) {
      return;
    }

    // Otherwise, hide the hovercard after the close delay.
    closeWithDelay();
  };
  createEffect(() => {
    if (!disclosureState.isOpen()) {
      return;
    }

    // Checks whether the mouse is moving outside the hovercard.
    // If yes, hide the card after the close delay.
    addGlobalListener(document, "pointermove", onHoverOutside, true);
    onCleanup(() => {
      removeGlobalListener(document, "pointermove", onHoverOutside, true);
    });
  });

  // cleanup all timeout on unmount.
  onCleanup(() => {
    cancelOpening();
    cancelClosing();
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    contentPresence,
    openWithDelay,
    closeWithDelay,
    cancelOpening,
    cancelClosing,
    close: disclosureState.close,
    isTargetOnHoverCard,
    setTriggerRef,
    setContentRef
  };
  return createComponent(HoverCardContext.Provider, {
    value: context,
    get children() {
      return createComponent(PopperRoot, mergeProps$1({
        anchorRef: triggerRef,
        contentRef: contentRef,
        onCurrentPlacementChange: setCurrentPlacement
      }, others));
    }
  });
}

/**
 * The link that opens the hovercard when hovered.
 */
function HoverCardTrigger(props) {
  const context = useHoverCardContext();
  const [local, others] = splitProps(props, ["ref", "onPointerEnter", "onPointerLeave", "onFocus", "onBlur", "onTouchStart"]);
  const onPointerEnter = e => {
    callHandler(e, local.onPointerEnter);
    if (e.pointerType === "touch" || others.disabled || e.defaultPrevented) {
      return;
    }
    context.cancelClosing();
    if (!context.isOpen()) {
      context.openWithDelay();
    }
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);
    if (e.pointerType === "touch") {
      return;
    }
    context.cancelOpening();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    if (others.disabled || e.defaultPrevented) {
      return;
    }
    context.cancelClosing();
    if (!context.isOpen()) {
      context.openWithDelay();
    }
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    context.cancelOpening();
    const relatedTarget = e.relatedTarget;
    if (context.isTargetOnHoverCard(relatedTarget)) {
      return;
    }
    context.closeWithDelay();
  };
  onCleanup(context.cancelOpening);
  return createComponent(LinkRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    onPointerEnter: onPointerEnter,
    onPointerLeave: onPointerLeave,
    onFocus: onFocus,
    onBlur: onBlur
  }, () => context.dataset(), others));
}

var index$e = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  Content: HoverCardContent,
  Portal: HoverCardPortal,
  Root: HoverCardRoot,
  Trigger: HoverCardTrigger
});

const ImageContext = createContext();
function useImageContext() {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useImageContext` must be used within an `Image.Root` component");
  }
  return context;
}

/**
 * An element that renders when the image hasn't loaded.
 * This means whilst it's loading, or if there was an error.
 */
function ImageFallback(props) {
  const context = useImageContext();
  const [canRender, setCanRender] = createSignal(context.fallbackDelay() === undefined);
  createEffect(() => {
    const delayMs = context.fallbackDelay();
    if (delayMs !== undefined) {
      const timerId = window.setTimeout(() => setCanRender(true), delayMs);
      onCleanup(() => window.clearTimeout(timerId));
    }
  });
  return createComponent(Show, {
    get when() {
      return memo(() => !!canRender())() && context.imageLoadingStatus() !== "loaded";
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "span"
      }, props));
    }
  });
}

const _tmpl$$d = /*#__PURE__*/template(`<img>`);
/**
 * The image to render. By default, it will only render when it has loaded.
 */
function ImageImg(props) {
  const context = useImageContext();
  const [loadingStatus, setLoadingStatus] = createSignal("idle");
  createEffect(on(() => props.src, src => {
    if (!src) {
      setLoadingStatus("error");
      return;
    }
    let isMounted = true;
    const image = new window.Image();
    const updateStatus = status => () => {
      if (!isMounted) {
        return;
      }
      setLoadingStatus(status);
    };
    setLoadingStatus("loading");
    image.onload = updateStatus("loaded");
    image.onerror = updateStatus("error");
    image.src = src;
    onCleanup(() => {
      isMounted = false;
    });
  }));
  createEffect(() => {
    const imageLoadingStatus = loadingStatus();
    if (imageLoadingStatus !== "idle") {
      context.onImageLoadingStatusChange(imageLoadingStatus);
    }
  });
  return createComponent(Show, {
    get when() {
      return loadingStatus() === "loaded";
    },
    get children() {
      const _el$ = _tmpl$$d();
      spread(_el$, props, false, false);
      return _el$;
    }
  });
}

/**
 * An image element with an optional fallback for loading and error status.
 */
function ImageRoot(props) {
  const [local, others] = splitProps(props, ["fallbackDelay", "onLoadingStatusChange"]);
  const [imageLoadingStatus, setImageLoadingStatus] = createSignal("idle");
  const context = {
    fallbackDelay: () => local.fallbackDelay,
    imageLoadingStatus,
    onImageLoadingStatusChange: status => {
      setImageLoadingStatus(status);
      local.onLoadingStatusChange?.(status);
    }
  };
  return createComponent(ImageContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "span"
      }, others));
    }
  });
}

var index$d = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Fallback: ImageFallback,
  Img: ImageImg,
  Root: ImageRoot
});

const _tmpl$$c = /*#__PURE__*/template(`<li>`);
function PaginationEllipsis(props) {
  return (() => {
    const _el$ = _tmpl$$c();
    insert(_el$, createComponent(Polymorphic, mergeProps$1({
      as: "div"
    }, props)));
    return _el$;
  })();
}

const PaginationContext = createContext();
function usePaginationContext() {
  const context = useContext(PaginationContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `usePaginationContext` must be used within a `Pagination` component");
  }
  return context;
}

const _tmpl$$b = /*#__PURE__*/template(`<li>`);
function PaginationItem(props) {
  const context = usePaginationContext();
  const [local, others] = splitProps(props, ["page", "onClick"]);
  const isCurrent = () => {
    return context.page() === local.page;
  };
  const onClick = () => {
    context.setPage(local.page);
  };
  return (() => {
    const _el$ = _tmpl$$b();
    insert(_el$, createComponent(Polymorphic, mergeProps$1({
      as: "button",
      get ["aria-current"]() {
        return isCurrent() ? "page" : undefined;
      },
      get ["data-current"]() {
        return isCurrent() ? "" : undefined;
      },
      get onClick() {
        return composeEventHandlers([local.onClick, onClick]);
      }
    }, others)));
    return _el$;
  })();
}

function PaginationItems(props) {
  const context = usePaginationContext();
  const [showFirst, setShowFirst] = createSignal(false);
  const [showLast, setShowLast] = createSignal(false);
  const [showFirstEllipsis, setShowFirstEllipsis] = createSignal(false);
  const [showLastEllipsis, setShowLastEllipsis] = createSignal(false);
  const [previousSiblingCount, setPreviousSiblingCount] = createSignal(0);
  const [nextSiblingCount, setNextSiblingCount] = createSignal(0);
  createEffect(() => {
    batch(() => {
      setShowFirst(context.showFirst() && context.page() - 1 > context.siblingCount());
      setShowLast(context.showLast() && context.count() - context.page() > context.siblingCount());
      setShowFirstEllipsis(context.page() - (context.showFirst() ? 2 : 1) > context.siblingCount());
      setShowLastEllipsis(context.count() - context.page() - (context.showLast() ? 1 : 0) > context.siblingCount());
      setPreviousSiblingCount(Math.min(context.page() - 1, context.siblingCount()));
      setNextSiblingCount(Math.min(context.count() - context.page(), context.siblingCount()));
      if (context.fixedItems() !== false) {
        // Untrack to avoid recursion
        untrack(() => {
          // Add back the difference between the opposite side and the sibling count
          setPreviousSiblingCount(prev => prev + Math.max(context.siblingCount() - nextSiblingCount(), 0));
          setNextSiblingCount(prev => prev + Math.max(context.siblingCount() - previousSiblingCount(), 0));
        });
        if (!showFirst()) setNextSiblingCount(prev => prev + 1);
        if (!showLast()) setPreviousSiblingCount(prev => prev + 1);

        // Check specifically if true and not "no-ellipsis"
        if (context.fixedItems() === true) {
          if (!showFirstEllipsis()) setNextSiblingCount(prev => prev + 1);
          if (!showLastEllipsis()) setPreviousSiblingCount(prev => prev + 1);
        }
      }
    });
  });
  return [createComponent(Show, {
    get when() {
      return showFirst();
    },
    get children() {
      return context.renderItem(1);
    }
  }), createComponent(Show, {
    get when() {
      return showFirstEllipsis();
    },
    get children() {
      return context.renderEllipsis();
    }
  }), createComponent(For, {
    get each() {
      return [...Array(previousSiblingCount()).keys()].reverse();
    },
    children: offset => memo(() => context.renderItem(context.page() - (offset + 1)))
  }), memo(() => context.renderItem(context.page())), createComponent(For, {
    get each() {
      return [...Array(nextSiblingCount()).keys()];
    },
    children: offset => memo(() => context.renderItem(context.page() + (offset + 1)))
  }), createComponent(Show, {
    get when() {
      return showLastEllipsis();
    },
    get children() {
      return context.renderEllipsis();
    }
  }), createComponent(Show, {
    get when() {
      return showLast();
    },
    get children() {
      return context.renderItem(context.count());
    }
  })];
}

const _tmpl$$a = /*#__PURE__*/template(`<li>`);
function PaginationNext(props) {
  const context = usePaginationContext();
  const [local, others] = splitProps(props, ["onClick"]);
  const onClick = () => {
    context.setPage(context.page() + 1);
  };
  const isDisabled = () => context.page() === context.count();
  return (() => {
    const _el$ = _tmpl$$a();
    insert(_el$, createComponent(Polymorphic, mergeProps$1({
      as: "button",
      get tabIndex() {
        return isDisabled() || context.page() === context.count() ? "-1" : undefined;
      },
      get disabled() {
        return isDisabled();
      },
      get ["aria-disabled"]() {
        return isDisabled() || undefined;
      },
      get ["data-disabled"]() {
        return isDisabled() ? "" : undefined;
      },
      get onClick() {
        return composeEventHandlers([local.onClick, onClick]);
      }
    }, others)));
    return _el$;
  })();
}

const _tmpl$$9 = /*#__PURE__*/template(`<li>`);
function PaginationPrevious(props) {
  const context = usePaginationContext();
  props = mergeDefaultProps({
    type: "button"
  }, props);
  const [local, others] = splitProps(props, ["onClick"]);
  const onClick = () => {
    context.setPage(context.page() - 1);
  };
  const isDisabled = () => context.page() === 1;
  return (() => {
    const _el$ = _tmpl$$9();
    insert(_el$, createComponent(Polymorphic, mergeProps$1({
      as: "button",
      get tabIndex() {
        return isDisabled() || context.page() === 1 ? "-1" : undefined;
      },
      get disabled() {
        return isDisabled();
      },
      get ["aria-disabled"]() {
        return isDisabled() || undefined;
      },
      get ["data-disabled"]() {
        return isDisabled() ? "" : undefined;
      },
      get onClick() {
        return composeEventHandlers([local.onClick, onClick]);
      }
    }, others)));
    return _el$;
  })();
}

const _tmpl$$8 = /*#__PURE__*/template(`<ul>`);
/**
 * A list of page number that allows users to change the current page.
 */
function PaginationRoot(props) {
  const defaultId = `pagination-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["page", "defaultPage", "onPageChange", "count", "siblingCount", "showFirst", "showLast", "fixedItems", "itemComponent", "ellipsisComponent", "disabled", "children"]);
  const state = createControllableSignal({
    defaultValue: () => local.defaultPage ?? 1,
    onChange: local.onPageChange,
    value: () => local.page
  });
  const context = {
    count: () => local.count,
    siblingCount: () => local.siblingCount ?? 1,
    showFirst: () => local.showFirst ?? true,
    showLast: () => local.showLast ?? true,
    fixedItems: () => local.fixedItems ?? false,
    isDisabled: () => local.disabled ?? false,
    renderItem: page => local.itemComponent({
      page
    }),
    renderEllipsis: local.ellipsisComponent,
    page: state[0],
    setPage: state[1]
  };
  return createComponent(PaginationContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "nav",
        get ["data-disabled"]() {
          return local.disabled ? "" : undefined;
        }
      }, others, {
        get children() {
          const _el$ = _tmpl$$8();
          insert(_el$, () => local.children);
          return _el$;
        }
      }));
    }
  });
}

var index$c = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Ellipsis: PaginationEllipsis,
  Item: PaginationItem,
  Items: PaginationItems,
  Next: PaginationNext,
  Previous: PaginationPrevious,
  Root: PaginationRoot
});

const PopoverContext = createContext();
function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `usePopoverContext` must be used within a `Popover` component");
  }
  return context;
}

/**
 * An optional element to position the `Popover.Content` against.
 * If this part is not used, the content will position alongside the `Popover.Trigger`.
 */
function PopoverAnchor(props) {
  const context = usePopoverContext();
  const [local, others] = splitProps(props, ["ref"]);
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.setDefaultAnchorRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    }
  }, () => context.dataset(), others));
}

/**
 * The button that closes the popover.
 */
function PopoverCloseButton(props) {
  const context = usePopoverContext();
  const [local, others] = splitProps(props, ["aria-label", "onClick"]);
  const messageFormatter = createMessageFormatter(() => COMMON_INTL_MESSAGES);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.close();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    get ["aria-label"]() {
      return local["aria-label"] || messageFormatter().format("dismiss");
    },
    onClick: onClick
  }, () => context.dataset(), others));
}

/**
 * Contains the content to be rendered when the popover is open.
 */
function PopoverContent(props) {
  let ref;
  const context = usePopoverContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "style", "onOpenAutoFocus", "onCloseAutoFocus", "onPointerDownOutside", "onFocusOutside", "onInteractOutside"]);
  let isRightClickOutside = false;
  let hasInteractedOutside = false;
  let hasPointerDownOutside = false;
  const onCloseAutoFocus = e => {
    local.onCloseAutoFocus?.(e);
    if (context.isModal()) {
      e.preventDefault();
      if (!isRightClickOutside) {
        focusWithoutScrolling(context.triggerRef());
      }
    } else {
      if (!e.defaultPrevented) {
        if (!hasInteractedOutside) {
          focusWithoutScrolling(context.triggerRef());
        }

        // Always prevent autofocus because we either focus manually or want user agent focus
        e.preventDefault();
      }
      hasInteractedOutside = false;
      hasPointerDownOutside = false;
    }
  };
  const onPointerDownOutside = e => {
    local.onPointerDownOutside?.(e);
    if (context.isModal()) {
      isRightClickOutside = e.detail.isContextMenu;
    }
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);

    // When focus is trapped, a `focusout` event may still happen.
    // We make sure we don't trigger our `onDismiss` in such case.
    if (context.isOpen() && context.isModal()) {
      e.preventDefault();
    }
  };
  const onInteractOutside = e => {
    local.onInteractOutside?.(e);
    if (context.isModal()) {
      return;
    }

    // Non-modal behavior below

    if (!e.defaultPrevented) {
      hasInteractedOutside = true;
      if (e.detail.originalEvent.type === "pointerdown") {
        hasPointerDownOutside = true;
      }
    }

    // Prevent dismissing when clicking the trigger.
    // As the trigger is already setup to close, without doing so would
    // cause it to close and immediately open.
    if (contains(context.triggerRef(), e.target)) {
      e.preventDefault();
    }

    // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
    // we will get the pointer down outside event on the trigger, but then a subsequent
    // focus outside event on the container, we ignore any focus outside event when we've
    // already had a pointer down outside event.
    if (e.detail.originalEvent.type === "focusin" && hasPointerDownOutside) {
      e.preventDefault();
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => !(context.isOpen() && context.isModal()),
    targets: () => ref ? [ref] : []
  });
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isOpen() && (context.isModal() || context.preventScroll()))
  });
  createFocusScope({
    trapFocus: () => context.isOpen() && context.isModal(),
    onMountAutoFocus: local.onOpenAutoFocus,
    onUnmountAutoFocus: onCloseAutoFocus
  }, () => ref);
  createEffect(() => onCleanup(context.registerContentId(others.id)));
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
                ref = el;
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "dialog",
            tabIndex: -1,
            get disableOutsidePointerEvents() {
              return memo(() => !!context.isOpen())() && context.isModal();
            },
            get excludedElements() {
              return [context.triggerRef];
            },
            get style() {
              return {
                "--kb-popover-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            get ["aria-labelledby"]() {
              return context.titleId();
            },
            get ["aria-describedby"]() {
              return context.descriptionId();
            },
            onPointerDownOutside: onPointerDownOutside,
            onFocusOutside: onFocusOutside,
            onInteractOutside: onInteractOutside,
            get onDismiss() {
              return context.close;
            }
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

/**
 * An optional accessible description to be announced when the popover is open.
 */
function PopoverDescription(props) {
  const context = usePopoverContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerDescriptionId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "p",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * Portals its children into the `body` when the popover is open.
 */
function PopoverPortal(props) {
  const context = usePopoverContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/**
 * A popover is a dialog positioned relative to an anchor element.
 */
function PopoverRoot(props) {
  const defaultId = `popover-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    modal: false,
    preventScroll: false
  }, props);
  const [local, others] = splitProps(props, ["id", "open", "defaultOpen", "onOpenChange", "modal", "preventScroll", "forceMount", "anchorRef"]);
  const [defaultAnchorRef, setDefaultAnchorRef] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [contentId, setContentId] = createSignal();
  const [titleId, setTitleId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const anchorRef = () => {
    return local.anchorRef?.() ?? defaultAnchorRef() ?? triggerRef();
  };
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isModal: () => local.modal ?? false,
    preventScroll: () => local.preventScroll ?? false,
    contentPresence,
    triggerRef,
    contentId,
    titleId,
    descriptionId,
    setDefaultAnchorRef,
    setTriggerRef,
    setContentRef,
    close: disclosureState.close,
    toggle: disclosureState.toggle,
    generateId: createGenerateId(() => local.id),
    registerContentId: createRegisterId(setContentId),
    registerTitleId: createRegisterId(setTitleId),
    registerDescriptionId: createRegisterId(setDescriptionId)
  };
  return createComponent(PopoverContext.Provider, {
    value: context,
    get children() {
      return createComponent(PopperRoot, mergeProps$1({
        anchorRef: anchorRef,
        contentRef: contentRef
      }, others));
    }
  });
}

/**
 * An accessible title to be announced when the popover is open.
 */
function PopoverTitle(props) {
  const context = usePopoverContext();
  props = mergeDefaultProps({
    id: context.generateId("title")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerTitleId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "h2",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * The button that opens the popover.
 */
function PopoverTrigger(props) {
  const context = usePopoverContext();
  const [local, others] = splitProps(props, ["ref", "onClick", "onPointerDown"]);
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // Prevent popover from opening then closing immediately when inside an overlay in safari.
    e.preventDefault();
  };
  const onClick = e => {
    callHandler(e, local.onClick);
    context.toggle();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    "aria-haspopup": "dialog",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    onPointerDown: onPointerDown,
    onClick: onClick
  }, () => context.dataset(), others));
}

var index$b = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Anchor: PopoverAnchor,
  Arrow: PopperArrow,
  CloseButton: PopoverCloseButton,
  Content: PopoverContent,
  Description: PopoverDescription,
  Portal: PopoverPortal,
  Root: PopoverRoot,
  Title: PopoverTitle,
  Trigger: PopoverTrigger
});

const ProgressContext = createContext();
function useProgressContext() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useProgressContext` must be used within a `Progress.Root` component");
  }
  return context;
}

/**
 * The component that visually represents the progress value.
 * Used to visually show the fill of `Progress.Track`.
 */
function ProgressFill(props) {
  const context = useProgressContext();
  const [local, others] = splitProps(props, ["style"]);
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get style() {
      return {
        "--kb-progress-fill-width": context.progressFillWidth(),
        ...local.style
      };
    }
  }, () => context.dataset(), others));
}

/**
 * An accessible label that gives the user information on the progress.
 */
function ProgressLabel(props) {
  const context = useProgressContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerLabelId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    get id() {
      return local.id;
    }
  }, () => context.dataset(), others));
}

/**
 * Progress show either determinate or indeterminate progress of an operation over time.
 */
function ProgressRoot(props) {
  const defaultId = `progress-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    value: 0,
    minValue: 0,
    maxValue: 100
  }, props);
  const [local, others] = splitProps(props, ["value", "minValue", "maxValue", "indeterminate", "getValueLabel"]);
  const [labelId, setLabelId] = createSignal();
  const defaultFormatter = createNumberFormatter(() => ({
    style: "percent"
  }));
  const value = () => {
    return clamp(local.value, local.minValue, local.maxValue);
  };
  const valuePercent = () => {
    return (value() - local.minValue) / (local.maxValue - local.minValue);
  };
  const valueLabel = () => {
    if (local.indeterminate) {
      return undefined;
    }
    if (local.getValueLabel) {
      return local.getValueLabel({
        value: value(),
        min: local.minValue,
        max: local.maxValue
      });
    }
    return defaultFormatter().format(valuePercent());
  };
  const progressFillWidth = () => {
    return local.indeterminate ? undefined : `${Math.round(valuePercent() * 100)}%`;
  };
  const dataset = createMemo(() => {
    let dataProgress = undefined;
    if (!local.indeterminate) {
      dataProgress = valuePercent() === 1 ? "complete" : "loading";
    }
    return {
      "data-progress": dataProgress,
      "data-indeterminate": local.indeterminate ? "" : undefined
    };
  });
  const context = {
    dataset,
    value,
    valuePercent,
    valueLabel,
    labelId,
    progressFillWidth,
    generateId: createGenerateId(() => others.id),
    registerLabelId: createRegisterId(setLabelId)
  };
  return createComponent(ProgressContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        role: "progressbar",
        get ["aria-valuenow"]() {
          return memo(() => !!local.indeterminate)() ? undefined : value();
        },
        get ["aria-valuemin"]() {
          return local.minValue;
        },
        get ["aria-valuemax"]() {
          return local.maxValue;
        },
        get ["aria-valuetext"]() {
          return valueLabel();
        },
        get ["aria-labelledby"]() {
          return labelId();
        }
      }, dataset, others));
    }
  });
}

/**
 * The component that visually represents the progress track.
 * Act as a container for `Progress.Fill`.
 */
function ProgressTrack(props) {
  const context = useProgressContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, () => context.dataset(), props));
}

/**
 * The accessible label text representing the current value in a human-readable format.
 */
function ProgressValueLabel(props) {
  const context = useProgressContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get children() {
      return context.valueLabel();
    }
  }, () => context.dataset(), props));
}

var index$a = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Fill: ProgressFill,
  Label: ProgressLabel,
  Root: ProgressRoot,
  Track: ProgressTrack,
  ValueLabel: ProgressValueLabel
});

const RadioGroupContext = createContext();
function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useRadioGroupContext` must be used within a `RadioGroup` component");
  }
  return context;
}

const RadioGroupItemContext = createContext();
function useRadioGroupItemContext() {
  const context = useContext(RadioGroupItemContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useRadioGroupItemContext` must be used within a `RadioGroup.Item` component");
  }
  return context;
}

/**
 * The root container for a radio button.
 */
function RadioGroupItem(props) {
  const formControlContext = useFormControlContext();
  const radioGroupContext = useRadioGroupContext();
  const defaultId = `${formControlContext.generateId("item")}-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["value", "disabled", "onPointerDown"]);
  const [inputId, setInputId] = createSignal();
  const [labelId, setLabelId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const [inputRef, setInputRef] = createSignal();
  const [isFocused, setIsFocused] = createSignal(false);
  const isSelected = createMemo(() => {
    return radioGroupContext.isSelectedValue(local.value);
  });
  const isDisabled = createMemo(() => {
    return local.disabled || formControlContext.isDisabled() || false;
  });
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // For consistency with native, prevent the input blurs on pointer down.
    if (isFocused()) {
      e.preventDefault();
    }
  };
  const dataset = createMemo(() => ({
    ...formControlContext.dataset(),
    "data-disabled": isDisabled() ? "" : undefined,
    "data-checked": isSelected() ? "" : undefined
  }));
  const context = {
    value: () => local.value,
    dataset,
    isSelected,
    isDisabled,
    inputId,
    labelId,
    descriptionId,
    inputRef,
    select: () => radioGroupContext.setSelectedValue(local.value),
    generateId: createGenerateId(() => others.id),
    registerInput: createRegisterId(setInputId),
    registerLabel: createRegisterId(setLabelId),
    registerDescription: createRegisterId(setDescriptionId),
    setIsFocused,
    setInputRef
  };
  return createComponent(RadioGroupItemContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        role: "group",
        onPointerDown: onPointerDown
      }, dataset, others));
    }
  });
}

/**
 * The element that visually represents a radio button.
 */
function RadioGroupItemControl(props) {
  const context = useRadioGroupItemContext();
  props = mergeDefaultProps({
    id: context.generateId("control")
  }, props);
  const [local, others] = splitProps(props, ["onClick", "onKeyDown"]);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.select();
    context.inputRef()?.focus();
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (e.key === EventKey.Space) {
      context.select();
      context.inputRef()?.focus();
    }
  };
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    onClick: onClick,
    onKeyDown: onKeyDown
  }, () => context.dataset(), others));
}

/**
 * The description that gives the user more information on the radio button.
 */
function RadioGroupItemDescription(props) {
  const context = useRadioGroupItemContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  createEffect(() => onCleanup(context.registerDescription(props.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, () => context.dataset(), props));
}

/**
 * The visual indicator rendered when the radio item is in a checked state.
 * You can style this element directly, or you can use it as a wrapper to put an icon into, or both.
 */
function RadioGroupItemIndicator(props) {
  const context = useRadioGroupItemContext();
  props = mergeDefaultProps({
    id: context.generateId("indicator")
  }, props);
  const [local, others] = splitProps(props, ["ref", "forceMount"]);
  const presence = createPresence(() => local.forceMount || context.isSelected());
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(presence.setRef, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        }
      }, () => context.dataset(), others));
    }
  });
}

const _tmpl$$7 = /*#__PURE__*/template(`<input type="radio">`);
/**
 * The native html input that is visually hidden in the radio button.
 */
function RadioGroupItemInput(props) {
  const formControlContext = useFormControlContext();
  const radioGroupContext = useRadioGroupContext();
  const radioContext = useRadioGroupItemContext();
  props = mergeDefaultProps({
    id: radioContext.generateId("input")
  }, props);
  const [local, others] = splitProps(props, ["ref", "style", "aria-labelledby", "aria-describedby", "onChange", "onFocus", "onBlur"]);
  const ariaLabelledBy = () => {
    return [local["aria-labelledby"], radioContext.labelId(),
    // If there is both an aria-label and aria-labelledby, add the input itself has an aria-labelledby
    local["aria-labelledby"] != null && others["aria-label"] != null ? others.id : undefined].filter(Boolean).join(" ") || undefined;
  };
  const ariaDescribedBy = () => {
    return [local["aria-describedby"], radioContext.descriptionId(), radioGroupContext.ariaDescribedBy()].filter(Boolean).join(" ") || undefined;
  };
  const onChange = e => {
    callHandler(e, local.onChange);
    e.stopPropagation();
    radioGroupContext.setSelectedValue(radioContext.value());
    const target = e.target;

    // Unlike in React, inputs `checked` state can be out of sync with our state.
    // for example a readonly `<input type="radio" />` is always "checkable".
    //
    // Also, even if an input is controlled (ex: `<input type="radio" checked={isChecked} />`,
    // clicking on the input will change its internal `checked` state.
    //
    // To prevent this, we need to force the input `checked` state to be in sync with our state.
    target.checked = radioContext.isSelected();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    radioContext.setIsFocused(true);
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    radioContext.setIsFocused(false);
  };
  createEffect(() => onCleanup(radioContext.registerInput(others.id)));
  return (() => {
    const _el$ = _tmpl$$7();
    _el$.addEventListener("blur", onBlur);
    _el$.addEventListener("focus", onFocus);
    _el$.addEventListener("change", onChange);
    const _ref$ = mergeRefs(radioContext.setInputRef, local.ref);
    typeof _ref$ === "function" && use(_ref$, _el$);
    spread(_el$, mergeProps$1({
      get name() {
        return formControlContext.name();
      },
      get value() {
        return radioContext.value();
      },
      get checked() {
        return radioContext.isSelected();
      },
      get required() {
        return formControlContext.isRequired();
      },
      get disabled() {
        return radioContext.isDisabled();
      },
      get readonly() {
        return formControlContext.isReadOnly();
      },
      get style() {
        return {
          ...visuallyHiddenStyles,
          ...local.style
        };
      },
      get ["aria-labelledby"]() {
        return ariaLabelledBy();
      },
      get ["aria-describedby"]() {
        return ariaDescribedBy();
      }
    }, () => radioContext.dataset(), others), false, false);
    return _el$;
  })();
}

const _tmpl$$6 = /*#__PURE__*/template(`<label>`);
/**
 * The label that gives the user information on the radio button.
 */
function RadioGroupItemLabel(props) {
  const context = useRadioGroupItemContext();
  props = mergeDefaultProps({
    id: context.generateId("label")
  }, props);
  createEffect(() => onCleanup(context.registerLabel(props.id)));
  return (() => {
    const _el$ = _tmpl$$6();
    spread(_el$, mergeProps$1({
      get ["for"]() {
        return context.inputId();
      }
    }, () => context.dataset(), props), false, false);
    return _el$;
  })();
}

/**
 * The label that gives the user information on the radio group.
 */
function RadioGroupLabel(props) {
  return createComponent(FormControlLabel, mergeProps$1({
    as: "span"
  }, props));
}

/**
 * A set of checkable buttons, known as radio buttons, where no more than one of the buttons can be checked at a time.
 * This component is based on the [WAI-ARIA Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton/)
 */
function RadioGroupRoot(props) {
  let ref;
  const defaultId = `radiogroup-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    orientation: "vertical"
  }, props);
  const [local, formControlProps, others] = splitProps(props, ["ref", "value", "defaultValue", "onChange", "orientation", "aria-labelledby", "aria-describedby"], FORM_CONTROL_PROP_NAMES);
  const [selected, setSelected] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: value => local.onChange?.(value)
  });
  const {
    formControlContext
  } = createFormControl(formControlProps);
  createFormResetListener(() => ref, () => setSelected(local.defaultValue ?? ""));
  const ariaLabelledBy = () => {
    return formControlContext.getAriaLabelledBy(access(formControlProps.id), others["aria-label"], local["aria-labelledby"]);
  };
  const ariaDescribedBy = () => {
    return formControlContext.getAriaDescribedBy(local["aria-describedby"]);
  };
  const isSelectedValue = value => {
    return value === selected();
  };
  const context = {
    ariaDescribedBy,
    isSelectedValue,
    setSelectedValue: value => {
      if (formControlContext.isReadOnly() || formControlContext.isDisabled()) {
        return;
      }
      setSelected(value);

      // Sync all radio input checked state in the group with the selected value.
      // This is necessary because checked state might be out of sync
      // (ex: when using controlled radio-group).
      ref?.querySelectorAll("[type='radio']").forEach(el => {
        const radio = el;
        radio.checked = isSelectedValue(radio.value);
      });
    }
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(RadioGroupContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            ref(r$) {
              const _ref$ = mergeRefs(el => ref = el, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "radiogroup",
            get id() {
              return access(formControlProps.id);
            },
            get ["aria-invalid"]() {
              return formControlContext.validationState() === "invalid" || undefined;
            },
            get ["aria-required"]() {
              return formControlContext.isRequired() || undefined;
            },
            get ["aria-disabled"]() {
              return formControlContext.isDisabled() || undefined;
            },
            get ["aria-readonly"]() {
              return formControlContext.isReadOnly() || undefined;
            },
            get ["aria-orientation"]() {
              return local.orientation;
            },
            get ["aria-labelledby"]() {
              return ariaLabelledBy();
            },
            get ["aria-describedby"]() {
              return ariaDescribedBy();
            }
          }, () => formControlContext.dataset(), others));
        }
      });
    }
  });
}

var index$9 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  Item: RadioGroupItem,
  ItemControl: RadioGroupItemControl,
  ItemDescription: RadioGroupItemDescription,
  ItemIndicator: RadioGroupItemIndicator,
  ItemInput: RadioGroupItemInput,
  ItemLabel: RadioGroupItemLabel,
  Label: RadioGroupLabel,
  Root: RadioGroupRoot
});

const SelectContext = createContext();
function useSelectContext() {
  const context = useContext(SelectContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useSelectContext` must be used within a `Select` component");
  }
  return context;
}

/**
 * The component that pops out when the select is open.
 */
function SelectContent(props) {
  let ref;
  const context = useSelectContext();
  const [local, others] = splitProps(props, ["ref", "id", "style", "onCloseAutoFocus", "onFocusOutside"]);
  const onEscapeKeyDown = e => {
    // `createSelectableList` prevent escape key down,
    // which prevent our `onDismiss` in `DismissableLayer` to run,
    // so we force "close on escape" here.
    context.close();
  };
  const onFocusOutside = e => {
    local.onFocusOutside?.(e);

    // When focus is trapped (in modal mode), a `focusout` event may still happen.
    // We make sure we don't trigger our `onDismiss` in such case.
    if (context.isOpen() && context.isModal()) {
      e.preventDefault();
    }
  };

  // aria-hide everything except the content (better supported equivalent to setting aria-modal)
  createHideOutside({
    isDisabled: () => !(context.isOpen() && context.isModal()),
    targets: () => ref ? [ref] : []
  });
  createPreventScroll({
    ownerRef: () => ref,
    isDisabled: () => !(context.isOpen() && (context.isModal() || context.preventScroll()))
  });
  createFocusScope({
    trapFocus: () => context.isOpen() && context.isModal(),
    onMountAutoFocus: e => {
      // We prevent open autofocus because it's handled by the `Listbox`.
      e.preventDefault();
    },
    onUnmountAutoFocus: e => {
      local.onCloseAutoFocus?.(e);
      if (!e.defaultPrevented) {
        focusWithoutScrolling(context.triggerRef());
        e.preventDefault();
      }
    }
  }, () => ref);
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
                ref = el;
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            get disableOutsidePointerEvents() {
              return memo(() => !!context.isModal())() && context.isOpen();
            },
            get excludedElements() {
              return [context.triggerRef];
            },
            get style() {
              return {
                "--kb-select-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            onEscapeKeyDown: onEscapeKeyDown,
            onFocusOutside: onFocusOutside,
            get onDismiss() {
              return context.close;
            }
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

function SelectHiddenSelect(props) {
  const context = useSelectContext();
  return createComponent(HiddenSelectBase, mergeProps$1({
    get collection() {
      return context.listState().collection();
    },
    get selectionManager() {
      return context.listState().selectionManager();
    },
    get isOpen() {
      return context.isOpen();
    },
    get isMultiple() {
      return context.isMultiple();
    },
    get isVirtualized() {
      return context.isVirtualized();
    },
    focusTrigger: () => context.triggerRef()?.focus()
  }, props));
}

/**
 * A small icon often displayed next to the value as a visual affordance for the fact it can be open.
 * It renders a `▼` by default, but you can use your own icon `children`.
 */
function SelectIcon(props) {
  const context = useSelectContext();
  props = mergeDefaultProps({
    children: "▼"
  }, props);
  return createComponent(Polymorphic, mergeProps$1({
    as: "span",
    "aria-hidden": "true"
  }, () => context.dataset(), props));
}

/**
 * The label that gives the user information on the select.
 */
function SelectLabel(props) {
  const context = useSelectContext();
  const [local, others] = splitProps(props, ["onClick"]);
  const onClick = e => {
    callHandler(e, local.onClick);
    if (!context.isDisabled()) {
      context.triggerRef()?.focus();
    }
  };
  return createComponent(FormControlLabel, mergeProps$1({
    as: "span",
    onClick: onClick
  }, others));
}

/**
 * Contains all the items of a `Select`.
 */
function SelectListbox(props) {
  const context = useSelectContext();
  props = mergeDefaultProps({
    id: context.generateId("listbox")
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "onKeyDown"]);
  createEffect(() => onCleanup(context.registerListboxId(local.id)));
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);

    // Prevent from clearing the selection by `createSelectableCollection` on escape.
    if (e.key === "Escape") {
      e.preventDefault();
    }
  };
  return createComponent(ListboxRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setListboxRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return local.id;
    },
    get state() {
      return context.listState();
    },
    get virtualized() {
      return context.isVirtualized();
    },
    get autoFocus() {
      return context.autoFocus();
    },
    shouldSelectOnPressUp: true,
    shouldFocusOnHover: true,
    get shouldFocusWrap() {
      return context.shouldFocusWrap();
    },
    get disallowTypeAhead() {
      return context.disallowTypeAhead();
    },
    get ["aria-labelledby"]() {
      return context.listboxAriaLabelledBy();
    },
    get renderItem() {
      return context.renderItem;
    },
    get renderSection() {
      return context.renderSection;
    },
    onKeyDown: onKeyDown
  }, others));
}

/**
 * Portals its children into the `body` when the select is open.
 */
function SelectPortal(props) {
  const context = useSelectContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/**
 * Base component for a select, provide context for its children.
 * Used to build single and multi-select.
 */
function SelectBase(props) {
  const defaultId = `select-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    selectionMode: "single",
    disallowEmptySelection: false,
    allowDuplicateSelectionEvents: true,
    gutter: 8,
    sameWidth: true,
    modal: false,
    preventScroll: false
  }, props);
  const [local, popperProps, formControlProps, others] = splitProps(props, ["itemComponent", "sectionComponent", "open", "defaultOpen", "onOpenChange", "value", "defaultValue", "onChange", "placeholder", "options", "optionValue", "optionTextValue", "optionDisabled", "optionGroupChildren", "keyboardDelegate", "allowDuplicateSelectionEvents", "disallowEmptySelection", "disallowTypeAhead", "shouldFocusWrap", "selectionBehavior", "selectionMode", "virtualized", "modal", "preventScroll", "forceMount"], ["getAnchorRect", "placement", "gutter", "shift", "flip", "slide", "overlap", "sameWidth", "fitViewport", "hideWhenDetached", "detachedPadding", "arrowPadding", "overflowPadding"], FORM_CONTROL_PROP_NAMES);
  const [triggerId, setTriggerId] = createSignal();
  const [valueId, setValueId] = createSignal();
  const [listboxId, setListboxId] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [listboxRef, setListboxRef] = createSignal();
  const [listboxAriaLabelledBy, setListboxAriaLabelledBy] = createSignal();
  const [focusStrategy, setFocusStrategy] = createSignal(true);
  const getOptionValue = option => {
    const optionValue = local.optionValue;
    if (optionValue == null) {
      // If no `optionValue`, the option itself is the value (ex: string[] of options)
      return String(option);
    }

    // Get the value from the option object as a string.
    return String(isFunction(optionValue) ? optionValue(option) : option[optionValue]);
  };

  // Only options without option groups.
  const flattenOptions = createMemo(() => {
    const optionGroupChildren = local.optionGroupChildren;

    // The combobox doesn't contains option groups.
    if (optionGroupChildren == null) {
      return local.options;
    }
    return local.options.flatMap(item => item[optionGroupChildren] ?? item);
  });

  // Only option keys without option groups.
  const flattenOptionKeys = createMemo(() => {
    return flattenOptions().map(option => getOptionValue(option));
  });
  const getOptionsFromValues = values => {
    return [...values].map(value => flattenOptions().find(option => getOptionValue(option) === value)).filter(option => option != null);
  };
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const listState = createListState({
    selectedKeys: () => {
      if (local.value != null) {
        return local.value.map(getOptionValue);
      }
      return local.value;
    },
    defaultSelectedKeys: () => {
      if (local.defaultValue != null) {
        return local.defaultValue.map(getOptionValue);
      }
      return local.defaultValue;
    },
    onSelectionChange: selectedKeys => {
      local.onChange?.(getOptionsFromValues(selectedKeys));
      if (local.selectionMode === "single") {
        close();
      }
    },
    allowDuplicateSelectionEvents: () => access(local.allowDuplicateSelectionEvents),
    disallowEmptySelection: () => access(local.disallowEmptySelection),
    selectionBehavior: () => access(local.selectionBehavior),
    selectionMode: () => local.selectionMode,
    dataSource: () => local.options ?? [],
    getKey: () => local.optionValue,
    getTextValue: () => local.optionTextValue,
    getDisabled: () => local.optionDisabled,
    getSectionChildren: () => local.optionGroupChildren
  });
  const selectedOptions = createMemo(() => {
    return getOptionsFromValues(listState.selectionManager().selectedKeys());
  });
  const removeOptionFromSelection = option => {
    listState.selectionManager().toggleSelection(getOptionValue(option));
  };
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const focusListbox = () => {
    const listboxEl = listboxRef();
    if (listboxEl) {
      focusWithoutScrolling(listboxEl);
    }
  };
  const open = focusStrategy => {
    // Don't open if there is no option.
    if (local.options.length <= 0) {
      return;
    }
    setFocusStrategy(focusStrategy);
    disclosureState.open();
    let focusedKey = listState.selectionManager().firstSelectedKey();
    if (focusedKey == null) {
      if (focusStrategy === "first") {
        focusedKey = listState.collection().getFirstKey();
      } else if (focusStrategy === "last") {
        focusedKey = listState.collection().getLastKey();
      }
    }
    focusListbox();
    listState.selectionManager().setFocused(true);
    listState.selectionManager().setFocusedKey(focusedKey);
  };
  const close = () => {
    disclosureState.close();
    listState.selectionManager().setFocused(false);
    listState.selectionManager().setFocusedKey(undefined);
  };
  const toggle = focusStrategy => {
    if (disclosureState.isOpen()) {
      close();
    } else {
      open(focusStrategy);
    }
  };
  const {
    formControlContext
  } = createFormControl(formControlProps);
  createFormResetListener(triggerRef, () => {
    const defaultSelectedKeys = local.defaultValue ? [...local.defaultValue].map(getOptionValue) : new Selection();
    listState.selectionManager().setSelectedKeys(defaultSelectedKeys);
  });
  const collator = createCollator({
    usage: "search",
    sensitivity: "base"
  });

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  const delegate = createMemo(() => {
    const keyboardDelegate = access(local.keyboardDelegate);
    if (keyboardDelegate) {
      return keyboardDelegate;
    }
    return new ListKeyboardDelegate(listState.collection, undefined, collator);
  });
  const renderItem = item => {
    return local.itemComponent?.({
      item
    });
  };
  const renderSection = section => {
    return local.sectionComponent?.({
      section
    });
  };

  // Delete selected keys that do not match any option in the listbox.
  createEffect(on([flattenOptionKeys], ([flattenOptionKeys]) => {
    const currentSelectedKeys = [...listState.selectionManager().selectedKeys()];
    const keysToKeep = currentSelectedKeys.filter(key => flattenOptionKeys.includes(key));
    listState.selectionManager().setSelectedKeys(keysToKeep);
  }, {
    defer: true
  }));
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isDisabled: () => formControlContext.isDisabled() ?? false,
    isMultiple: () => access(local.selectionMode) === "multiple",
    isVirtualized: () => local.virtualized ?? false,
    isModal: () => local.modal ?? false,
    preventScroll: () => local.preventScroll ?? false,
    disallowTypeAhead: () => local.disallowTypeAhead ?? false,
    shouldFocusWrap: () => local.shouldFocusWrap ?? false,
    selectedOptions,
    contentPresence,
    autoFocus: focusStrategy,
    triggerRef,
    listState: () => listState,
    keyboardDelegate: delegate,
    triggerId,
    valueId,
    listboxId,
    listboxAriaLabelledBy,
    setListboxAriaLabelledBy,
    setTriggerRef,
    setContentRef,
    setListboxRef,
    open,
    close,
    toggle,
    placeholder: () => local.placeholder,
    renderItem,
    renderSection,
    removeOptionFromSelection,
    generateId: createGenerateId(() => access(formControlProps.id)),
    registerTriggerId: createRegisterId(setTriggerId),
    registerValueId: createRegisterId(setValueId),
    registerListboxId: createRegisterId(setListboxId)
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(SelectContext.Provider, {
        value: context,
        get children() {
          return createComponent(PopperRoot, mergeProps$1({
            anchorRef: triggerRef,
            contentRef: contentRef
          }, popperProps, {
            get children() {
              return createComponent(Polymorphic, mergeProps$1({
                as: "div",
                role: "group",
                get id() {
                  return access(formControlProps.id);
                }
              }, () => formControlContext.dataset(), dataset, others));
            }
          }));
        }
      });
    }
  });
}

/**
 * Displays a list of options for the user to pick from — triggered by a button.
 */
function SelectRoot(props) {
  const [local, others] = splitProps(props, ["value", "defaultValue", "onChange", "multiple"]);
  const value = createMemo(() => {
    if (local.value != null) {
      return local.multiple ? local.value : [local.value];
    }
    return local.value;
  });
  const defaultValue = createMemo(() => {
    if (local.defaultValue != null) {
      return local.multiple ? local.defaultValue : [local.defaultValue];
    }
    return local.defaultValue;
  });
  const onChange = value => {
    if (local.multiple) {
      local.onChange?.(value);
    } else {
      // use `null` as "no value" because `undefined` mean the component is "uncontrolled".
      local.onChange?.(value[0] ?? null);
    }
  };
  return createComponent(SelectBase, mergeProps$1({
    get value() {
      return value();
    },
    get defaultValue() {
      return defaultValue();
    },
    onChange: onChange,
    get selectionMode() {
      return local.multiple ? "multiple" : "single";
    }
  }, others));
}

function SelectTrigger(props) {
  const formControlContext = useFormControlContext();
  const context = useSelectContext();
  props = mergeDefaultProps({
    id: context.generateId("trigger")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "disabled", "onPointerDown", "onClick", "onKeyDown", "onFocus", "onBlur"], FORM_CONTROL_FIELD_PROP_NAMES);
  const selectionManager = () => context.listState().selectionManager();
  const keyboardDelegate = () => context.keyboardDelegate();
  const isDisabled = () => local.disabled || context.isDisabled();
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  const {
    typeSelectHandlers
  } = createTypeSelect({
    keyboardDelegate: keyboardDelegate,
    selectionManager: selectionManager,
    onTypeSelect: key => selectionManager().select(key)
  });
  const ariaLabelledBy = () => {
    return [context.listboxAriaLabelledBy(), context.valueId()].filter(Boolean).join(" ") || undefined;
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    e.currentTarget.dataset.pointerType = e.pointerType;

    // For consistency with native, open the select on mouse down (main button), but touch up.
    if (!isDisabled() && e.pointerType !== "touch" && e.button === 0) {
      // prevent trigger from stealing focus from the active item after opening.
      e.preventDefault();
      context.toggle(true);
    }
  };
  const onClick = e => {
    callHandler(e, local.onClick);
    if (!isDisabled() && e.currentTarget.dataset.pointerType === "touch") {
      context.toggle(true);
    }
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (isDisabled()) {
      return;
    }
    callHandler(e, typeSelectHandlers.onKeyDown);
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        e.stopPropagation();
        e.preventDefault();
        context.toggle("first");
        break;
      case "ArrowUp":
        e.stopPropagation();
        e.preventDefault();
        context.toggle("last");
        break;
      case "ArrowLeft":
        {
          // prevent scrolling containers
          e.preventDefault();
          if (context.isMultiple()) {
            return;
          }
          const firstSelectedKey = selectionManager().firstSelectedKey();
          const key = firstSelectedKey != null ? keyboardDelegate().getKeyAbove?.(firstSelectedKey) : keyboardDelegate().getFirstKey?.();
          if (key != null) {
            selectionManager().select(key);
          }
          break;
        }
      case "ArrowRight":
        {
          // prevent scrolling containers
          e.preventDefault();
          if (context.isMultiple()) {
            return;
          }
          const firstSelectedKey = selectionManager().firstSelectedKey();
          const key = firstSelectedKey != null ? keyboardDelegate().getKeyBelow?.(firstSelectedKey) : keyboardDelegate().getFirstKey?.();
          if (key != null) {
            selectionManager().select(key);
          }
          break;
        }
    }
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    if (selectionManager().isFocused()) {
      return;
    }
    selectionManager().setFocused(true);
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    if (context.isOpen()) {
      return;
    }
    selectionManager().setFocused(false);
  };
  createEffect(() => onCleanup(context.registerTriggerId(fieldProps.id())));
  createEffect(() => {
    context.setListboxAriaLabelledBy([fieldProps.ariaLabelledBy(), fieldProps.ariaLabel() && !fieldProps.ariaLabelledBy() ? fieldProps.id() : null].filter(Boolean).join(" ") || undefined);
  });
  return createComponent(ButtonRoot, mergeProps$1({
    ref(r$) {
      const _ref$ = mergeRefs(context.setTriggerRef, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return fieldProps.id();
    },
    get disabled() {
      return isDisabled();
    },
    "aria-haspopup": "listbox",
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return memo(() => !!context.isOpen())() ? context.listboxId() : undefined;
    },
    get ["aria-label"]() {
      return fieldProps.ariaLabel();
    },
    get ["aria-labelledby"]() {
      return ariaLabelledBy();
    },
    get ["aria-describedby"]() {
      return fieldProps.ariaDescribedBy();
    },
    onPointerDown: onPointerDown,
    onClick: onClick,
    onKeyDown: onKeyDown,
    onFocus: onFocus,
    onBlur: onBlur
  }, () => context.dataset(), () => formControlContext.dataset(), others));
}

const _tmpl$$5 = /*#__PURE__*/template(`<span>`);
/**
 * The part that reflects the selected value(s).
 */
function SelectValue(props) {
  const formControlContext = useFormControlContext();
  const context = useSelectContext();
  props = mergeDefaultProps({
    id: context.generateId("value")
  }, props);
  const [local, others] = splitProps(props, ["id", "children"]);
  const selectionManager = () => context.listState().selectionManager();
  const isSelectionEmpty = () => {
    const selectedKeys = selectionManager().selectedKeys();

    // Some form libraries uses an empty string as default value, often taken from an empty `<option />`.
    // Ignore since it is not a valid key.
    if (selectedKeys.size === 1 && selectedKeys.has("")) {
      return true;
    }
    return selectionManager().isEmpty();
  };
  createEffect(() => onCleanup(context.registerValueId(local.id)));
  return (() => {
    const _el$ = _tmpl$$5();
    spread(_el$, mergeProps$1({
      get id() {
        return local.id;
      },
      get ["data-placeholder-shown"]() {
        return isSelectionEmpty() ? "" : undefined;
      }
    }, () => formControlContext.dataset(), others), false, true);
    insert(_el$, createComponent(Show, {
      get when() {
        return !isSelectionEmpty();
      },
      get fallback() {
        return context.placeholder();
      },
      get children() {
        return createComponent(SelectValueChild, {
          state: {
            selectedOption: () => context.selectedOptions()[0],
            selectedOptions: () => context.selectedOptions(),
            remove: option => context.removeOptionFromSelection(option),
            clear: () => selectionManager().clearSelection()
          },
          get children() {
            return local.children;
          }
        });
      }
    }));
    return _el$;
  })();
}
function SelectValueChild(props) {
  const resolvedChildren = children(() => {
    const body = props.children;
    return isFunction(body) ? body(props.state) : body;
  });
  return memo(resolvedChildren);
}

var index$8 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  Content: SelectContent,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  HiddenSelect: SelectHiddenSelect,
  Icon: SelectIcon,
  Item: ListboxItem,
  ItemDescription: ListboxItemDescription,
  ItemIndicator: ListboxItemIndicator,
  ItemLabel: ListboxItemLabel,
  Label: SelectLabel,
  Listbox: SelectListbox,
  Portal: SelectPortal,
  Root: SelectRoot,
  Section: ListboxSection,
  Trigger: SelectTrigger,
  Value: SelectValue
});

function Skeleton(props) {
  const defaultId = `skeleton-${createUniqueId()}`;
  props = mergeDefaultProps({
    visible: true,
    animate: true,
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["style", "ref", "radius", "animate", "height", "width", "visible", "circle"]);
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    role: "group",
    get ["data-animate"]() {
      return local.animate;
    },
    get ["data-visible"]() {
      return local.visible;
    },
    get style() {
      return {
        "border-radius": local.circle ? "9999px" : local.radius ? `${local.radius}px` : undefined,
        width: local.circle ? `${local.height}px` : local.width ? `${local.width}px` : "100%",
        height: local.height ? `${local.height}px` : "auto",
        ...local.style
      };
    }
  }, others));
}

var index$7 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: Skeleton
});

const SliderContext = createContext();
function useSliderContext() {
  const context = useContext(SliderContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useSliderContext` must be used within a `Slider.Root` component");
  }
  return context;
}

/**
 * The component that visually represents the slider value.
 * Used to visually show the fill of `Slider.Track`.
 */
function SliderFill(props) {
  const context = useSliderContext();
  const [local, others] = splitProps(props, ["style"]);
  const percentages = () => {
    return context.state.values().map(value => context.state.getValuePercent(value) * 100);
  };
  const offsetStart = () => {
    return context.state.values().length > 1 ? Math.min(...percentages()) : 0;
  };
  const offsetEnd = () => {
    return 100 - Math.max(...percentages());
  };
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get style() {
      return {
        [context.startEdge()]: `${offsetStart()}%`,
        [context.endEdge()]: `${offsetEnd()}%`,
        ...local.style
      };
    }
  }, () => context.dataset(), others));
}

function SliderThumb(props) {
  let ref;
  const context = useSliderContext();
  props = mergeDefaultProps({
    id: context.generateId(`thumb-${createUniqueId()}`)
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "style", "onKeyDown", "onPointerDown", "onPointerMove", "onPointerUp", "onFocus", "onBlur"], FORM_CONTROL_FIELD_PROP_NAMES);
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  createDomCollectionItem({
    getItem: () => ({
      ref: () => ref,
      disabled: context.state.isDisabled(),
      key: fieldProps.id(),
      textValue: "",
      type: "item"
    })
  });
  const index = () => ref ? context.thumbs().findIndex(v => v.ref() === ref) : -1;
  const value = () => context.state.getThumbValue(index());
  const position = () => {
    return context.state.getThumbPercent(index());
  };
  const transform = () => {
    /*
    let value = 50;
    const isVertical = context.state.orientation() === "vertical";
     if (isVertical) {
      value *= context.isSlidingFromBottom() ? 1 : -1;
    } else {
      value *= context.isSlidingFromLeft() ? -1 : 1;
    }
     return isVertical ? `translate(-50%, ${value}%)` : `translate(${value}%, -50%)`;
     */

    return context.state.orientation() === "vertical" ? "translateY(50%)" : "translateX(-50%)";
  };
  let startPosition = 0;
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    context.onStepKeyDown(e, index());
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    const target = e.currentTarget;
    e.preventDefault();
    e.stopPropagation();
    target.setPointerCapture(e.pointerId);
    target.focus();
    startPosition = context.state.orientation() === "horizontal" ? e.clientX : e.clientY;
    if (value() !== undefined) {
      context.onSlideStart?.(index(), value());
    }
  };
  const onPointerMove = e => {
    e.stopPropagation();
    callHandler(e, local.onPointerMove);
    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      const delta = {
        deltaX: e.clientX - startPosition,
        deltaY: e.clientY - startPosition
      };
      context.onSlideMove?.(delta);
      startPosition = context.state.orientation() === "horizontal" ? e.clientX : e.clientY;
    }
  };
  const onPointerUp = e => {
    e.stopPropagation();
    callHandler(e, local.onPointerUp);
    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
      context.onSlideEnd?.();
    }
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    context.state.setFocusedThumb(index());
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    context.state.setFocusedThumb(undefined);
  };
  onMount(() => {
    context.state.setThumbEditable(index(), !context.state.isDisabled());
  });
  return createComponent(ThumbContext.Provider, {
    value: {
      index
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "span",
        ref(r$) {
          const _ref$ = mergeRefs(el => ref = el, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        role: "slider",
        get id() {
          return fieldProps.id();
        },
        get tabIndex() {
          return context.state.isDisabled() ? undefined : 0;
        },
        get style() {
          return {
            display: value() === undefined ? "none" : undefined,
            position: "absolute",
            [context.startEdge()]: `calc(${position() * 100}%)`,
            transform: transform(),
            "touch-action": "none",
            ...local.style
          };
        },
        get ["aria-valuetext"]() {
          return context.state.getThumbValueLabel(index());
        },
        get ["aria-valuemin"]() {
          return context.minValue();
        },
        get ["aria-valuenow"]() {
          return value();
        },
        get ["aria-valuemax"]() {
          return context.maxValue();
        },
        get ["aria-orientation"]() {
          return context.state.orientation();
        },
        get ["aria-label"]() {
          return fieldProps.ariaLabel();
        },
        get ["aria-labelledby"]() {
          return fieldProps.ariaLabelledBy();
        },
        get ["aria-describedby"]() {
          return fieldProps.ariaDescribedBy();
        },
        onKeyDown: onKeyDown,
        onPointerDown: onPointerDown,
        onPointerMove: onPointerMove,
        onPointerUp: onPointerUp,
        onFocus: onFocus,
        onBlur: onBlur
      }, () => context.dataset(), others));
    }
  });
}
const ThumbContext = createContext();
function useThumbContext() {
  const context = useContext(ThumbContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useThumbContext` must be used within a `Slider.Thumb` component");
  }
  return context;
}

const _tmpl$$4 = /*#__PURE__*/template(`<input type="range">`);
/**
 * The native html input that is visually hidden in the slider thumb.
 */
function SliderInput(props) {
  const formControlContext = useFormControlContext();
  const context = useSliderContext();
  const thumb = useThumbContext();
  props = mergeDefaultProps({
    id: context.generateId("input")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "style", "onChange"], FORM_CONTROL_FIELD_PROP_NAMES);
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  const [valueText, setValueText] = createSignal("");
  const onChange = e => {
    callHandler(e, local.onChange);
    const target = e.target;
    context.state.setThumbValue(thumb.index(), parseFloat(target.value));

    // Unlike in React, inputs `value` can be out of sync with our value state.
    // even if an input is controlled (ex: `<input value="foo" />`,
    // typing on the input will change its internal `value`.
    //
    // To prevent this, we need to force the input `value` to be in sync with the slider value state.
    target.value = String(context.state.values()[thumb.index()]) ?? "";
  };
  createEffect(() => {
    setValueText(thumb.index() === -1 ? "" : context.state.getThumbValueLabel(thumb.index()));
  });
  return (// eslint-disable-next-line jsx-a11y/role-supports-aria-props
    (() => {
      const _el$ = _tmpl$$4();
      _el$.addEventListener("change", onChange);
      const _ref$ = mergeRefs(el => el, local.ref);
      typeof _ref$ === "function" && use(_ref$, _el$);
      spread(_el$, mergeProps$1({
        get id() {
          return fieldProps.id();
        },
        get name() {
          return formControlContext.name();
        },
        get tabIndex() {
          return !context.state.isDisabled() ? 0 : undefined;
        },
        get min() {
          return context.state.getThumbMinValue(thumb.index());
        },
        get max() {
          return context.state.getThumbMaxValue(thumb.index());
        },
        get step() {
          return context.state.step();
        },
        get value() {
          return context.state.values()[thumb.index()];
        },
        get required() {
          return formControlContext.isRequired();
        },
        get disabled() {
          return formControlContext.isDisabled();
        },
        get readonly() {
          return formControlContext.isReadOnly();
        },
        get style() {
          return {
            ...visuallyHiddenStyles,
            ...local.style
          };
        },
        get ["aria-orientation"]() {
          return context.state.orientation();
        },
        get ["aria-valuetext"]() {
          return valueText();
        },
        get ["aria-label"]() {
          return fieldProps.ariaLabel();
        },
        get ["aria-labelledby"]() {
          return fieldProps.ariaLabelledBy();
        },
        get ["aria-describedby"]() {
          return fieldProps.ariaDescribedBy();
        },
        get ["aria-invalid"]() {
          return formControlContext.validationState() === "invalid" || undefined;
        },
        get ["aria-required"]() {
          return formControlContext.isRequired() || undefined;
        },
        get ["aria-disabled"]() {
          return formControlContext.isDisabled() || undefined;
        },
        get ["aria-readonly"]() {
          return formControlContext.isReadOnly() || undefined;
        }
      }, () => context.dataset(), others), false, false);
      return _el$;
    })()
  );
}

function getNextSortedValues(prevValues = [], nextValue, atIndex) {
  const nextValues = [...prevValues];
  nextValues[atIndex] = nextValue;
  return nextValues.sort((a, b) => a - b);
}

/**
 * Given a `values` array and a `nextValue`, determine which value in
 * the array is closest to `nextValue` and return its index.
 *
 * @example
 * // returns 1
 * getClosestValueIndex([10, 30], 25);
 */
function getClosestValueIndex(values, nextValue) {
  if (values.length === 1) return 0;
  const distances = values.map(value => Math.abs(value - nextValue));
  const closestDistance = Math.min(...distances);
  return distances.indexOf(closestDistance);
}

/**
 * Gets an array of steps between each value.
 *
 * @example
 * // returns [1, 9]
 * getStepsBetweenValues([10, 11, 20]);
 */
function getStepsBetweenValues(values) {
  return values.slice(0, -1).map((value, index) => values[index + 1] - value);
}

/**
 * Verifies the minimum steps between all values is greater than or equal
 * to the expected minimum steps.
 *
 * @example
 * // returns false
 * hasMinStepsBetweenValues([1,2,3], 2);
 *
 * @example
 * // returns true
 * hasMinStepsBetweenValues([1,2,3], 1);
 */
function hasMinStepsBetweenValues(values, minStepsBetweenValues) {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values);
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues);
    return actualMinStepsBetweenValues >= minStepsBetweenValues;
  }
  return true;
}

// https://github.com/tmcw-up-for-adoption/simple-linear-scale/blob/master/index.js
function linearScale(input, output) {
  return value => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/1ddcde7b4fef9af7f08e11bb78d71fe60bbcc64b/packages/@react-stately/slider/src/useSliderState.ts
 */

function createSliderState(props) {
  props = mergeDefaultProps({
    minValue: () => 0,
    maxValue: () => 100,
    step: () => 1,
    minStepsBetweenThumbs: () => 0,
    orientation: () => "horizontal",
    isDisabled: () => false
  }, props);
  const pageSize = createMemo(() => {
    let calcPageSize = (props.maxValue() - props.minValue()) / 10;
    calcPageSize = snapValueToStep(calcPageSize, 0, calcPageSize + props.step(), props.step());
    return Math.max(calcPageSize, props.step());
  });
  const defaultValue = createMemo(() => {
    return props.defaultValue() ?? [props.minValue()];
  });
  const [values, setValues] = createControllableArraySignal({
    value: () => props.value(),
    defaultValue,
    onChange: values => props.onChange?.(values)
  });
  const [isDragging, setIsDragging] = createSignal(new Array(values().length).fill(false));
  const [isEditables, setEditables] = createSignal(new Array(values().length).fill(false));
  const [focusedIndex, setFocusedIndex] = createSignal(undefined);
  const resetValues = () => {
    setValues(defaultValue());
  };
  const getValuePercent = value => {
    return (value - props.minValue()) / (props.maxValue() - props.minValue());
  };
  const getThumbMinValue = index => {
    return index === 0 ? props.minValue() : values()[index - 1];
  };
  const getThumbMaxValue = index => {
    return index === values().length - 1 ? props.maxValue() : values()[index + 1];
  };
  const isThumbEditable = index => {
    return isEditables()[index];
  };
  const setThumbEditable = index => {
    setEditables(p => {
      p[index] = true;
      return p;
    });
  };
  const updateValue = (index, value) => {
    if (props.isDisabled() || !isThumbEditable(index)) return;
    value = snapValueToStep(value, getThumbMinValue(index), getThumbMaxValue(index), props.step());
    const nextValues = getNextSortedValues(values(), value, index);
    if (!hasMinStepsBetweenValues(nextValues, props.minStepsBetweenThumbs() * props.step())) {
      return;
    }
    setValues(prev => [...replaceIndex(prev, index, value)]);
  };
  const updateDragging = (index, dragging) => {
    if (props.isDisabled() || !isThumbEditable(index)) return;
    const wasDragging = isDragging()[index];
    setIsDragging(p => [...replaceIndex(p, index, dragging)]);
    if (wasDragging && !isDragging().some(Boolean)) {
      props.onChangeEnd?.(values());
    }
  };
  const getFormattedValue = value => {
    return props.numberFormatter.format(value);
  };
  const setThumbPercent = (index, percent) => {
    updateValue(index, getPercentValue(percent));
  };
  const getRoundedValue = value => {
    return Math.round((value - props.minValue()) / props.step()) * props.step() + props.minValue();
  };
  const getPercentValue = percent => {
    const val = percent * (props.maxValue() - props.minValue()) + props.minValue();
    return clamp(getRoundedValue(val), props.minValue(), props.maxValue());
  };
  const incrementThumb = (index, stepSize = 1) => {
    const s = Math.max(stepSize, props.step());
    const nextValue = values()[index] + s;
    const nextValues = getNextSortedValues(values(), nextValue, index);
    if (hasMinStepsBetweenValues(nextValues, props.minStepsBetweenThumbs() * props.step())) {
      updateValue(index, snapValueToStep(nextValue, props.minValue(), props.maxValue(), props.step()));
    }
  };
  const decrementThumb = (index, stepSize = 1) => {
    const s = Math.max(stepSize, props.step());
    const nextValue = values()[index] - s;
    const nextValues = getNextSortedValues(values(), nextValue, index);
    if (hasMinStepsBetweenValues(nextValues, props.minStepsBetweenThumbs() * props.step())) {
      updateValue(index, snapValueToStep(nextValue, props.minValue(), props.maxValue(), props.step()));
    }
  };
  return {
    values,
    getThumbValue: index => values()[index],
    setThumbValue: updateValue,
    setThumbPercent,
    isThumbDragging: index => isDragging()[index],
    setThumbDragging: updateDragging,
    focusedThumb: focusedIndex,
    setFocusedThumb: setFocusedIndex,
    getThumbPercent: index => getValuePercent(values()[index]),
    getValuePercent,
    getThumbValueLabel: index => getFormattedValue(values()[index]),
    getFormattedValue,
    getThumbMinValue,
    getThumbMaxValue,
    getPercentValue,
    isThumbEditable,
    setThumbEditable,
    incrementThumb,
    decrementThumb,
    step: props.step,
    pageSize,
    orientation: props.orientation,
    isDisabled: props.isDisabled,
    setValues,
    resetValues
  };
}
function replaceIndex(array, index, value) {
  if (array[index] === value) {
    return array;
  }
  return [...array.slice(0, index), value, ...array.slice(index + 1)];
}

function SliderRoot(props) {
  let ref;
  const defaultId = `slider-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    minValue: 0,
    maxValue: 100,
    step: 1,
    minStepsBetweenThumbs: 0,
    orientation: "horizontal",
    disabled: false,
    inverted: false,
    getValueLabel: params => params.values.join(", ")
  }, props);
  const [local, formControlProps, others] = splitProps(props, ["ref", "value", "defaultValue", "onChange", "onChangeEnd", "inverted", "minValue", "maxValue", "step", "minStepsBetweenThumbs", "getValueLabel", "orientation"], FORM_CONTROL_PROP_NAMES);
  const {
    formControlContext
  } = createFormControl(formControlProps);
  const defaultFormatter = createNumberFormatter(() => ({
    style: "decimal"
  }));
  const {
    direction
  } = useLocale();
  const state = createSliderState({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? [local.minValue],
    maxValue: () => local.maxValue,
    minValue: () => local.minValue,
    minStepsBetweenThumbs: () => local.minStepsBetweenThumbs,
    isDisabled: () => formControlContext.isDisabled() ?? false,
    orientation: () => local.orientation,
    step: () => local.step,
    numberFormatter: defaultFormatter(),
    onChange: local.onChange,
    onChangeEnd: local.onChangeEnd
  });
  const [thumbs, setThumbs] = createSignal([]);
  const {
    DomCollectionProvider
  } = createDomCollection({
    items: thumbs,
    onItemsChange: setThumbs
  });
  createFormResetListener(() => ref, () => state.resetValues());
  const isLTR = () => direction() === "ltr";
  const isSlidingFromLeft = () => {
    return isLTR() && !local.inverted || !isLTR() && local.inverted;
  };
  const isSlidingFromBottom = () => !local.inverted;
  const isVertical = () => state.orientation() === "vertical";
  const dataset = createMemo(() => {
    return {
      ...formControlContext.dataset(),
      "data-orientation": local.orientation
    };
  });
  const [trackRef, setTrackRef] = createSignal();
  let currentPosition = null;
  const onSlideStart = (index, value) => {
    state.setFocusedThumb(index);
    state.setThumbDragging(index, true);
    state.setThumbValue(index, value);
    currentPosition = null;
  };
  const onSlideMove = ({
    deltaX,
    deltaY
  }) => {
    const active = state.focusedThumb();
    if (active === undefined) {
      return;
    }
    const {
      width,
      height
    } = trackRef().getBoundingClientRect();
    const size = isVertical() ? height : width;
    if (currentPosition === null) {
      currentPosition = state.getThumbPercent(state.focusedThumb()) * size;
    }
    let delta = isVertical() ? deltaY : deltaX;
    if (!isVertical() && local.inverted || isVertical() && isSlidingFromBottom()) {
      delta = -delta;
    }
    currentPosition += delta;
    const percent = clamp(currentPosition / size, 0, 1);
    const nextValues = getNextSortedValues(state.values(), currentPosition, active);
    if (hasMinStepsBetweenValues(nextValues, local.minStepsBetweenThumbs * state.step())) {
      state.setThumbPercent(state.focusedThumb(), percent);
      local.onChange?.(state.values());
    }
  };
  const onSlideEnd = () => {
    const activeThumb = state.focusedThumb();
    if (activeThumb !== undefined) {
      state.setThumbDragging(activeThumb, false);
      local.onChangeEnd?.(state.values());
    }
  };
  const onHomeKeyDown = () => {
    !formControlContext.isDisabled() && state.focusedThumb() !== undefined && state.setThumbValue(0, state.getThumbMinValue(0));
  };
  const onEndKeyDown = () => {
    !formControlContext.isDisabled() && state.focusedThumb() !== undefined && state.setThumbValue(state.values().length - 1, state.getThumbMaxValue(state.values().length - 1));
  };
  const onStepKeyDown = (event, index) => {
    if (!formControlContext.isDisabled()) {
      switch (event.key) {
        case "Left":
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          if (!isLTR()) {
            state.incrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          } else {
            state.decrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          }
          break;
        case "Right":
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          if (!isLTR()) {
            state.decrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          } else {
            state.incrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          }
          break;
        case "Up":
        case "ArrowUp":
          event.preventDefault();
          event.stopPropagation();
          if (!isLTR()) {
            state.decrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          } else {
            state.incrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          }
          break;
        case "Down":
        case "ArrowDown":
          event.preventDefault();
          event.stopPropagation();
          if (!isLTR()) {
            state.incrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          } else {
            state.decrementThumb(index, event.shiftKey ? state.pageSize() : state.step());
          }
          break;
        case "Home":
          onHomeKeyDown();
          break;
        case "End":
          onEndKeyDown();
          break;
        case "PageUp":
          state.incrementThumb(index, state.pageSize());
          break;
        case "PageDown":
          state.decrementThumb(index, state.pageSize());
          break;
      }
    }
  };
  const startEdge = createMemo(() => {
    if (isVertical()) {
      return isSlidingFromBottom() ? "bottom" : "top";
    }
    return isSlidingFromLeft() ? "left" : "right";
  });
  const endEdge = createMemo(() => {
    if (isVertical()) {
      return isSlidingFromBottom() ? "top" : "bottom";
    }
    return isSlidingFromLeft() ? "right" : "left";
  });
  const context = {
    dataset,
    state,
    thumbs,
    setThumbs,
    onSlideStart,
    onSlideMove,
    onSlideEnd,
    onStepKeyDown,
    isSlidingFromLeft,
    isSlidingFromBottom,
    trackRef,
    minValue: () => local.minValue,
    maxValue: () => local.maxValue,
    inverted: () => local.inverted,
    startEdge,
    endEdge,
    registerTrack: ref => setTrackRef(ref),
    generateId: createGenerateId(() => access(formControlProps.id)),
    getValueLabel: local.getValueLabel
  };
  return createComponent(DomCollectionProvider, {
    get children() {
      return createComponent(FormControlContext.Provider, {
        value: formControlContext,
        get children() {
          return createComponent(SliderContext.Provider, {
            value: context,
            get children() {
              return createComponent(Polymorphic, mergeProps$1({
                as: "div",
                ref(r$) {
                  const _ref$ = mergeRefs(el => ref = el, local.ref);
                  typeof _ref$ === "function" && _ref$(r$);
                },
                role: "group",
                get id() {
                  return access(formControlProps.id);
                }
              }, dataset, others));
            }
          });
        }
      });
    }
  });
}

/**
 * The component that visually represents the slider track.
 * Act as a container for `Slider.Fill`.
 */
function SliderTrack(props) {
  const context = useSliderContext();
  const [local, others] = splitProps(props, ["onPointerDown", "onPointerMove", "onPointerUp"]);
  const [sRect, setRect] = createSignal();
  function getValueFromPointer(pointerPosition) {
    const rect = sRect() || context.trackRef().getBoundingClientRect();
    const input = [0, context.state.orientation() === "vertical" ? rect.height : rect.width];
    let output = context.isSlidingFromLeft() ? [context.minValue(), context.maxValue()] : [context.maxValue(), context.minValue()];
    if (context.state.orientation() === "vertical") {
      output = context.isSlidingFromBottom() ? [context.maxValue(), context.minValue()] : [context.minValue(), context.maxValue()];
    }
    const value = linearScale(input, output);
    setRect(rect);
    return value(pointerPosition - (context.state.orientation() === "vertical" ? rect.top : rect.left));
  }
  let startPosition = 0;
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    const target = e.target;
    target.setPointerCapture(e.pointerId);
    e.preventDefault();
    const value = getValueFromPointer(context.state.orientation() === "horizontal" ? e.clientX : e.clientY);
    startPosition = context.state.orientation() === "horizontal" ? e.clientX : e.clientY;
    const closestIndex = getClosestValueIndex(context.state.values(), value);
    context.onSlideStart?.(closestIndex, value);
  };
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    const target = e.target;
    if (target.hasPointerCapture(e.pointerId)) {
      context.onSlideMove?.({
        deltaX: e.clientX - startPosition,
        deltaY: e.clientY - startPosition
      });
      startPosition = context.state.orientation() === "horizontal" ? e.clientX : e.clientY;
    }
  };
  const onPointerUp = e => {
    callHandler(e, local.onPointerUp);
    const target = e.target;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
      setRect(undefined);
      context.onSlideEnd?.();
    }
  };
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(context.registerTrack, props.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp
  }, () => context.dataset(), others));
}

/**
 * The accessible label text representing the current value in a human-readable format.
 */
function SliderValueLabel(props) {
  const context = useSliderContext();
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, () => context.dataset(), props, {
    get children() {
      return context.getValueLabel?.({
        values: context.state.values(),
        max: context.maxValue(),
        min: context.minValue()
      });
    }
  }));
}

var index$6 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  Fill: SliderFill,
  Input: SliderInput,
  Label: FormControlLabel,
  Root: SliderRoot,
  Thumb: SliderThumb,
  Track: SliderTrack,
  ValueLabel: SliderValueLabel
});

const SwitchContext = createContext();
function useSwitchContext() {
  const context = useContext(SwitchContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useSwitchContext` must be used within a `Switch` component");
  }
  return context;
}

/**
 * The element that visually represents a switch.
 */
function SwitchControl(props) {
  const formControlContext = useFormControlContext();
  const context = useSwitchContext();
  props = mergeDefaultProps({
    id: context.generateId("control")
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
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    onClick: onClick,
    onKeyDown: onKeyDown
  }, () => formControlContext.dataset(), () => context.dataset(), others));
}

/**
 * The description that gives the user more information on the switch.
 */
function SwitchDescription(props) {
  const context = useSwitchContext();
  return createComponent(FormControlDescription, mergeProps$1(() => context.dataset(), props));
}

/**
 * The error message that gives the user information about how to fix a validation error on the switch.
 */
function SwitchErrorMessage(props) {
  const context = useSwitchContext();
  return createComponent(FormControlErrorMessage, mergeProps$1(() => context.dataset(), props));
}

const _tmpl$$3 = /*#__PURE__*/template(`<input type="checkbox" role="switch">`);
/**
 * The native html input that is visually hidden in the switch.
 */
function SwitchInput(props) {
  const formControlContext = useFormControlContext();
  const context = useSwitchContext();
  props = mergeDefaultProps({
    id: context.generateId("input")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["ref", "style", "onChange", "onFocus", "onBlur"], FORM_CONTROL_FIELD_PROP_NAMES);
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  const onChange = e => {
    callHandler(e, local.onChange);
    e.stopPropagation();
    const target = e.target;
    context.setIsChecked(target.checked);

    // Unlike in React, inputs `checked` state can be out of sync with our toggle state.
    // for example a readonly `<input type="checkbox" />` is always "checkable".
    //
    // Also, even if an input is controlled (ex: `<input type="checkbox" checked={isChecked} />`,
    // clicking on the input will change its internal `checked` state.
    //
    // To prevent this, we need to force the input `checked` state to be in sync with the toggle state.
    target.checked = context.checked();
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    context.setIsFocused(true);
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    context.setIsFocused(false);
  };
  return (() => {
    const _el$ = _tmpl$$3();
    _el$.addEventListener("blur", onBlur);
    _el$.addEventListener("focus", onFocus);
    _el$.addEventListener("change", onChange);
    const _ref$ = mergeRefs(context.setInputRef, local.ref);
    typeof _ref$ === "function" && use(_ref$, _el$);
    spread(_el$, mergeProps$1({
      get id() {
        return fieldProps.id();
      },
      get name() {
        return formControlContext.name();
      },
      get value() {
        return context.value();
      },
      get checked() {
        return context.checked();
      },
      get required() {
        return formControlContext.isRequired();
      },
      get disabled() {
        return formControlContext.isDisabled();
      },
      get readonly() {
        return formControlContext.isReadOnly();
      },
      get style() {
        return {
          ...visuallyHiddenStyles,
          ...local.style
        };
      },
      get ["aria-label"]() {
        return fieldProps.ariaLabel();
      },
      get ["aria-labelledby"]() {
        return fieldProps.ariaLabelledBy();
      },
      get ["aria-describedby"]() {
        return fieldProps.ariaDescribedBy();
      },
      get ["aria-invalid"]() {
        return formControlContext.validationState() === "invalid" || undefined;
      },
      get ["aria-required"]() {
        return formControlContext.isRequired() || undefined;
      },
      get ["aria-disabled"]() {
        return formControlContext.isDisabled() || undefined;
      },
      get ["aria-readonly"]() {
        return formControlContext.isReadOnly() || undefined;
      }
    }, () => formControlContext.dataset(), () => context.dataset(), others), false, false);
    return _el$;
  })();
}

/**
 * The label that gives the user information on the switch.
 */
function SwitchLabel(props) {
  const context = useSwitchContext();
  return createComponent(FormControlLabel, mergeProps$1(() => context.dataset(), props));
}

/**
 * A control that allows users to choose one of two values: on or off.
 */
function SwitchRoot(props) {
  let ref;
  const defaultId = `switch-${createUniqueId()}`;
  props = mergeDefaultProps({
    value: "on",
    id: defaultId
  }, props);
  const [local, formControlProps, others] = splitProps(props, ["ref", "children", "value", "checked", "defaultChecked", "onChange", "onPointerDown"], FORM_CONTROL_PROP_NAMES);
  const [inputRef, setInputRef] = createSignal();
  const [isFocused, setIsFocused] = createSignal(false);
  const {
    formControlContext
  } = createFormControl(formControlProps);
  const state = createToggleState({
    isSelected: () => local.checked,
    defaultIsSelected: () => local.defaultChecked,
    onSelectedChange: selected => local.onChange?.(selected),
    isDisabled: () => formControlContext.isDisabled(),
    isReadOnly: () => formControlContext.isReadOnly()
  });
  createFormResetListener(() => ref, () => state.setIsSelected(local.defaultChecked ?? false));
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);

    // For consistency with native, prevent the input blurs on pointer down.
    if (isFocused()) {
      e.preventDefault();
    }
  };
  const dataset = createMemo(() => ({
    "data-checked": state.isSelected() ? "" : undefined
  }));
  const context = {
    value: () => local.value,
    dataset,
    checked: () => state.isSelected(),
    inputRef,
    generateId: createGenerateId(() => access(formControlProps.id)),
    toggle: () => state.toggle(),
    setIsChecked: isChecked => state.setIsSelected(isChecked),
    setIsFocused,
    setInputRef
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(SwitchContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            ref(r$) {
              const _ref$ = mergeRefs(el => ref = el, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "group",
            get id() {
              return access(formControlProps.id);
            },
            onPointerDown: onPointerDown
          }, () => formControlContext.dataset(), dataset, others, {
            get children() {
              return createComponent(SwitchRootChild, {
                state: context,
                get children() {
                  return local.children;
                }
              });
            }
          }));
        }
      });
    }
  });
}
function SwitchRootChild(props) {
  const resolvedChildren = children(() => {
    const body = props.children;
    return isFunction(body) ? body(props.state) : body;
  });
  return memo(resolvedChildren);
}

/**
 * The thumb that is used to visually indicate whether the switch is on or off.
 */
function SwitchThumb(props) {
  const formControlContext = useFormControlContext();
  const context = useSwitchContext();
  props = mergeDefaultProps({
    id: context.generateId("thumb")
  }, props);
  return createComponent(Polymorphic, mergeProps$1({
    as: "div"
  }, () => formControlContext.dataset(), () => context.dataset(), props));
}

var index$5 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Control: SwitchControl,
  Description: SwitchDescription,
  ErrorMessage: SwitchErrorMessage,
  Input: SwitchInput,
  Label: SwitchLabel,
  Root: SwitchRoot,
  Thumb: SwitchThumb
});

const TabsContext = createContext();
function useTabsContext() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useTabsContext` must be used within a `Tabs` component");
  }
  return context;
}

/**
 * Contains the content associated with a tab trigger.
 */
function TabsContent(props) {
  let ref;
  const context = useTabsContext();
  const [local, others] = splitProps(props, ["ref", "id", "value", "forceMount"]);
  const [tabIndex, setTabIndex] = createSignal(0);
  const id = () => local.id ?? context.generateContentId(local.value);
  const isSelected = () => context.listState().selectedKey() === local.value;
  const presence = createPresence(() => local.forceMount || isSelected());
  createEffect(on([() => ref, () => presence.isPresent()], ([ref, isPresent]) => {
    if (ref == null || !isPresent) {
      return;
    }
    const updateTabIndex = () => {
      // Detect if there are any tabbable elements and update the tabIndex accordingly.
      const walker = getFocusableTreeWalker(ref, {
        tabbable: true
      });
      setTabIndex(walker.nextNode() ? undefined : 0);
    };
    updateTabIndex();
    const observer = new MutationObserver(updateTabIndex);

    // Update when new elements are inserted, or the tabindex/disabled attribute updates.
    observer.observe(ref, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["tabindex", "disabled"]
    });
    onCleanup(() => {
      observer.disconnect();
    });
  }));
  createEffect(on([() => local.value, id], ([value, id]) => {
    context.contentIdsMap().set(value, id);
  }));
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps$1({
        as: "div",
        ref(r$) {
          const _ref$ = mergeRefs(el => {
            presence.setRef(el);
            ref = el;
          }, local.ref);
          typeof _ref$ === "function" && _ref$(r$);
        },
        get id() {
          return id();
        },
        role: "tabpanel",
        get tabIndex() {
          return tabIndex();
        },
        get ["aria-labelledby"]() {
          return context.triggerIdsMap().get(local.value);
        },
        get ["data-orientation"]() {
          return context.orientation();
        },
        get ["data-selected"]() {
          return isSelected() ? "" : undefined;
        }
      }, others));
    }
  });
}

/**
 * The visual indicator displayed at the bottom of the tab list to indicate the selected tab.
 * It provides the base style needed to display a smooth transition to the new selected tab.
 */
function TabsIndicator(props) {
  const context = useTabsContext();
  const [local, others] = splitProps(props, ["style"]);
  const [style, setStyle] = createSignal({
    width: undefined,
    height: undefined
  });
  const {
    direction
  } = useLocale();
  const computeStyle = () => {
    const selectedTab = context.selectedTab();
    if (selectedTab == null) {
      return;
    }
    const styleObj = {
      transform: undefined,
      width: undefined,
      height: undefined
    };

    // In RTL, calculate the transform from the right edge of the tab list
    // so that resizing the window doesn't break the TabIndicator position due to offsetLeft changes
    const offset = direction() === "rtl" ? -1 * (selectedTab.offsetParent?.offsetWidth - selectedTab.offsetWidth - selectedTab.offsetLeft) : selectedTab.offsetLeft;
    styleObj.transform = context.orientation() === "vertical" ? `translateY(${selectedTab.offsetTop}px)` : `translateX(${offset}px)`;
    if (context.orientation() === "horizontal") {
      styleObj.width = `${selectedTab.offsetWidth}px`;
    } else {
      styleObj.height = `${selectedTab.offsetHeight}px`;
    }
    setStyle(styleObj);
  };

  // For the first run, wait for all tabs to be mounted and registered in tabs DOM collection
  // before computing the style.
  onMount(() => {
    queueMicrotask(() => {
      computeStyle();
    });
  });

  // Compute style normally for subsequent runs.
  createEffect(on([context.selectedTab, context.orientation, direction], () => {
    computeStyle();
  }, {
    defer: true
  }));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    role: "presentation",
    get style() {
      return {
        ...style(),
        ...local.style
      };
    },
    get ["data-orientation"]() {
      return context.orientation();
    }
  }, others));
}

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/6b51339cca0b8344507d3c8e81e7ad05d6e75f9b/packages/@react-aria/tabs/src/TabsKeyboardDelegate.ts
 */

class TabsKeyboardDelegate {
  constructor(collection, direction, orientation) {
    this.collection = collection;
    this.direction = direction;
    this.orientation = orientation;
  }
  flipDirection() {
    return this.direction() === "rtl" && this.orientation() === "horizontal";
  }
  getKeyLeftOf(key) {
    if (this.flipDirection()) {
      return this.getNextKey(key);
    } else {
      if (this.orientation() === "horizontal") {
        return this.getPreviousKey(key);
      }
      return undefined;
    }
  }
  getKeyRightOf(key) {
    if (this.flipDirection()) {
      return this.getPreviousKey(key);
    } else {
      if (this.orientation() === "horizontal") {
        return this.getNextKey(key);
      }
      return undefined;
    }
  }
  getKeyAbove(key) {
    if (this.orientation() === "vertical") {
      return this.getPreviousKey(key);
    }
    return undefined;
  }
  getKeyBelow(key) {
    if (this.orientation() === "vertical") {
      return this.getNextKey(key);
    }
    return undefined;
  }
  getFirstKey() {
    let key = this.collection().getFirstKey();
    if (key == null) {
      return;
    }
    const item = this.collection().getItem(key);
    if (item?.disabled) {
      key = this.getNextKey(key);
    }
    return key;
  }
  getLastKey() {
    let key = this.collection().getLastKey();
    if (key == null) {
      return;
    }
    const item = this.collection().getItem(key);
    if (item?.disabled) {
      key = this.getPreviousKey(key);
    }
    return key;
  }
  getNextKey(key) {
    let nextKey = key;
    let nextItem;
    do {
      nextKey = this.collection().getKeyAfter(nextKey) ?? this.collection().getFirstKey();
      if (nextKey == null) {
        return;
      }
      nextItem = this.collection().getItem(nextKey);
      if (nextItem == null) {
        return;
      }
    } while (nextItem.disabled);
    return nextKey;
  }
  getPreviousKey(key) {
    let previousKey = key;
    let previousItem;
    do {
      previousKey = this.collection().getKeyBefore(previousKey) ?? this.collection().getLastKey();
      if (previousKey == null) {
        return;
      }
      previousItem = this.collection().getItem(previousKey);
      if (previousItem == null) {
        return;
      }
    } while (previousItem.disabled);
    return previousKey;
  }
}

/**
 * Contains the tabs that are aligned along the edge of the active tab panel.
 */
function TabsList(props) {
  let ref;
  const context = useTabsContext();
  const [local, others] = splitProps(props, ["ref", "onKeyDown", "onMouseDown", "onFocusIn", "onFocusOut"]);
  const {
    direction
  } = useLocale();
  const delegate = new TabsKeyboardDelegate(() => context.listState().collection(), direction, context.orientation);
  const selectableCollection = createSelectableCollection({
    selectionManager: () => context.listState().selectionManager(),
    keyboardDelegate: () => delegate,
    selectOnFocus: () => context.activationMode() === "automatic",
    shouldFocusWrap: false,
    // handled by the keyboard delegate
    disallowEmptySelection: true
  }, () => ref);
  createEffect(() => {
    if (ref == null) {
      return;
    }
    const selectedTab = ref.querySelector(`[data-key="${context.listState().selectedKey()}"]`);
    if (selectedTab != null) {
      context.setSelectedTab(selectedTab);
    }
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    role: "tablist",
    get ["aria-orientation"]() {
      return context.orientation();
    },
    get ["data-orientation"]() {
      return context.orientation();
    },
    get onKeyDown() {
      return composeEventHandlers([local.onKeyDown, selectableCollection.onKeyDown]);
    },
    get onMouseDown() {
      return composeEventHandlers([local.onMouseDown, selectableCollection.onMouseDown]);
    },
    get onFocusIn() {
      return composeEventHandlers([local.onFocusIn, selectableCollection.onFocusIn]);
    },
    get onFocusOut() {
      return composeEventHandlers([local.onFocusOut, selectableCollection.onFocusOut]);
    }
  }, others));
}

/**
 * A set of layered sections of content, known as tab panels, that display one panel of content at a time.
 * `Tabs` contains all the parts of a tabs component and provide context for its children.
 */
function TabsRoot(props) {
  const defaultId = `tabs-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    orientation: "horizontal",
    activationMode: "automatic"
  }, props);
  const [local, others] = splitProps(props, ["value", "defaultValue", "onChange", "orientation", "activationMode", "disabled"]);
  const [items, setItems] = createSignal([]);
  const [selectedTab, setSelectedTab] = createSignal();
  const {
    DomCollectionProvider
  } = createDomCollection({
    items,
    onItemsChange: setItems
  });
  const listState = createSingleSelectListState({
    selectedKey: () => local.value,
    defaultSelectedKey: () => local.defaultValue,
    onSelectionChange: key => local.onChange?.(String(key)),
    dataSource: items
  });
  let lastSelectedKey = listState.selectedKey();
  createEffect(on([() => listState.selectionManager(), () => listState.collection(), () => listState.selectedKey()], ([selectionManager, collection, currentSelectedKey]) => {
    let selectedKey = currentSelectedKey;

    // Ensure a tab is always selected (in case no selected key was specified or if selected item was deleted from collection)
    if (selectionManager.isEmpty() || selectedKey == null || !collection.getItem(selectedKey)) {
      selectedKey = collection.getFirstKey();
      let selectedItem = selectedKey != null ? collection.getItem(selectedKey) : undefined;

      // loop over tabs until we find one that isn't disabled and select that
      while (selectedItem?.disabled && selectedItem.key !== collection.getLastKey()) {
        selectedKey = collection.getKeyAfter(selectedItem.key);
        selectedItem = selectedKey != null ? collection.getItem(selectedKey) : undefined;
      }

      // if this check is true, then every item is disabled, it makes more sense to default to the first key than the last
      if (selectedItem?.disabled && selectedKey === collection.getLastKey()) {
        selectedKey = collection.getFirstKey();
      }

      // directly set selection because replace/toggle selection won't consider disabled keys
      if (selectedKey != null) {
        selectionManager.setSelectedKeys([selectedKey]);
      }
    }

    // If there isn't a focused key yet or the tabs doesn't have focus and the selected key changes,
    // change focused key to the selected key if it exists.
    if (selectionManager.focusedKey() == null || !selectionManager.isFocused() && selectedKey !== lastSelectedKey) {
      selectionManager.setFocusedKey(selectedKey);
    }
    lastSelectedKey = selectedKey;
  }));

  // associated value/trigger ids
  const triggerIdsMap = new Map();

  // associated value/content ids
  const contentIdsMap = new Map();
  const context = {
    isDisabled: () => local.disabled ?? false,
    orientation: () => local.orientation,
    activationMode: () => local.activationMode,
    triggerIdsMap: () => triggerIdsMap,
    contentIdsMap: () => contentIdsMap,
    listState: () => listState,
    selectedTab,
    setSelectedTab,
    generateTriggerId: value => `${others.id}-trigger-${value}`,
    generateContentId: value => `${others.id}-content-${value}`
  };
  return createComponent(DomCollectionProvider, {
    get children() {
      return createComponent(TabsContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            get ["data-orientation"]() {
              return context.orientation();
            }
          }, others));
        }
      });
    }
  });
}

/**
 * The button that activates its associated tab panel.
 */
function TabsTrigger(props) {
  let ref;
  const context = useTabsContext();
  props = mergeDefaultProps({
    type: "button"
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "value", "disabled", "onPointerDown", "onPointerUp", "onClick", "onKeyDown", "onMouseDown", "onFocus"]);
  const id = () => local.id ?? context.generateTriggerId(local.value);
  const isHighlighted = () => context.listState().selectionManager().focusedKey() === local.value;
  const isDisabled = () => local.disabled || context.isDisabled();
  const contentId = () => context.contentIdsMap().get(local.value);
  createDomCollectionItem({
    getItem: () => ({
      ref: () => ref,
      type: "item",
      key: local.value,
      textValue: "",
      // not applicable here
      disabled: isDisabled()
    })
  });
  const selectableItem = createSelectableItem({
    key: () => local.value,
    selectionManager: () => context.listState().selectionManager(),
    disabled: isDisabled
  }, () => ref);
  const onClick = e => {
    // Force focusing the trigger on click on safari.
    if (isWebKit()) {
      focusWithoutScrolling(e.currentTarget);
    }
  };
  createEffect(on([() => local.value, id], ([value, id]) => {
    context.triggerIdsMap().set(value, id);
  }));
  return createComponent(Polymorphic, mergeProps$1({
    as: "button",
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get id() {
      return id();
    },
    role: "tab",
    get tabIndex() {
      return memo(() => !!!isDisabled())() ? selectableItem.tabIndex() : undefined;
    },
    get disabled() {
      return isDisabled();
    },
    get ["aria-selected"]() {
      return selectableItem.isSelected();
    },
    get ["aria-disabled"]() {
      return isDisabled() || undefined;
    },
    get ["aria-controls"]() {
      return memo(() => !!selectableItem.isSelected())() ? contentId() : undefined;
    },
    get ["data-key"]() {
      return selectableItem.dataKey();
    },
    get ["data-orientation"]() {
      return context.orientation();
    },
    get ["data-selected"]() {
      return selectableItem.isSelected() ? "" : undefined;
    },
    get ["data-highlighted"]() {
      return isHighlighted() ? "" : undefined;
    },
    get ["data-disabled"]() {
      return isDisabled() ? "" : undefined;
    },
    get onPointerDown() {
      return composeEventHandlers([local.onPointerDown, selectableItem.onPointerDown]);
    },
    get onPointerUp() {
      return composeEventHandlers([local.onPointerUp, selectableItem.onPointerUp]);
    },
    get onClick() {
      return composeEventHandlers([local.onClick, selectableItem.onClick, onClick]);
    },
    get onKeyDown() {
      return composeEventHandlers([local.onKeyDown, selectableItem.onKeyDown]);
    },
    get onMouseDown() {
      return composeEventHandlers([local.onMouseDown, selectableItem.onMouseDown]);
    },
    get onFocus() {
      return composeEventHandlers([local.onFocus, selectableItem.onFocus]);
    }
  }, others));
}

var index$4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Content: TabsContent,
  Indicator: TabsIndicator,
  List: TabsList,
  Root: TabsRoot,
  Trigger: TabsTrigger
});

const TextFieldContext = createContext();
function useTextFieldContext() {
  const context = useContext(TextFieldContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useTextFieldContext` must be used within a `TextField` component");
  }
  return context;
}

/**
 * The native html input of the textfield.
 */
function TextFieldInput(props) {
  return createComponent(TextFieldInputBase, mergeProps$1({
    type: "text"
  }, props));
}
function TextFieldInputBase(props) {
  const formControlContext = useFormControlContext();
  const context = useTextFieldContext();
  props = mergeDefaultProps({
    id: context.generateId("input")
  }, props);
  const [local, formControlFieldProps, others] = splitProps(props, ["onInput"], FORM_CONTROL_FIELD_PROP_NAMES);
  const {
    fieldProps
  } = createFormControlField(formControlFieldProps);
  return createComponent(Polymorphic, mergeProps$1({
    as: "input",
    get id() {
      return fieldProps.id();
    },
    get name() {
      return formControlContext.name();
    },
    get value() {
      return context.value();
    },
    get required() {
      return formControlContext.isRequired();
    },
    get disabled() {
      return formControlContext.isDisabled();
    },
    get readonly() {
      return formControlContext.isReadOnly();
    },
    get ["aria-label"]() {
      return fieldProps.ariaLabel();
    },
    get ["aria-labelledby"]() {
      return fieldProps.ariaLabelledBy();
    },
    get ["aria-describedby"]() {
      return fieldProps.ariaDescribedBy();
    },
    get ["aria-invalid"]() {
      return formControlContext.validationState() === "invalid" || undefined;
    },
    get ["aria-required"]() {
      return formControlContext.isRequired() || undefined;
    },
    get ["aria-disabled"]() {
      return formControlContext.isDisabled() || undefined;
    },
    get ["aria-readonly"]() {
      return formControlContext.isReadOnly() || undefined;
    },
    onInput: e => {
      const target = e.target;
      if (target.value === context.value()) return;
      composeEventHandlers([local.onInput, context.onInput]);
    }
  }, () => formControlContext.dataset(), others));
}

/**
 * A text input that allow users to input custom text entries with a keyboard.
 */
function TextFieldRoot(props) {
  let ref;
  const defaultId = `textfield-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, formControlProps, others] = splitProps(props, ["ref", "value", "defaultValue", "onChange"], FORM_CONTROL_PROP_NAMES);
  const [value, setValue] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue,
    onChange: value => local.onChange?.(value)
  });
  const {
    formControlContext
  } = createFormControl(formControlProps);
  createFormResetListener(() => ref, () => setValue(local.defaultValue ?? ""));
  const onInput = e => {
    if (formControlContext.isReadOnly() || formControlContext.isDisabled()) {
      return;
    }
    const target = e.target;
    setValue(target.value);

    // Unlike in React, inputs `value` can be out of sync with our value state.
    // even if an input is controlled (ex: `<input value="foo" />`,
    // typing on the input will change its internal `value`.
    //
    // To prevent this, we need to force the input `value` to be in sync with the text field value state.
    target.value = value() ?? "";
  };
  const context = {
    value,
    generateId: createGenerateId(() => access(formControlProps.id)),
    onInput
  };
  return createComponent(FormControlContext.Provider, {
    value: formControlContext,
    get children() {
      return createComponent(TextFieldContext.Provider, {
        value: context,
        get children() {
          return createComponent(Polymorphic, mergeProps$1({
            as: "div",
            ref(r$) {
              const _ref$ = mergeRefs(el => ref = el, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "group",
            get id() {
              return access(formControlProps.id);
            }
          }, () => formControlContext.dataset(), others));
        }
      });
    }
  });
}

/**
 * The native html textarea of the textfield.
 */
function TextFieldTextArea(props) {
  let ref;
  const context = useTextFieldContext();
  props = mergeDefaultProps({
    id: context.generateId("textarea")
  }, props);
  const [local, others] = splitProps(props, ["ref", "autoResize", "submitOnEnter", "onKeyPress"]);
  createEffect(on([() => ref, () => local.autoResize, () => context.value()], ([ref, autoResize]) => {
    if (!ref || !autoResize) {
      return;
    }
    adjustHeight(ref);
  }));
  const onKeyPress = event => {
    if (ref && local.submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      if (ref.form) {
        ref.form.requestSubmit();
        event.preventDefault();
      }
    }
  };
  return createComponent(TextFieldInputBase, mergeProps$1({
    as: "textarea",
    get ["aria-multiline"]() {
      return local.submitOnEnter ? "false" : undefined;
    },
    get onKeyPress() {
      return composeEventHandlers([local.onKeyPress, onKeyPress]);
    },
    ref(r$) {
      const _ref$ = mergeRefs(el => ref = el, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    }
  }, others));
}

/**
 * Adjust the height of the textarea based on its text value.
 */
function adjustHeight(el) {
  const prevAlignment = el.style.alignSelf;
  const prevOverflow = el.style.overflow;

  // Firefox scroll position is lost when `overflow: 'hidden'` is applied, so we skip applying it.
  // The measure/applied height is also incorrect/reset if we turn on and off
  // overflow: hidden in Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1787062
  const isFirefox = ("MozAppearance" in el.style);
  if (!isFirefox) {
    el.style.overflow = "hidden";
  }
  el.style.alignSelf = "start";
  el.style.height = "auto";

  // offsetHeight - clientHeight accounts for the border/padding.
  el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  el.style.overflow = prevOverflow;
  el.style.alignSelf = prevAlignment;
}

var index$3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Description: FormControlDescription,
  ErrorMessage: FormControlErrorMessage,
  Input: TextFieldInput,
  Label: FormControlLabel,
  Root: TextFieldRoot,
  TextArea: TextFieldTextArea
});

/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/tree/main/packages/%40react-aria/toast/intl
 */

const TOAST_HOTKEY_PLACEHOLDER = "{hotkey}";
const TOAST_INTL_MESSAGES = {
  "ar-AE": {
    close: "إغلاق",
    notifications: `(${TOAST_HOTKEY_PLACEHOLDER}) ` + "إشعارات"
  },
  "bg-BG": {
    close: "Затвори",
    notifications: `Известия (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "cs-CZ": {
    close: "Zavřít",
    notifications: `Upozornění (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "da-DK": {
    close: "Luk",
    notifications: `Påmindelser (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "de-DE": {
    close: "Schließen",
    notifications: `Benachrichtigungen (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "el-GR": {
    close: "Κλείσιμο",
    notifications: `Ειδοποιήσεις (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "en-US": {
    close: "Close",
    notifications: `Notifications (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "es-ES": {
    close: "Cerrar",
    notifications: `Notificaciones (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "et-EE": {
    close: "Sule",
    notifications: `Teated (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "fi-FI": {
    close: "Sulje",
    notifications: `Ilmoitukset (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "fr-FR": {
    close: "Fermer",
    notifications: `Notifications (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "he-IL": {
    close: "סגור",
    notifications: `(${TOAST_HOTKEY_PLACEHOLDER}) ` + "התראות"
  },
  "hr-HR": {
    close: "Zatvori",
    notifications: `Obavijesti (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "hu-HU": {
    close: "Bezárás",
    notifications: `Értesítések (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "it-IT": {
    close: "Chiudi",
    notifications: `Notifiche (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "ja-JP": {
    close: "閉じる",
    notifications: `通知 (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "ko-KR": {
    close: "닫기",
    notifications: `알림 (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "lt-LT": {
    close: "Uždaryti",
    notifications: `Pranešimai (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "lv-LV": {
    close: "Aizvērt",
    notifications: `Paziņojumi (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "nb-NO": {
    close: "Lukk",
    notifications: `Varsler (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "nl-NL": {
    close: "Sluiten",
    notifications: `Meldingen (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "pl-PL": {
    close: "Zamknij",
    notifications: `Powiadomienia (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "pt-BR": {
    close: "Fechar",
    notifications: `Notificações (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "pt-PT": {
    close: "Fechar",
    notifications: `Notificações (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "ro-RO": {
    close: "Închideţi",
    notifications: `Notificări (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "ru-RU": {
    close: "Закрыть",
    notifications: `Уведомления (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "sk-SK": {
    close: "Zatvoriť",
    notifications: `Oznámenia (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "sl-SI": {
    close: "Zapri",
    notifications: `Obvestila (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "sr-SP": {
    close: "Zatvori",
    notifications: `Obaveštenja (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "sv-SE": {
    close: "Stäng",
    notifications: `Aviseringar (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "tr-TR": {
    close: "Kapat",
    notifications: `Bildirimler (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "uk-UA": {
    close: "Закрити",
    notifications: `Сповіщення (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "zh-CN": {
    close: "关闭",
    notifications: `通知 (${TOAST_HOTKEY_PLACEHOLDER})`
  },
  "zh-TW": {
    close: "關閉",
    notifications: `通知 (${TOAST_HOTKEY_PLACEHOLDER})`
  }
};

const ToastContext = createContext();
function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useToastContext` must be used within a `Toast.Root` component");
  }
  return context;
}

/**
 * The button that closes the toast.
 */
function ToastCloseButton(props) {
  const context = useToastContext();
  const [local, others] = splitProps(props, ["aria-label", "onClick"]);
  const messageFormatter = createMessageFormatter(() => TOAST_INTL_MESSAGES);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.close();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    get ["aria-label"]() {
      return local["aria-label"] || messageFormatter().format("close");
    },
    onClick: onClick
  }, others));
}

/**
 * An optional accessible description to be announced when the toast is open.
 */
function ToastDescription(props) {
  const context = useToastContext();
  props = mergeDefaultProps({
    id: context.generateId("description")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerDescriptionId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get id() {
      return local.id;
    }
  }, others));
}

const ToastRegionContext = createContext();
function useToastRegionContext() {
  const context = useContext(ToastRegionContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useToastRegionContext` must be used within a `Toast.Region` component");
  }
  return context;
}

const _tmpl$$2 = /*#__PURE__*/template(`<ol tabindex="-1">`);
/**
 * The list containing all rendered toasts.
 * Must be inside a `Toast.Region`.
 */
function ToastList(props) {
  let ref;
  const context = useToastRegionContext();
  const [local, others] = splitProps(props, ["ref", "onFocusIn", "onFocusOut", "onPointerMove", "onPointerLeave"]);
  const onFocusIn = e => {
    callHandler(e, local.onFocusIn);
    if (context.pauseOnInteraction() && !context.isPaused()) {
      context.pauseAllTimer();
    }
  };
  const onFocusOut = e => {
    callHandler(e, local.onFocusOut);

    // The newly focused element isn't inside the toast list.
    if (!contains(ref, e.relatedTarget)) {
      context.resumeAllTimer();
    }
  };
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (context.pauseOnInteraction() && !context.isPaused()) {
      context.pauseAllTimer();
    }
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);

    // The current active element isn't inside the toast list.
    if (!contains(ref, getDocument(ref).activeElement)) {
      context.resumeAllTimer();
    }
  };
  createEffect(on([() => ref, () => context.hotkey()], ([ref, hotkey]) => {
    if (isServer) {
      return;
    }
    if (!ref) {
      return;
    }
    const doc = getDocument(ref);
    const onKeyDown = event => {
      const isHotkeyPressed = hotkey.every(key => event[key] || event.code === key);
      if (isHotkeyPressed) {
        focusWithoutScrolling(ref);
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    onCleanup(() => doc.removeEventListener("keydown", onKeyDown));
  }));
  createEffect(() => {
    if (!context.pauseOnPageIdle()) {
      return;
    }
    const win = getWindow(ref);
    win.addEventListener("blur", context.pauseAllTimer);
    win.addEventListener("focus", context.resumeAllTimer);
    onCleanup(() => {
      win.removeEventListener("blur", context.pauseAllTimer);
      win.removeEventListener("focus", context.resumeAllTimer);
    });
  });
  return (() => {
    const _el$ = _tmpl$$2();
    _el$.addEventListener("pointerleave", onPointerLeave);
    _el$.$$pointermove = onPointerMove;
    _el$.$$focusout = onFocusOut;
    _el$.$$focusin = onFocusIn;
    const _ref$ = mergeRefs(el => ref = el, local.ref);
    typeof _ref$ === "function" && use(_ref$, _el$);
    spread(_el$, others, false, true);
    insert(_el$, createComponent(For, {
      get each() {
        return context.toasts();
      },
      children: toast => toast.toastComponent({
        get toastId() {
          return toast.id;
        }
      })
    }));
    return _el$;
  })();
}
delegateEvents(["focusin", "focusout", "pointermove"]);

/**
 * The component that visually represents the toast remaining lifetime.
 * Used to visually show the fill of `Toast.ProgressTrack`.
 */
function ToastProgressFill(props) {
  const rootContext = useToastRegionContext();
  const context = useToastContext();
  const [local, others] = splitProps(props, ["style"]);
  const [lifeTime, setLifeTime] = createSignal(100);
  let totalElapsedTime = 0;
  createEffect(() => {
    if (rootContext.isPaused() || context.isPersistent()) {
      return;
    }
    const intervalId = setInterval(() => {
      const elapsedTime = new Date().getTime() - context.closeTimerStartTime() + totalElapsedTime;
      const life = Math.trunc(100 - elapsedTime / context.duration() * 100);
      setLifeTime(life < 0 ? 0 : life);
    });
    onCleanup(() => {
      totalElapsedTime += new Date().getTime() - context.closeTimerStartTime();
      clearInterval(intervalId);
    });
  });
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get style() {
      return {
        "--kb-toast-progress-fill-width": `${lifeTime()}%`,
        ...local.style
      };
    }
  }, others));
}

/**
 * The component that visually represents the toast lifetime.
 * Act as a container for `Toast.ProgressFill`.
 */
function ToastProgressTrack(props) {
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    "aria-hidden": "true",
    role: "presentation"
  }, props));
}

const _tmpl$$1 = /*#__PURE__*/template(`<div role="region" tabindex="-1">`);
/**
 * The fixed area where toasts appear. Users can jump to by pressing a hotkey.
 * It is up to you to ensure the discoverability of the hotkey for keyboard users.
 */
function ToastRegion(props) {
  const defaultId = `toast-region-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId,
    hotkey: ["altKey", "KeyT"],
    duration: 5000,
    limit: 3,
    swipeDirection: "right",
    swipeThreshold: 50,
    pauseOnInteraction: true,
    pauseOnPageIdle: true,
    topLayer: true
  }, props);
  const [local, others] = splitProps(props, ["style", "hotkey", "duration", "limit", "swipeDirection", "swipeThreshold", "pauseOnInteraction", "pauseOnPageIdle", "topLayer", "aria-label", "regionId"]);
  const toasts = createMemo(() => toastStore.toasts().filter(toast => toast.region === local.regionId).slice(0, local.limit));
  const [isPaused, setIsPaused] = createSignal(false);
  const messageFormatter = createMessageFormatter(() => TOAST_INTL_MESSAGES);
  const hasToasts = () => toasts().length > 0;
  const hotkeyLabel = () => {
    return local.hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
  };
  const ariaLabel = () => {
    const label = local["aria-label"] || messageFormatter().format("notifications", {
      hotkey: hotkeyLabel()
    });
    return label.replace(TOAST_HOTKEY_PLACEHOLDER, hotkeyLabel());
  };
  const topLayerAttr = () => ({
    [DATA_TOP_LAYER_ATTR]: local.topLayer ? "" : undefined
  });
  const context = {
    isPaused,
    toasts,
    hotkey: () => local.hotkey,
    duration: () => local.duration,
    swipeDirection: () => local.swipeDirection,
    swipeThreshold: () => local.swipeThreshold,
    pauseOnInteraction: () => local.pauseOnInteraction,
    pauseOnPageIdle: () => local.pauseOnPageIdle,
    pauseAllTimer: () => setIsPaused(true),
    resumeAllTimer: () => setIsPaused(false),
    generateId: createGenerateId(() => others.id)
  };
  return createComponent(ToastRegionContext.Provider, {
    value: context,
    get children() {
      const _el$ = _tmpl$$1();
      spread(_el$, mergeProps$1({
        get ["aria-label"]() {
          return ariaLabel();
        },
        get style() {
          return {
            "pointer-events": hasToasts() ? local.topLayer ? "auto" : undefined : "none",
            ...local.style
          };
        }
      }, topLayerAttr, others), false, false);
      return _el$;
    }
  });
}

const _tmpl$ = /*#__PURE__*/template(`<li role="status" tabindex="0" aria-atomic="true">`);
const TOAST_SWIPE_START_EVENT = "toast.swipeStart";
const TOAST_SWIPE_MOVE_EVENT = "toast.swipeMove";
const TOAST_SWIPE_CANCEL_EVENT = "toast.swipeCancel";
const TOAST_SWIPE_END_EVENT = "toast.swipeEnd";
function ToastRoot(props) {
  const defaultId = `toast-${createUniqueId()}`;
  const rootContext = useToastRegionContext();
  props = mergeDefaultProps({
    id: defaultId,
    priority: "high"
  }, props);
  const [local, others] = splitProps(props, ["ref", "toastId", "style", "priority", "duration", "persistent", "onPause", "onResume", "onSwipeStart", "onSwipeMove", "onSwipeCancel", "onSwipeEnd", "onEscapeKeyDown", "onKeyDown", "onPointerDown", "onPointerMove", "onPointerUp"]);
  const [isOpen, setIsOpen] = createSignal(true);
  const [titleId, setTitleId] = createSignal();
  const [descriptionId, setDescriptionId] = createSignal();
  const [isAnimationEnabled, setIsAnimationEnabled] = createSignal(true);
  const presence = createPresence(isOpen);
  const duration = createMemo(() => local.duration || rootContext.duration());
  let closeTimerId;
  let closeTimerStartTime = 0;
  let closeTimerRemainingTime = duration();
  let pointerStart = null;
  let swipeDelta = null;
  const close = () => {
    setIsOpen(false);

    // Restore animation for the exit phase, which have been disabled if it's a toast update.
    setIsAnimationEnabled(true);
  };
  const deleteToast = () => {
    toastStore.remove(local.toastId);
  };
  const startTimer = duration => {
    if (!duration || local.persistent) {
      return;
    }
    window.clearTimeout(closeTimerId);
    closeTimerStartTime = new Date().getTime();
    closeTimerId = window.setTimeout(close, duration);
  };
  const resumeTimer = () => {
    startTimer(closeTimerRemainingTime);
    local.onResume?.();
  };
  const pauseTimer = () => {
    const elapsedTime = new Date().getTime() - closeTimerStartTime;
    closeTimerRemainingTime = closeTimerRemainingTime - elapsedTime;
    window.clearTimeout(closeTimerId);
    local.onPause?.();
  };
  const onKeyDown = e => {
    callHandler(e, local.onKeyDown);
    if (e.key !== "Escape") {
      return;
    }
    local.onEscapeKeyDown?.(e);
    if (!e.defaultPrevented) {
      close();
    }
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    if (e.button !== 0) {
      return;
    }
    pointerStart = {
      x: e.clientX,
      y: e.clientY
    };
  };
  const onPointerMove = e => {
    callHandler(e, local.onPointerMove);
    if (!pointerStart) {
      return;
    }
    const x = e.clientX - pointerStart.x;
    const y = e.clientY - pointerStart.y;
    const hasSwipeMoveStarted = Boolean(swipeDelta);
    const isHorizontalSwipe = ["left", "right"].includes(rootContext.swipeDirection());
    const clamp = ["left", "up"].includes(rootContext.swipeDirection()) ? Math.min : Math.max;
    const clampedX = isHorizontalSwipe ? clamp(0, x) : 0;
    const clampedY = !isHorizontalSwipe ? clamp(0, y) : 0;
    const moveStartBuffer = e.pointerType === "touch" ? 10 : 2;
    const delta = {
      x: clampedX,
      y: clampedY
    };
    const eventDetail = {
      originalEvent: e,
      delta
    };
    if (hasSwipeMoveStarted) {
      swipeDelta = delta;
      handleAndDispatchCustomEvent(TOAST_SWIPE_MOVE_EVENT, local.onSwipeMove, eventDetail);
      const {
        x,
        y
      } = delta;
      e.currentTarget.setAttribute("data-swipe", "move");
      e.currentTarget.style.setProperty("--kb-toast-swipe-move-x", `${x}px`);
      e.currentTarget.style.setProperty("--kb-toast-swipe-move-y", `${y}px`);
    } else if (isDeltaInDirection(delta, rootContext.swipeDirection(), moveStartBuffer)) {
      swipeDelta = delta;
      handleAndDispatchCustomEvent(TOAST_SWIPE_START_EVENT, local.onSwipeStart, eventDetail);
      e.currentTarget.setAttribute("data-swipe", "start");
      e.target.setPointerCapture(e.pointerId);
    } else if (Math.abs(x) > moveStartBuffer || Math.abs(y) > moveStartBuffer) {
      // User is swiping in wrong direction, so we disable swipe gesture
      // for the current pointer down interaction
      pointerStart = null;
    }
  };
  const onPointerUp = e => {
    callHandler(e, local.onPointerUp);
    const delta = swipeDelta;
    const target = e.target;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    swipeDelta = null;
    pointerStart = null;
    if (delta) {
      const toast = e.currentTarget;
      const eventDetail = {
        originalEvent: e,
        delta
      };
      if (isDeltaInDirection(delta, rootContext.swipeDirection(), rootContext.swipeThreshold())) {
        handleAndDispatchCustomEvent(TOAST_SWIPE_END_EVENT, local.onSwipeEnd, eventDetail);
        const {
          x,
          y
        } = delta;
        e.currentTarget.setAttribute("data-swipe", "end");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-move-x");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-move-y");
        e.currentTarget.style.setProperty("--kb-toast-swipe-end-x", `${x}px`);
        e.currentTarget.style.setProperty("--kb-toast-swipe-end-y", `${y}px`);
        close();
      } else {
        handleAndDispatchCustomEvent(TOAST_SWIPE_CANCEL_EVENT, local.onSwipeCancel, eventDetail);
        e.currentTarget.setAttribute("data-swipe", "cancel");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-move-x");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-move-y");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-end-x");
        e.currentTarget.style.removeProperty("--kb-toast-swipe-end-y");
      }

      // Prevent click event from triggering on items within the toast when
      // pointer up is part of a swipe gesture
      toast.addEventListener("click", event => event.preventDefault(), {
        once: true
      });
    }
  };
  onMount(() => {
    // Disable animation for updated toast.
    if (rootContext.toasts().find(toast => toast.id === local.toastId && toast.update)) {
      setIsAnimationEnabled(false);
    }
  });
  createEffect(on(() => rootContext.isPaused(), isPaused => {
    if (isPaused) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, {
    defer: true
  }));

  // start timer when toast opens or duration changes.
  // we include `open` in deps because closed !== unmounted when animating,
  // so it could reopen before being completely unmounted
  createEffect(on([isOpen, duration], ([isOpen, duration]) => {
    if (isOpen && !rootContext.isPaused()) {
      startTimer(duration);
    }
  }));
  createEffect(on(() => toastStore.get(local.toastId)?.dismiss, dismiss => dismiss && close()));
  createEffect(on(() => presence.isPresent(), isPresent => !isPresent && deleteToast()));
  const context = {
    close,
    duration,
    isPersistent: () => local.persistent ?? false,
    closeTimerStartTime: () => closeTimerStartTime,
    generateId: createGenerateId(() => others.id),
    registerTitleId: createRegisterId(setTitleId),
    registerDescriptionId: createRegisterId(setDescriptionId)
  };
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(ToastContext.Provider, {
        value: context,
        get children() {
          const _el$ = _tmpl$();
          _el$.$$pointerup = onPointerUp;
          _el$.$$pointermove = onPointerMove;
          _el$.$$pointerdown = onPointerDown;
          _el$.$$keydown = onKeyDown;
          const _ref$ = mergeRefs(presence.setRef, local.ref);
          typeof _ref$ === "function" && use(_ref$, _el$);
          spread(_el$, mergeProps$1({
            get style() {
              return {
                animation: isAnimationEnabled() ? undefined : "none",
                "user-select": "none",
                "touch-action": "none",
                ...local.style
              };
            },
            get ["aria-live"]() {
              return local.priority === "high" ? "assertive" : "polite";
            },
            get ["aria-labelledby"]() {
              return titleId();
            },
            get ["aria-describedby"]() {
              return descriptionId();
            },
            get ["data-opened"]() {
              return isOpen() ? "" : undefined;
            },
            get ["data-closed"]() {
              return !isOpen() ? "" : undefined;
            },
            get ["data-swipe-direction"]() {
              return rootContext.swipeDirection();
            }
          }, others), false, false);
          return _el$;
        }
      });
    }
  });
}
function isDeltaInDirection(delta, direction, threshold = 0) {
  const deltaX = Math.abs(delta.x);
  const deltaY = Math.abs(delta.y);
  const isDeltaX = deltaX > deltaY;
  if (direction === "left" || direction === "right") {
    return isDeltaX && deltaX > threshold;
  } else {
    return !isDeltaX && deltaY > threshold;
  }
}
function handleAndDispatchCustomEvent(name, handler, detail) {
  const currentTarget = detail.originalEvent.currentTarget;
  const event = new CustomEvent(name, {
    bubbles: true,
    cancelable: true,
    detail
  });
  if (handler) {
    currentTarget.addEventListener(name, handler, {
      once: true
    });
  }
  currentTarget.dispatchEvent(event);
}
delegateEvents(["keydown", "pointerdown", "pointermove", "pointerup"]);

/**
 * An accessible title to be announced when the toast is open.
 */
function ToastTitle(props) {
  const context = useToastContext();
  props = mergeDefaultProps({
    id: context.generateId("title")
  }, props);
  const [local, others] = splitProps(props, ["id"]);
  createEffect(() => onCleanup(context.registerTitleId(local.id)));
  return createComponent(Polymorphic, mergeProps$1({
    as: "div",
    get id() {
      return local.id;
    }
  }, others));
}

var index$2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  CloseButton: ToastCloseButton,
  Description: ToastDescription,
  List: ToastList,
  ProgressFill: ToastProgressFill,
  ProgressTrack: ToastProgressTrack,
  Region: ToastRegion,
  Root: ToastRoot,
  Title: ToastTitle
});

/**
 * A two-state button that allow users to toggle a selection on or off.
 * This component is based on the [WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
 */
function ToggleButtonRoot(props) {
  const [local, others] = splitProps(props, ["children", "pressed", "defaultPressed", "onChange", "onClick"]);
  const state = createToggleState({
    isSelected: () => local.pressed,
    defaultIsSelected: () => local.defaultPressed,
    onSelectedChange: selected => local.onChange?.(selected),
    isDisabled: () => others.disabled
  });
  const onClick = e => {
    callHandler(e, local.onClick);
    state.toggle();
  };
  return createComponent(ButtonRoot, mergeProps$1({
    get ["aria-pressed"]() {
      return state.isSelected();
    },
    get ["data-pressed"]() {
      return state.isSelected() ? "" : undefined;
    },
    onClick: onClick
  }, others, {
    get children() {
      return createComponent(ToggleButtonRootChild, {
        get state() {
          return {
            pressed: state.isSelected
          };
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
}
function ToggleButtonRootChild(props) {
  const resolvedChildren = children(() => {
    const body = props.children;
    return isFunction(body) ? body(props.state) : body;
  });
  return memo(resolvedChildren);
}

var index$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Root: ToggleButtonRoot
});

const TooltipContext = createContext();
function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useTooltipContext` must be used within a `Tooltip` component");
  }
  return context;
}

/**
 * Contains the content to be rendered when the tooltip is open.
 */
function TooltipContent(props) {
  const context = useTooltipContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "style"]);
  createEffect(() => onCleanup(context.registerContentId(others.id)));
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(PopperPositioner, {
        get children() {
          return createComponent(DismissableLayer, mergeProps$1({
            ref(r$) {
              const _ref$ = mergeRefs(el => {
                context.setContentRef(el);
                context.contentPresence.setRef(el);
              }, local.ref);
              typeof _ref$ === "function" && _ref$(r$);
            },
            role: "tooltip",
            disableOutsidePointerEvents: false,
            get style() {
              return {
                "--kb-tooltip-content-transform-origin": "var(--kb-popper-content-transform-origin)",
                position: "relative",
                ...local.style
              };
            },
            onFocusOutside: e => e.preventDefault(),
            onDismiss: () => context.hideTooltip(true)
          }, () => context.dataset(), others));
        }
      });
    }
  });
}

/**
 * Portals its children into the `body` when the tooltip is open.
 */
function TooltipPortal(props) {
  const context = useTooltipContext();
  return createComponent(Show, {
    get when() {
      return context.contentPresence.isPresent();
    },
    get children() {
      return createComponent(Portal, props);
    }
  });
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/84e97943ad637a582c01c9b56d880cd95f595737/packages/ariakit/src/hovercard/__utils/polygon.ts
 * https://github.com/ariakit/ariakit/blob/f2a96973de523d67e41eec983263936c489ef3e2/packages/ariakit/src/hovercard/__utils/debug-polygon.ts
 */

/**
 * Construct a polygon based on the floating element placement relative to the anchor.
 */
function getTooltipSafeArea(placement, anchorEl, floatingEl) {
  const basePlacement = placement.split("-")[0];
  const anchorRect = anchorEl.getBoundingClientRect();
  const floatingRect = floatingEl.getBoundingClientRect();
  const polygon = [];
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const anchorCenterY = anchorRect.top + anchorRect.height / 2;
  switch (basePlacement) {
    case "top":
      polygon.push([anchorRect.left, anchorCenterY]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([anchorRect.right, anchorCenterY]);
      break;
    case "right":
      polygon.push([anchorCenterX, anchorRect.top]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([anchorCenterX, anchorRect.bottom]);
      break;
    case "bottom":
      polygon.push([anchorRect.left, anchorCenterY]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([anchorRect.right, anchorCenterY]);
      break;
    case "left":
      polygon.push([anchorCenterX, anchorRect.top]);
      polygon.push([floatingRect.right, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.top]);
      polygon.push([floatingRect.left, floatingRect.bottom]);
      polygon.push([floatingRect.right, floatingRect.bottom]);
      polygon.push([anchorCenterX, anchorRect.bottom]);
      break;
  }
  return polygon;
}

const tooltips = {};
let tooltipsCounter = 0;
let globalWarmedUp = false;
let globalWarmUpTimeout;
let globalCoolDownTimeout;
/**
 * A popup that displays information related to an element
 * when the element receives keyboard focus or the mouse hovers over it.
 */
function TooltipRoot(props) {
  const defaultId = `tooltip-${createUniqueId()}`;

  // This is not the DOM id.
  const tooltipId = `${++tooltipsCounter}`;
  props = mergeDefaultProps({
    id: defaultId,
    openDelay: 700,
    closeDelay: 300
  }, props);
  const [local, others] = splitProps(props, ["id", "open", "defaultOpen", "onOpenChange", "disabled", "triggerOnFocusOnly", "openDelay", "closeDelay", "ignoreSafeArea", "forceMount"]);
  let closeTimeoutId;
  const [contentId, setContentId] = createSignal();
  const [triggerRef, setTriggerRef] = createSignal();
  const [contentRef, setContentRef] = createSignal();
  const [currentPlacement, setCurrentPlacement] = createSignal(others.placement);
  const disclosureState = createDisclosureState({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const contentPresence = createPresence(() => local.forceMount || disclosureState.isOpen());
  const ensureTooltipEntry = () => {
    tooltips[tooltipId] = hideTooltip;
  };
  const closeOpenTooltips = () => {
    for (const hideTooltipId in tooltips) {
      if (hideTooltipId !== tooltipId) {
        tooltips[hideTooltipId](true);
        delete tooltips[hideTooltipId];
      }
    }
  };
  const hideTooltip = (immediate = false) => {
    if (isServer) {
      return;
    }
    if (immediate || local.closeDelay && local.closeDelay <= 0) {
      window.clearTimeout(closeTimeoutId);
      closeTimeoutId = undefined;
      disclosureState.close();
    } else if (!closeTimeoutId) {
      closeTimeoutId = window.setTimeout(() => {
        closeTimeoutId = undefined;
        disclosureState.close();
      }, local.closeDelay);
    }
    window.clearTimeout(globalWarmUpTimeout);
    globalWarmUpTimeout = undefined;
    if (globalWarmedUp) {
      window.clearTimeout(globalCoolDownTimeout);
      globalCoolDownTimeout = window.setTimeout(() => {
        delete tooltips[tooltipId];
        globalCoolDownTimeout = undefined;
        globalWarmedUp = false;
      }, local.closeDelay);
    }
  };
  const showTooltip = () => {
    if (isServer) {
      return;
    }
    clearTimeout(closeTimeoutId);
    closeTimeoutId = undefined;
    closeOpenTooltips();
    ensureTooltipEntry();
    globalWarmedUp = true;
    disclosureState.open();
    window.clearTimeout(globalWarmUpTimeout);
    globalWarmUpTimeout = undefined;
    window.clearTimeout(globalCoolDownTimeout);
    globalCoolDownTimeout = undefined;
  };
  const warmupTooltip = () => {
    if (isServer) {
      return;
    }
    closeOpenTooltips();
    ensureTooltipEntry();
    if (!disclosureState.isOpen() && !globalWarmUpTimeout && !globalWarmedUp) {
      globalWarmUpTimeout = window.setTimeout(() => {
        globalWarmUpTimeout = undefined;
        globalWarmedUp = true;
        showTooltip();
      }, local.openDelay);
    } else if (!disclosureState.isOpen()) {
      showTooltip();
    }
  };
  const openTooltip = (immediate = false) => {
    if (isServer) {
      return;
    }
    if (!immediate && local.openDelay && local.openDelay > 0 && !closeTimeoutId) {
      warmupTooltip();
    } else {
      showTooltip();
    }
  };
  const cancelOpening = () => {
    if (isServer) {
      return;
    }
    window.clearTimeout(globalWarmUpTimeout);
    globalWarmUpTimeout = undefined;
    globalWarmedUp = false;
  };
  const cancelClosing = () => {
    if (isServer) {
      return;
    }
    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = undefined;
  };
  const isTargetOnTooltip = target => {
    return contains(triggerRef(), target) || contains(contentRef(), target);
  };
  const getPolygonSafeArea = placement => {
    const triggerEl = triggerRef();
    const contentEl = contentRef();
    if (!triggerEl || !contentEl) {
      return;
    }
    return getTooltipSafeArea(placement, triggerEl, contentEl);
  };
  const onHoverOutside = event => {
    const target = event.target;

    // Don't close if the mouse is moving through valid tooltip element.
    if (isTargetOnTooltip(target)) {
      cancelClosing();
      return;
    }
    if (!local.ignoreSafeArea) {
      const polygon = getPolygonSafeArea(currentPlacement());

      //Don't close if the current's event mouse position is inside the polygon safe area.
      if (polygon && isPointInPolygon(getEventPoint(event), polygon)) {
        cancelClosing();
        return;
      }
    }

    // If there's already a scheduled timeout to hide the tooltip, we do nothing.
    if (closeTimeoutId) {
      return;
    }

    // Otherwise, hide the tooltip after the close delay.
    hideTooltip();
  };
  createEffect(() => {
    if (isServer) {
      return;
    }
    if (!disclosureState.isOpen()) {
      return;
    }
    const doc = getDocument();

    // Checks whether the mouse is moving outside the tooltip.
    // If yes, hide the tooltip after the close delay.
    doc.addEventListener("pointermove", onHoverOutside, true);
    onCleanup(() => {
      doc.removeEventListener("pointermove", onHoverOutside, true);
    });
  });

  // Close the tooltip if the trigger is scrolled.
  createEffect(() => {
    const trigger = triggerRef();
    if (!trigger || !disclosureState.isOpen()) {
      return;
    }
    const handleScroll = event => {
      const target = event.target;
      if (contains(target, trigger)) {
        hideTooltip(true);
      }
    };
    const win = getWindow();
    win.addEventListener("scroll", handleScroll, {
      capture: true
    });
    onCleanup(() => {
      win.removeEventListener("scroll", handleScroll, {
        capture: true
      });
    });
  });
  onCleanup(() => {
    clearTimeout(closeTimeoutId);
    const tooltip = tooltips[tooltipId];
    if (tooltip) {
      delete tooltips[tooltipId];
    }
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isDisabled: () => local.disabled ?? false,
    triggerOnFocusOnly: () => local.triggerOnFocusOnly ?? false,
    contentId,
    contentPresence,
    openTooltip,
    hideTooltip,
    cancelOpening,
    generateId: createGenerateId(() => props.id),
    registerContentId: createRegisterId(setContentId),
    isTargetOnTooltip,
    setTriggerRef,
    setContentRef
  };
  return createComponent(TooltipContext.Provider, {
    value: context,
    get children() {
      return createComponent(PopperRoot, mergeProps$1({
        anchorRef: triggerRef,
        contentRef: contentRef,
        onCurrentPlacementChange: setCurrentPlacement
      }, others));
    }
  });
}

/**
 * The button that opens the tooltip when hovered.
 */
function TooltipTrigger(props) {
  let ref;
  const context = useTooltipContext();
  const [local, others] = splitProps(props, ["ref", "onPointerEnter", "onPointerLeave", "onPointerDown", "onClick", "onFocus", "onBlur", "onTouchStart"]);
  let isPointerDown = false;
  let isHovered = false;
  let isFocused = false;
  const handlePointerUp = () => {
    isPointerDown = false;
  };
  const handleShow = () => {
    if (!context.isOpen() && (isHovered || isFocused)) {
      context.openTooltip(isFocused);
    }
  };
  const handleHide = immediate => {
    if (context.isOpen() && !isHovered && !isFocused) {
      context.hideTooltip(immediate);
    }
  };
  const onPointerEnter = e => {
    callHandler(e, local.onPointerEnter);
    if (e.pointerType === "touch" || context.triggerOnFocusOnly() || context.isDisabled() || e.defaultPrevented) {
      return;
    }
    isHovered = true;
    handleShow();
  };
  const onPointerLeave = e => {
    callHandler(e, local.onPointerLeave);
    if (e.pointerType === "touch") {
      return;
    }

    // No matter how the trigger is left, we should close the tooltip.
    isHovered = false;
    isFocused = false;
    if (context.isOpen()) {
      handleHide();
    } else {
      context.cancelOpening();
    }
  };
  const onPointerDown = e => {
    callHandler(e, local.onPointerDown);
    isPointerDown = true;
    getDocument(ref).addEventListener("pointerup", handlePointerUp, {
      once: true
    });
  };
  const onClick = e => {
    callHandler(e, local.onClick);

    // No matter how the trigger is left, we should close the tooltip.
    isHovered = false;
    isFocused = false;
    handleHide(true);
  };
  const onFocus = e => {
    callHandler(e, local.onFocus);
    if (context.isDisabled() || e.defaultPrevented || isPointerDown) {
      return;
    }
    isFocused = true;
    handleShow();
  };
  const onBlur = e => {
    callHandler(e, local.onBlur);
    const relatedTarget = e.relatedTarget;
    if (context.isTargetOnTooltip(relatedTarget)) {
      return;
    }

    // No matter how the trigger is left, we should close the tooltip.
    isHovered = false;
    isFocused = false;
    handleHide(true);
  };
  onCleanup(() => {
    if (isServer) {
      return;
    }
    getDocument(ref).removeEventListener("pointerup", handlePointerUp);
  });

  // We purposefully avoid using Kobalte `Button` here because tooltip triggers can be any element
  // and should not always be announced as a button to screen readers.
  return createComponent(Polymorphic, mergeProps$1({
    as: "button",
    ref(r$) {
      const _ref$ = mergeRefs(el => {
        context.setTriggerRef(el);
        ref = el;
      }, local.ref);
      typeof _ref$ === "function" && _ref$(r$);
    },
    get ["aria-describedby"]() {
      return memo(() => !!context.isOpen())() ? context.contentId() : undefined;
    },
    onPointerEnter: onPointerEnter,
    onPointerLeave: onPointerLeave,
    onPointerDown: onPointerDown,
    onClick: onClick,
    onFocus: onFocus,
    onBlur: onBlur
  }, () => context.dataset(), others));
}

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Arrow: PopperArrow,
  Content: TooltipContent,
  Portal: TooltipPortal,
  Root: TooltipRoot,
  Trigger: TooltipTrigger
});

export { index$s as Accordion, index$r as Alert, index$p as AlertDialog, As, index$n as Breadcrumbs, index$u as Button, COLOR_MODE_STORAGE_KEY, COMMON_INTL_MESSAGES, index$m as Calendar, index$l as Checkbox, index$t as Collapsible, ColorModeContext, ColorModeProvider, ColorModeScript, index$j as Combobox, index$h as ContextMenu, DATA_LIVE_ANNOUNCER_ATTR, index$g as DatePicker, index$q as Dialog, index$f as DropdownMenu, FORM_CONTROL_FIELD_PROP_NAMES, FORM_CONTROL_PROP_NAMES, FormControlContext, FormControlDescription, FormControlErrorMessage, FormControlLabel, index$e as HoverCard, I18nProvider, index$d as Image, index$o as Link, ListCollection, ListKeyboardDelegate, index$k as Listbox, index$c as Pagination, Polymorphic, index$b as Popover, index$a as Progress, RTL_LANGS, index$9 as RadioGroup, index$8 as Select, Selection, SelectionManager, index$i as Separator, index$7 as Skeleton, index$6 as Slider, index$5 as Switch, index$4 as Tabs, index$3 as TextField, index$2 as Toast, index$1 as ToggleButton, index as Tooltip, announce, ariaHideOutside, clearAnnouncer, cookieStorageManager, cookieStorageManagerSSR, createCollator, createCollection, createControllableArraySignal, createControllableBooleanSignal, createControllableSetSignal, createControllableSignal, createCookieStorageManager, createDateFormatter, createDefaultLocale, createDisclosureState, createEscapeKeyDown, createFilter, createFocusScope, createFormControl, createFormControlField, createFormResetListener, createHideOutside, createInteractOutside, createListState, createLocalStorageManager, createMessageFormatter, createMultipleSelectionState, createNumberFormatter, createPresence, createPreventScroll, createRegisterId, createSelectableCollection, createSelectableItem, createSelectableList, createSingleSelectListState, createTagName, createToggleState, createTransition, createTypeSelect, destroyAnnouncer, getDefaultLocale, getItemCount, getReadingDirection, isRTL, localStorageManager, toaster, useColorMode, useColorModeValue, useFormControlContext, useLocale };
//# sourceMappingURL=index.js.map

/**
 * Triggers a "touch" event on an element.
 */
declare function triggerTouch(element: Document | Element | Window | Node, opts?: any): Promise<void>;

declare function setupMatchMediaMock(): void;

declare function installPointerEvent(): void;
declare function createPointerEvent(type: any, opts: any): Event;

export { createPointerEvent, installPointerEvent, setupMatchMediaMock, triggerTouch };

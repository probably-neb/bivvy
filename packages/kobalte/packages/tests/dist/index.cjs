'use strict';

var testingLibrary = require('@solidjs/testing-library');

// src/events.ts

// src/utils.ts
function installPointerEvent() {
  beforeAll(() => {
    global.PointerEvent = class FakePointerEvent extends MouseEvent {
      _init;
      constructor(name, init) {
        super(name, init);
        this._init = init;
      }
      get pointerType() {
        return this._init.pointerType;
      }
      get pointerId() {
        return this._init.pointerId;
      }
      get pageX() {
        return this._init.pageX;
      }
      get pageY() {
        return this._init.pageY;
      }
      get width() {
        return this._init.width;
      }
      get height() {
        return this._init.height;
      }
    };
  });
  afterAll(() => {
    delete global.PointerEvent;
  });
}
function createPointerEvent(type, opts) {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(
    evt,
    {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      button: opts.button || 0,
      width: 1,
      height: 1
    },
    opts
  );
  return evt;
}

// src/events.ts
async function triggerTouch(element, opts) {
  testingLibrary.fireEvent(
    element,
    createPointerEvent("pointerdown", { pointerId: 1, pointerType: "touch", ...opts })
  );
  await Promise.resolve();
  testingLibrary.fireEvent(
    element,
    createPointerEvent("pointerup", { pointerId: 1, pointerType: "touch", ...opts })
  );
  await Promise.resolve();
}

// src/mocks.ts
function setupMatchMediaMock() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      // deprecated
      removeListener: jest.fn(),
      // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
}

exports.createPointerEvent = createPointerEvent;
exports.installPointerEvent = installPointerEvent;
exports.setupMatchMediaMock = setupMatchMediaMock;
exports.triggerTouch = triggerTouch;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.cjs.map
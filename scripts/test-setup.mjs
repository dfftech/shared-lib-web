// test-setup.mjs
// Prepares Node's built-in test runner (node --test) for React component tests:
//   1. a browser-like page from jsdom (window, document, localStorage, events ...)
//   2. module hooks for packages written for bundlers (CSS imports, imports without extension)
// Used with:  node --import ./scripts/test-setup.mjs --test "build-test/tests/**/*.test.js"

import { register } from "node:module";
import { JSDOM } from "jsdom";

const loaderHookUrl = new URL("./test-loader-hook.mjs", import.meta.url);
register(loaderHookUrl);

const pageOptions = { url: "http://localhost/", pretendToBeVisual: true };
const page = new JSDOM("<!doctype html><html><body></body></html>", pageOptions);
const browserWindow = page.window;

/**
 * Globals that must come from jsdom even when Node has its own version. localStorage / sessionStorage: Node 25+
 * defines its own (undefined, or file-backed, without --localstorage-file), which would hide jsdom's page storage.
 */
const ALWAYS_FROM_JSDOM = [
  "Event",
  "EventTarget",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "FormData",
  "File",
  "FileList",
  "Blob",
  "localStorage",
  "sessionStorage",
];

function copyWindowProperty(propertyName) {
  const isMissing = !(propertyName in globalThis);
  const isForced = ALWAYS_FROM_JSDOM.includes(propertyName);
  if (isMissing || isForced) {
    const descriptor = { value: browserWindow[propertyName], configurable: true, writable: true };
    Object.defineProperty(globalThis, propertyName, descriptor);
  }
}

const windowPropertyNames = Object.getOwnPropertyNames(browserWindow);
for (const propertyName of windowPropertyNames) {
  copyWindowProperty(propertyName);
}

globalThis.window = browserWindow;
globalThis.document = browserWindow.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

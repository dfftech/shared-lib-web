// locale-signal.ts
// config.loadLocale as a SIGNAL: a bundle of texts per language code, filled by the app.
//
//   const localeSignal = signal<LocaleBundle | null>(null);       // { "en-US": {...}, "fr-FR": {...} }
//   (the app's own signal — not the library's localeSignal, which holds the current language code)
//   loadLocale: localeSignal,
//
// The library asks for a language by adding its code to requestedLocalesSignal and waits until the bundle has it
// (null for a code = that language has no texts: the next language is tried). The app fills the bundle:
//   fillLocaleBundle(localeSignal, loadLocaleGroups.bind(null, localeFiles));   // loads every requested code
// Without an answer within LOCALE_WAIT_MS the language counts as missing.

import { effect, signal } from "@preact/signals-react";
import type { LocaleBundle, LocaleCodeLoader, LocaleMessages, LocaleModule, ValueSignal } from "../interfaces/ui-config.ts";

/** How long the library waits for a requested language before it tries the next one. */
export const LOCALE_WAIT_MS = 15000;

/** The language codes the library needs texts for (in the order it asked). */
export const requestedLocalesSignal = signal<string[]>([]);

/** A promise and its resolve / reject, so a later bundle value can settle it. */
interface PendingLocale {
  promise: Promise<LocaleMessages>;
  resolve: (messages: LocaleMessages) => void;
  reject: (reason: Error) => void;
}

/** A bundle signal the app writes. */
export interface WritableLocaleBundleSignal {
  value: LocaleBundle | null;
  peek(): LocaleBundle | null;
}

const pendingLocales = new Map<string, PendingLocale>();

let followedSource: ValueSignal<LocaleBundle | null> | undefined = undefined;
let stopFollowingSource: (() => void) | undefined = undefined;

/** Codes being loaded per bundle signal (fillLocaleBundle), so a code is loaded once. */
const loadingCodes = new WeakMap<WritableLocaleBundleSignal, Set<string>>();

/** Stores resolve / reject of a new promise on the pending entry. */
function captureResolvers(
  pending: PendingLocale,
  resolve: (messages: LocaleMessages) => void,
  reject: (reason: Error) => void,
): void {
  pending.resolve = resolve;
  pending.reject = reject;
}

/** A new pending entry with its promise. */
function createPendingLocale(): PendingLocale {
  const pending = {} as PendingLocale;
  const capture = captureResolvers.bind(null, pending);
  pending.promise = new Promise<LocaleMessages>(capture);
  return pending;
}

/** Settles every waiting language that the bundle now answers (texts, or null = missing). */
function settlePendingLocales(bundle: LocaleBundle | null): void {
  if (!bundle) {
    return;
  }
  for (const [code, pending] of pendingLocales) {
    if (!(code in bundle)) {
      continue;
    }
    pendingLocales.delete(code);
    const messages = bundle[code];
    if (messages) {
      pending.resolve(messages);
    } else {
      const missingError = new Error(`shared-lib-web: no texts for ${code} in the loadLocale signal`);
      pending.reject(missingError);
    }
  }
}

/** Follows the bundle signal (once per signal). */
function followBundleSource(source: ValueSignal<LocaleBundle | null>): void {
  if (followedSource === source) {
    return;
  }
  stopFollowingSource?.();
  followedSource = source;
  stopFollowingSource = source.subscribe(settlePendingLocales);
}

/** No answer in time: the language counts as missing. */
function rejectLateLocale(code: string): void {
  const pending = pendingLocales.get(code);
  if (!pending) {
    return;
  }
  pendingLocales.delete(code);
  const timeoutError = new Error(`shared-lib-web: the loadLocale signal did not answer ${code} in time`);
  pending.reject(timeoutError);
}

/** Adds the code to requestedLocalesSignal (once). */
function requestLocale(code: string): void {
  const requestedCodes = requestedLocalesSignal.peek();
  if (!requestedCodes.includes(code)) {
    requestedLocalesSignal.value = [...requestedCodes, code];
  }
}

/** The texts of one language from a loadLocale signal: now when the bundle has them, else after the app adds them. */
export function waitForSignalLocale(source: ValueSignal<LocaleBundle | null>, code: string): Promise<LocaleModule> {
  const bundle = source.peek();
  const readyMessages = bundle?.[code];
  if (readyMessages) {
    return Promise.resolve(readyMessages);
  }
  if (bundle && code in bundle) {
    const missingError = new Error(`shared-lib-web: no texts for ${code} in the loadLocale signal`);
    return Promise.reject(missingError);
  }
  followBundleSource(source);
  let pending = pendingLocales.get(code);
  if (!pending) {
    pending = createPendingLocale();
    pendingLocales.set(code, pending);
    const rejectLater = rejectLateLocale.bind(null, code);
    setTimeout(rejectLater, LOCALE_WAIT_MS);
  }
  requestLocale(code);
  return pending.promise;
}

/** Loads one requested code into the bundle (null when it fails: that language is missing). */
async function loadIntoBundle(target: WritableLocaleBundleSignal, loader: LocaleCodeLoader, code: string): Promise<void> {
  let messages: LocaleMessages | null = null;
  try {
    const localeModule = await loader(code);
    const hasDefault = typeof localeModule === "object" && localeModule !== null && "default" in localeModule;
    messages = (hasDefault ? (localeModule as { default: LocaleMessages }).default : localeModule) as LocaleMessages;
  } catch {
    messages = null;
  }
  const currentBundle = target.peek() ?? {};
  target.value = { ...currentBundle, [code]: messages };
}

/** Loads every requested code that the bundle does not have yet (a signals effect). */
function followRequestedLocales(target: WritableLocaleBundleSignal, loader: LocaleCodeLoader): void {
  const requestedCodes = requestedLocalesSignal.value;
  const bundle = target.peek() ?? {};
  let codesInProgress = loadingCodes.get(target);
  if (!codesInProgress) {
    codesInProgress = new Set<string>();
    loadingCodes.set(target, codesInProgress);
  }
  for (const code of requestedCodes) {
    const isKnown = code in bundle || codesInProgress.has(code);
    if (isKnown) {
      continue;
    }
    codesInProgress.add(code);
    void loadIntoBundle(target, loader, code);
  }
}

/**
 * Fills a loadLocale signal: every language the library asks for is loaded with your loader (for example
 * loadLocaleGroups.bind(null, localeFiles)) and added to the bundle. Returns the stop function (for useEffect).
 */
export function fillLocaleBundle(target: WritableLocaleBundleSignal, loader: LocaleCodeLoader): () => void {
  const followRequests = followRequestedLocales.bind(null, target, loader);
  return effect(followRequests);
}

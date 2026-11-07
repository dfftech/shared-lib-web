// api-loader.ts
// The backend sources of the config, used by the provider itself (like loadThemes):
//
//   loadSupportLanguages  once, when the provider mounts                         -> setLanguages(reply)
//   loadBranches          when a user is signed in (sign in, or restored session) -> setBranches(reply)
//                         (before the menu: the menu request already sends x-branch-id)
//   loadMenuNavigation    when a user is signed in                                -> skeleton, then setMenu(reply)
//   sign out              -> branches and menu are removed
//
// A source is your function, a URL / path (AppHttp.Get), or a SIGNAL you fill yourself:
//   loadMenuNavigation: navSignal      // null = skeleton, a reply = the menu; every new value is shown at once
// A signal is followed as it is (no call, no sign-in rule): your code decides when it changes.
// Type "mfe" uses only loadSupportLanguages (the shell owns the rest) and shows no menu.

import { effect } from "@preact/signals-react";
import type { BranchSource, LangSource, MenuSource } from "../interfaces/app-types.ts";
import type { ApiSource, UiConfig, ValueSignal } from "../interfaces/ui-config.ts";
import { AppHttp, readJwtToken } from "../utils/app-http.ts";
import { isAuthenticatedSignal } from "./auth-service.ts";
import { registerBranches, setBranches } from "./branch-service.ts";
import { registerLanguages, setLanguages } from "./language-service.ts";
import { registerMenu, setMenu, setMenuLoading } from "./menu-service.ts";
import { appTypeSignal, uiConfigSignal } from "./signals.ts";

/** Configs whose loadSupportLanguages already ran (StrictMode mounts twice). */
const languageLoadedConfigs = new WeakSet<UiConfig>();

/** The token whose branches and menu were loaded last ("" = signed out), so a second mount does not load again. */
let loadedSessionToken: string | undefined = undefined;

/** Applies one value of a source signal (menu, languages or branches). */
type SignalValueApplier = (value: never) => void;

/** true when the source is a signal (works across copies of the signals package: no instanceof). */
export function isSignalSource(source: ApiSource | undefined): source is ValueSignal<unknown> {
  if (typeof source !== "object" || source === null) {
    return false;
  }
  const candidate = source as Partial<ValueSignal<unknown>>;
  return typeof candidate.peek === "function" && typeof candidate.subscribe === "function" && "value" in candidate;
}

/** A source the provider calls (a function or a URL), not a signal. */
function isCallableSource(source: ApiSource | undefined): source is string | (() => Promise<unknown>) {
  return typeof source === "function" || typeof source === "string";
}

/** Calls one loader: your function, or AppHttp.Get(url). A signal answers with its current value. */
export function callApiSource(source: ApiSource): Promise<unknown> {
  if (typeof source === "function") {
    return source();
  }
  if (isSignalSource(source)) {
    const currentValue = source.peek();
    return Promise.resolve(currentValue);
  }
  return AppHttp.Get(source);
}

/** loadSupportLanguages -> setLanguages. Once per config. On an error the default language stays. */
export async function loadConfigLanguages(config: UiConfig): Promise<void> {
  const langSource = config.loadSupportLanguages;
  const isLoaded = languageLoadedConfigs.has(config);
  if (!isCallableSource(langSource) || isLoaded) {
    return;
  }
  languageLoadedConfigs.add(config);
  try {
    const reply = await callApiSource(langSource);
    setLanguages(reply as LangSource);
  } catch (error) {
    console.error("shared-lib-web: config.loadSupportLanguages failed; the default language stays.", error);
  }
}

/** loadBranches -> setBranches (no switcher on an error). */
async function fetchBranchList(branchSource: ApiSource): Promise<void> {
  try {
    const reply = await callApiSource(branchSource);
    setBranches(reply as BranchSource);
  } catch (error) {
    console.error("shared-lib-web: config.loadBranches failed; no branch switcher.", error);
    setBranches(null);
  }
}

/** loadMenuNavigation -> menu skeleton, then setMenu (an empty menu on an error). */
async function fetchMenuNavigation(navSource: ApiSource): Promise<void> {
  setMenuLoading();
  try {
    const reply = await callApiSource(navSource);
    setMenu(reply as MenuSource);
  } catch (error) {
    console.error("shared-lib-web: config.loadMenuNavigation failed; the menu is empty.", error);
    setMenu([]);
  }
}

/** After sign in: branches first, then the menu (only sources the provider calls; signals follow themselves). */
export async function loadSessionData(config: UiConfig): Promise<void> {
  const branchSource = config.loadBranches;
  const navSource = config.loadMenuNavigation;
  if (isCallableSource(branchSource)) {
    await fetchBranchList(branchSource);
  }
  if (isCallableSource(navSource)) {
    await fetchMenuNavigation(navSource);
  }
}

/** After sign out: no branches, and the menu waits (skeleton) for the next user. Signal sources are left alone. */
export function clearSessionData(config: UiConfig): void {
  if (isCallableSource(config.loadBranches)) {
    setBranches(null);
  }
  if (isCallableSource(config.loadMenuNavigation)) {
    setMenuLoading();
  }
}

/** Runs on every sign in / sign out (a signals effect). */
function followSession(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  const config = uiConfigSignal.peek();
  if (!config) {
    return;
  }
  const token = isSignedIn ? readJwtToken() : "";
  if (token === loadedSessionToken) {
    return;
  }
  loadedSessionToken = token;
  if (isSignedIn) {
    void loadSessionData(config);
    return;
  }
  clearSessionData(config);
}

/** Forgets what was loaded (a new config, or tests). */
export function forgetApiSession(): void {
  loadedSessionToken = undefined;
}

/** Reads a source signal (so the effect follows it) and applies its value. */
function applySignalValue(sourceSignal: ValueSignal<unknown>, applyValue: SignalValueApplier): void {
  const value = sourceSignal.value;
  applyValue(value as never);
}

/** Follows a signal source; returns the stop function (or undefined when the source is not a signal). */
function followSignalSource(source: ApiSource | undefined, applyValue: SignalValueApplier): (() => void) | undefined {
  if (!isSignalSource(source)) {
    return undefined;
  }
  const applySource = applySignalValue.bind(null, source, applyValue);
  return effect(applySource);
}

/** Stops every running follower. */
function stopAll(stoppers: Array<(() => void) | undefined>): void {
  for (const stop of stoppers) {
    stop?.();
  }
  forgetApiSession();
}

/**
 * Starts the config sources. Called once by SharedWebUiProvider (layout effect); returns the cleanup.
 * Type "mfe": only loadSupportLanguages, and an empty menu (no skeleton; the shell shows the menu).
 */
export function startApiLoading(): () => void {
  const config = uiConfigSignal.peek();
  if (!config) {
    return forgetApiSession;
  }
  void loadConfigLanguages(config);
  const stopLanguages = followSignalSource(config.loadSupportLanguages, registerLanguages);
  const appType = appTypeSignal.peek();
  if (appType === "mfe") {
    setMenu([]);
    return stopAll.bind(null, [stopLanguages]);
  }
  const stopBranches = followSignalSource(config.loadBranches, registerBranches);
  const stopMenu = followSignalSource(config.loadMenuNavigation, registerMenu);
  const stopSession = effect(followSession);
  return stopAll.bind(null, [stopLanguages, stopBranches, stopMenu, stopSession]);
}

// custom-themes.ts
// Custom DaisyUI themes from plain data (a JSON file or an API reply) — no CSS file, no rebuild.
// The themes are an object keyed by theme name ("name" inside is optional, the key is the name):
//
//   { "org-light": { "isDark": false, "name": "org-light", "variables": { "color-primary": "oklch(55.8% 0.154 249.1)", ... } },
//     "org-dark":  { "isDark": true,  "name": "org-dark",  "variables": { ... } } }
//
// A plain list [{ "name": "org-light", ... }] is accepted too.
//
// setCustomThemes(list) writes ONE <style> element:
//   [data-theme="org-light"] { color-scheme: light; --color-primary: oklch(55.8% 0.154 249.1); ... }
// DaisyUI components read these CSS variables, so a custom theme works like a built-in one, and the theme switcher
// lists it first. Pass them in config.customThemes, load them lazily with config.loadThemes (like loadLocale),
// or set them any time later with setCustomThemes(json).
// The built-in DaisyUI themes still come from your CSS: @plugin "daisyui" { themes: all; }.

import type { CustomTheme, CustomThemeMap, CustomThemes, CustomThemesModule, UiConfig } from "../interfaces/ui-config.ts";
import { customThemesSignal, uiConfigSignal } from "../state/signals.ts";
import { isSignalSource } from "../utils/signal-source.ts";
import { applySavedThemeWhenKnown, leaveUnknownTheme } from "./theme-service.ts";

const STYLE_ELEMENT_ID = "shared-lib-web-custom-themes";
/** Theme names: lowercase letters, digits and "-" (they go into a CSS selector). */
const SAFE_NAME = /^[a-z0-9][a-z0-9-]*$/;
/** Variable names, with or without the leading "--". */
const SAFE_VARIABLE = /^(--)?[a-z0-9][a-z0-9-]*$/i;
/** Characters that could end the CSS rule (values come from JSON, maybe from a server). */
const UNSAFE_VALUE = /[;{}<>"\\]/;
const VARIABLE_PREFIX = "--";

/** "color-primary" -> "--color-primary" ("--color-primary" stays). */
function toVariableName(key: string): string {
  const hasPrefix = key.startsWith(VARIABLE_PREFIX);
  return hasPrefix ? key : `${VARIABLE_PREFIX}${key}`;
}

/** The CSS lines of the variables; unsafe names or values are skipped. */
function buildVariableLines(variables: Record<string, string>): string[] {
  const lines: string[] = [];
  const entries = Object.entries(variables);
  for (const [key, value] of entries) {
    const valueText = String(value);
    const isSafeKey = SAFE_VARIABLE.test(key);
    const isUnsafeValue = UNSAFE_VALUE.test(valueText);
    if (!isSafeKey || isUnsafeValue) {
      continue;
    }
    const variableName = toVariableName(key);
    lines.push(`  ${variableName}: ${valueText};`);
  }
  return lines;
}

/** true when the theme has a usable name. */
export function isValidCustomTheme(theme: CustomTheme): boolean {
  const hasName = typeof theme?.name === "string";
  return hasName && SAFE_NAME.test(theme.name);
}

/** The CSS rule of one custom theme: [data-theme="name"] { color-scheme: ...; --color-primary: ...; } */
export function buildCustomThemeCss(theme: CustomTheme): string {
  const isValid = isValidCustomTheme(theme);
  if (!isValid) {
    return "";
  }
  const colorScheme = theme.isDark ? "dark" : "light";
  const variableLines = buildVariableLines(theme.variables ?? {});
  const bodyLines = [`  color-scheme: ${colorScheme};`, ...variableLines];
  const bodyText = bodyLines.join("\n");
  return `[data-theme="${theme.name}"] {\n${bodyText}\n}`;
}

/** Writes the CSS into the one <style> element of the custom themes (created on first use). */
function writeThemeStyle(cssText: string): void {
  if (typeof document === "undefined") {
    return;
  }
  let styleElement = document.getElementById(STYLE_ELEMENT_ID);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = STYLE_ELEMENT_ID;
    document.head.append(styleElement);
  }
  styleElement.textContent = cssText;
}

/** true for a plain object (not null, not a list). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

/** The themes of an object keyed by theme name; an entry without "name" gets its key as name. */
function readThemeMapEntries(themeMap: CustomThemeMap): CustomTheme[] {
  const themeList: CustomTheme[] = [];
  const entries = Object.entries(themeMap);
  for (const [key, entry] of entries) {
    if (!isPlainObject(entry)) {
      continue;
    }
    const hasName = typeof entry.name === "string";
    const name = hasName ? entry.name : key;
    themeList.push({ ...entry, name } as CustomTheme);
  }
  return themeList;
}

/**
 * The custom themes as a list: an object keyed by theme name ({ "org-light": {...}, "org-dark": {...} }) is turned
 * into a list (in key order); a list stays as it is; anything else is an empty list.
 */
export function toCustomThemeList(themes?: CustomThemes | null): CustomTheme[] {
  if (Array.isArray(themes)) {
    return themes;
  }
  if (isPlainObject(themes)) {
    return readThemeMapEntries(themes as CustomThemeMap);
  }
  return [];
}

/**
 * Sets the custom themes (replaces the earlier ones): writes their CSS, adds them to the theme switcher and,
 * when the saved theme is one of them, switches to it. Accepts the parsed JSON as it is — the object keyed by theme
 * name, or a list; invalid entries are skipped.
 */
export function setCustomThemes(themes?: CustomThemes | null): void {
  const validThemes: CustomTheme[] = [];
  const givenThemes = toCustomThemeList(themes);
  for (const theme of givenThemes) {
    const isValid = isValidCustomTheme(theme);
    if (isValid) {
      validThemes.push(theme);
    }
  }
  const cssParts = validThemes.map(buildCustomThemeCss);
  const cssText = cssParts.join("\n\n");
  writeThemeStyle(cssText);
  customThemesSignal.value = validThemes;
  applySavedThemeWhenKnown();
}

/** true when the value is a JSON module ({ default: themes }), not a theme map with a theme called "default". */
function isThemesJsonModule(themesModule: CustomThemesModule): themesModule is { default: CustomThemes } {
  if (!isPlainObject(themesModule)) {
    return false;
  }
  const defaultValue = themesModule.default;
  if (Array.isArray(defaultValue)) {
    return true;
  }
  return isPlainObject(defaultValue) && !("variables" in defaultValue);
}

/** The themes inside a themes module as a list: the object keyed by name or the list, or the default export of a JSON module. */
export function unwrapThemesModule(themesModule: CustomThemesModule): CustomTheme[] {
  const isJsonModule = isThemesJsonModule(themesModule);
  if (isJsonModule) {
    return toCustomThemeList(themesModule.default);
  }
  return toCustomThemeList(themesModule as CustomThemes);
}

/** baseThemes + extraThemes; a theme with the same name in extraThemes replaces the one in baseThemes. */
export function mergeCustomThemes(baseThemes: CustomTheme[], extraThemes: CustomTheme[]): CustomTheme[] {
  const mergedThemes: CustomTheme[] = [];
  const extraNames: string[] = [];
  for (const extraTheme of extraThemes) {
    extraNames.push(extraTheme?.name);
  }
  for (const baseTheme of baseThemes) {
    const isReplaced = extraNames.includes(baseTheme.name);
    if (!isReplaced) {
      mergedThemes.push(baseTheme);
    }
  }
  mergedThemes.push(...extraThemes);
  return mergedThemes;
}

/** Configs whose loadThemes already ran (StrictMode mounts twice). */
const loadedConfigs = new WeakSet<UiConfig>();

/**
 * Runs config.loadThemes once per config and adds the result to config.customThemes.
 * When it fails, or the saved theme is not in the result, the default theme is used.
 */
export async function loadConfigThemes(config: UiConfig): Promise<void> {
  const loadThemes = config.loadThemes;
  const isLoaded = loadedConfigs.has(config);
  if (typeof loadThemes !== "function" || isLoaded) {
    return;
  }
  loadedConfigs.add(config);
  try {
    const themesModule = await loadThemes();
    const loadedThemes = unwrapThemesModule(themesModule);
    const isConfigStillActive = uiConfigSignal.peek() === config;
    if (isConfigStillActive) {
      const baseThemes = toCustomThemeList(config.customThemes);
      const mergedThemes = mergeCustomThemes(baseThemes, loadedThemes);
      setCustomThemes(mergedThemes);
    }
  } catch (error) {
    console.error("shared-lib-web: could not load the custom themes (config.loadThemes).", error);
  }
  leaveUnknownTheme();
}

/** One value of a loadThemes signal: null = not here yet; a list (or JSON module) replaces the loaded themes. */
function applyThemesFromSignal(config: UiConfig, themesModule: CustomThemesModule | null): void {
  const isConfigActive = uiConfigSignal.peek() === config;
  if (!themesModule || !isConfigActive) {
    return;
  }
  const loadedThemes = unwrapThemesModule(themesModule);
  const baseThemes = toCustomThemeList(config.customThemes);
  const mergedThemes = mergeCustomThemes(baseThemes, loadedThemes);
  setCustomThemes(mergedThemes);
  leaveUnknownTheme();
}

/** Follows config.loadThemes when it is a signal. Returns the stop function (nothing to stop otherwise). */
export function followConfigThemes(config: UiConfig): () => void {
  const themesSource = config.loadThemes;
  if (!isSignalSource(themesSource)) {
    return stopNothing;
  }
  const applyThemes = applyThemesFromSignal.bind(null, config);
  return themesSource.subscribe(applyThemes as (value: unknown) => void);
}

/** Nothing to clean up. */
function stopNothing(): void {
  return;
}

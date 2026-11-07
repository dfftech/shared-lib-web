// dark-themes.ts
// The DaisyUI 5 theme names, and which of them are dark ("color-scheme: dark": dark logos, dark markdown editor).
// config.themes defaults to DAISYUI_THEMES; config.darkThemes replaces DEFAULT_DARK_THEMES.
// Custom themes (config.customThemes / setCustomThemes) are added to both lists by their own isDark flag.

import type { CustomTheme, Theme } from "../interfaces/ui-config.ts";

/** All 35 DaisyUI 5 themes (enable them in CSS with @plugin "daisyui" { themes: all; }). */
export const DAISYUI_THEMES: Theme[] = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];

/** The dark DaisyUI 5 themes. */
export const DEFAULT_DARK_THEMES: Theme[] = [
  "dark",
  "aqua",
  "synthwave",
  "halloween",
  "forest",
  "black",
  "luxury",
  "dracula",
  "business",
  "night",
  "coffee",
  "dim",
  "sunset",
  "abyss",
];

/** The dark theme names: the dark custom themes + (darkThemes, else the DaisyUI dark themes). */
export function buildDarkThemeNames(darkThemes: Theme[] | undefined, customThemes: CustomTheme[]): Theme[] {
  const names: Theme[] = [];
  for (const customTheme of customThemes) {
    if (customTheme.isDark) {
      names.push(customTheme.name);
    }
  }
  const baseNames = darkThemes ?? DEFAULT_DARK_THEMES;
  for (const name of baseNames) {
    const isAdded = names.includes(name);
    if (!isAdded) {
      names.push(name);
    }
  }
  return names;
}

/** The theme names of the switcher: the custom themes first, then (themes, else all DaisyUI themes). */
export function buildThemeNames(themes: Theme[] | undefined, customThemes: CustomTheme[]): Theme[] {
  const names: Theme[] = [];
  for (const customTheme of customThemes) {
    names.push(customTheme.name);
  }
  const baseNames = themes ?? DAISYUI_THEMES;
  for (const name of baseNames) {
    const isAdded = names.includes(name);
    if (!isAdded) {
      names.push(name);
    }
  }
  return names;
}

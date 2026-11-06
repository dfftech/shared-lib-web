// themes.ts
// The theme names of this project, in one place:
//   - custom themes: one CSS file per theme in this folder (org-light.css, org-dark.css), imported in index.css
//   - DaisyUI themes: enabled in index.css (@plugin "daisyui" { themes: ... })
// config.ts passes THEMES and DARK_THEMES to the library (theme switcher, dark logo, dark markdown editor).
import type { Theme } from "shared-lib-web";

/** Custom themes of this project (theme/org-light.css, theme/org-dark.css). */
export const CUSTOM_THEMES: Theme[] = ["org-light", "org-dark"];

/** All 35 DaisyUI 5 themes. */
export const DAISYUI_THEMES: Theme[] = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine",
  "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset",
  "caramellatte", "abyss", "silk",
];

/** Every theme the switchers offer: the custom ones first. */
export const THEMES: Theme[] = [...CUSTOM_THEMES, ...DAISYUI_THEMES];

/** Themes with a dark background (color-scheme: dark). */
export const DARK_THEMES: Theme[] = [
  "org-dark", "dark", "synthwave", "halloween", "forest", "aqua", "black", "luxury", "dracula", "business",
  "night", "coffee", "dim", "sunset", "abyss",
];

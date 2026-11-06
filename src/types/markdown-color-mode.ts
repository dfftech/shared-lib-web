// markdown-color-mode.ts
// The markdown editor and viewer follow the DaisyUI theme through data-color-mode.

import { isDarkThemeSignal } from "../state/signals.ts";

/** "dark" on dark themes, "light" otherwise. */
export function readMarkdownColorMode(): "dark" | "light" {
  const isDarkTheme = isDarkThemeSignal.value;
  return isDarkTheme ? "dark" : "light";
}

/** Keeps the markdown colours on the theme background. */
export const MARKDOWN_SURFACE_STYLE = { backgroundColor: "transparent" };

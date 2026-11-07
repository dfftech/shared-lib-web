// default-theme.test.ts — the first-visit theme: config.defaultTheme, else the browser preference (dark / light).
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import type { UiConfig } from "../src/index.ts";
import { readDefaultTheme } from "../src/theme/theme-service.ts";

const baseConfig: UiConfig = { appNameKey: "THEMES", themes: ["light", "dark", "org-light"] };
const originalMatchMedia = window.matchMedia;

function fakeMatchMedia(isDark: boolean): typeof window.matchMedia {
  function matchMedia(query: string): MediaQueryList {
    const isDarkQuery = query.includes("dark");
    return { matches: isDark && isDarkQuery, media: query } as MediaQueryList;
  }
  return matchMedia;
}

describe("default theme", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses config.defaultTheme when it is set", () => {
    window.matchMedia = fakeMatchMedia(true);
    const config: UiConfig = { ...baseConfig, defaultTheme: "org-light" };
    expect(readDefaultTheme(config)).toBe("org-light");
  });

  it("is dark when the browser prefers dark and no defaultTheme is set", () => {
    window.matchMedia = fakeMatchMedia(true);
    expect(readDefaultTheme(baseConfig)).toBe("dark");
  });

  it("is light when the browser prefers light and no defaultTheme is set", () => {
    window.matchMedia = fakeMatchMedia(false);
    expect(readDefaultTheme(baseConfig)).toBe("light");
  });

  it("is light when the browser preference is unknown (no matchMedia)", () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(readDefaultTheme(baseConfig)).toBe("light");
  });
});

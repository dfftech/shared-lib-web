// custom-themes.test.tsx — custom DaisyUI themes as data (JSON): CSS, theme list, dark list, saved theme.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render } from "@testing-library/react";
import {
  AppStorage,
  DAISYUI_THEMES,
  SharedWebUiProvider,
  THEME,
  buildCustomThemeCss,
  isDarkThemeSignal,
  readDarkThemeNames,
  readThemeNames,
  setCustomThemes,
  themeSignal,
  uiConfigSignal,
  mergeCustomThemes,
  toCustomThemeList,
  unwrapThemesModule,
  type CustomTheme,
  type CustomThemeMap,
  type CustomThemesModule,
  type UiConfig,
} from "../src/index.ts";

const orgThemes: CustomTheme[] = [
  { name: "org-light", variables: { "color-primary": "oklch(55.8% 0.154 249.1)", "--radius-box": "0.75rem" } },
  { name: "org-dark", isDark: true, variables: { "color-primary": "oklch(74.6% 0.16 232.7)" } },
];

/** The JSON format: an object keyed by theme name. */
const orgThemeMap: CustomThemeMap = {
  "org-dark": { isDark: true, name: "org-dark", variables: { "color-primary": "oklch(74.6% 0.16 232.7)" } },
  "org-light": { isDark: false, name: "org-light", variables: { "color-primary": "oklch(55.8% 0.154 249.1)" } },
};

const config: UiConfig = { appNameKey: "CUSTOM", customThemes: orgThemes };

function readStyleText(): string {
  const styleElement = document.getElementById("shared-lib-web-custom-themes");
  return styleElement?.textContent ?? "";
}

describe("custom themes", () => {
  afterEach(() => {
    cleanup();
    setCustomThemes([]);
    localStorage.clear();
  });

  it("builds a [data-theme] rule with color-scheme and the -- variables", () => {
    const css = buildCustomThemeCss(orgThemes[0]);
    expect(css).toContain('[data-theme="org-light"]');
    expect(css).toContain("color-scheme: light;");
    expect(css).toContain("--color-primary: oklch(55.8% 0.154 249.1);");
    expect(css).toContain("--radius-box: 0.75rem;");
  });

  it("skips unsafe names and values", () => {
    const badTheme = { name: "x", variables: { "color-primary": "red; } body { display: none", "bad key": "1" } };
    const css = buildCustomThemeCss(badTheme);
    expect(css.includes("display")).toBe(false);
    expect(css.includes("bad key")).toBe(false);
    const badName = buildCustomThemeCss({ name: 'a"] body {', variables: {} });
    expect(badName).toBe("");
  });

  it("lists the custom themes first, then all DaisyUI themes, and marks the dark ones", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    const themeNames = readThemeNames(config);
    expect(themeNames[0]).toBe("org-light");
    expect(themeNames[1]).toBe("org-dark");
    expect(themeNames.length).toBe(DAISYUI_THEMES.length + 2);
    const darkNames = readDarkThemeNames();
    expect(darkNames.includes("org-dark")).toBe(true);
    expect(darkNames.includes("org-light")).toBe(false);
    expect(readStyleText()).toContain('[data-theme="org-dark"]');
  });

  it("themes from fetched JSON: the saved custom theme is applied once it arrives", () => {
    AppStorage.setData(THEME, "org-dark");
    const lateConfig: UiConfig = { appNameKey: "CUSTOM" };
    render(<SharedWebUiProvider config={lateConfig}><p>page</p></SharedWebUiProvider>);
    expect(uiConfigSignal.value).toBe(lateConfig);
    expect(themeSignal.value === "org-dark").toBe(false);
    const json = JSON.parse(JSON.stringify(orgThemes)) as CustomTheme[];
    setCustomThemes(json);
    expect(themeSignal.value).toBe("org-dark");
    expect(isDarkThemeSignal.value).toBe(true);
  });

  it("loadThemes: loads a JSON module lazily, keeps the saved theme while loading, then applies it", async () => {
    AppStorage.setData(THEME, "org-dark");
    let finishLoading: (themesModule: CustomThemesModule) => void = () => {};
    const loading = new Promise<CustomThemesModule>((resolve) => {
      finishLoading = resolve;
    });
    const loadConfig: UiConfig = { appNameKey: "CUSTOM", loadThemes: () => loading };
    render(<SharedWebUiProvider config={loadConfig}><p>page</p></SharedWebUiProvider>);
    expect(themeSignal.value).toBe("org-dark");
    await act(async () => {
      finishLoading({ default: orgThemes });
      await loading;
    });
    expect(themeSignal.value).toBe("org-dark");
    expect(readThemeNames(loadConfig)[0]).toBe("org-light");
    expect(isDarkThemeSignal.value).toBe(true);
    expect(readStyleText()).toContain('[data-theme="org-dark"]');
  });

  it("loadThemes: a failed load falls back to the default theme", async () => {
    AppStorage.setData(THEME, "org-dark");
    const originalError = console.error;
    console.error = () => {};
    const failConfig: UiConfig = { appNameKey: "CUSTOM", defaultTheme: "light", loadThemes: () => Promise.reject(new Error("offline")) };
    render(<SharedWebUiProvider config={failConfig}><p>page</p></SharedWebUiProvider>);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    console.error = originalError;
    expect(themeSignal.value).toBe("light");
  });

  it("themes as an object keyed by theme name: listed in key order, dark ones marked", () => {
    const mapConfig: UiConfig = { appNameKey: "CUSTOM", customThemes: orgThemeMap };
    render(<SharedWebUiProvider config={mapConfig}><p>page</p></SharedWebUiProvider>);
    const themeNames = readThemeNames(mapConfig);
    expect(themeNames[0]).toBe("org-dark");
    expect(themeNames[1]).toBe("org-light");
    expect(readDarkThemeNames().includes("org-dark")).toBe(true);
    expect(readStyleText()).toContain('[data-theme="org-light"]');
  });

  it("toCustomThemeList / unwrapThemesModule: the key is the name when \"name\" is missing, JSON modules unwrap", () => {
    const list = toCustomThemeList({ "brand-blue": { variables: { "color-primary": "blue" } } });
    expect(list[0].name).toBe("brand-blue");
    const fromModule = unwrapThemesModule({ default: orgThemeMap });
    expect(fromModule.length).toBe(2);
    const fromMap = unwrapThemesModule(orgThemeMap);
    expect(fromMap[1].name).toBe("org-light");
    const withDefaultTheme = unwrapThemesModule({ default: { isDark: false, variables: { "color-primary": "red" } } });
    expect(withDefaultTheme[0].name).toBe("default");
    expect(toCustomThemeList(null).length).toBe(0);
  });

  it("setCustomThemes accepts the object keyed by theme name (fetched JSON)", () => {
    AppStorage.setData(THEME, "org-dark");
    const lateConfig: UiConfig = { appNameKey: "CUSTOM" };
    render(<SharedWebUiProvider config={lateConfig}><p>page</p></SharedWebUiProvider>);
    const json = JSON.parse(JSON.stringify(orgThemeMap)) as CustomThemeMap;
    setCustomThemes(json);
    expect(themeSignal.value).toBe("org-dark");
    expect(isDarkThemeSignal.value).toBe(true);
  });

  it("mergeCustomThemes: a loaded theme with the same name replaces the static one", () => {
    const loaded: CustomTheme[] = [{ name: "org-light", variables: { "color-primary": "red" } }];
    const merged = mergeCustomThemes(orgThemes, loaded);
    expect(merged.length).toBe(2);
    expect(merged[0].name).toBe("org-dark");
    expect(merged[1].variables["color-primary"]).toBe("red");
  });
});

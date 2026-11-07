// locale-theme-signals.test.tsx — loadLocale and loadThemes as signals the app fills.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { signal } from "@preact/signals-react";
import {
  SharedWebUiProvider,
  fillLocaleBundle,
  localeSignal,
  readThemeNames,
  requestedLocalesSignal,
  themeSignal,
  translate,
  type CustomThemesModule,
  type LocaleBundle,
  type LocaleModule,
  type UiConfig,
} from "../src/index.ts";
import { clearLocaleCache } from "../src/i18n/locale-service.ts";
import { setCustomThemes } from "../src/theme/custom-themes.ts";

const TEXTS: Record<string, LocaleModule> = {
  "en-US": { default: { app: { name: "My App" }, hello: "Hello" } },
  "fr-FR": { app: { name: "Mon appli" }, hello: "Bonjour" },
};

function loadTexts(code: string): Promise<LocaleModule> {
  const texts = TEXTS[code];
  return texts ? Promise.resolve(texts) : Promise.reject(new Error(`no ${code}`));
}

describe("loadLocale / loadThemes as signals", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    clearLocaleCache();
    setCustomThemes([]);
    requestedLocalesSignal.value = [];
  });

  it("loadLocale signal: the library requests the codes, fillLocaleBundle loads them, the texts show", async () => {
    const textsSignal = signal<LocaleBundle | null>(null);
    const stopFilling = fillLocaleBundle(textsSignal, loadTexts);
    localStorage.setItem("LOCSIG-LANG", "fr-FR");
    const config: UiConfig = {
      appNameKey: "LOCSIG",
      themes: ["light"],
      languages: [{ code: "en-US", label: "English" }, { code: "fr-FR", label: "Français" }],
      loadLocale: textsSignal,
    };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(localeSignal.value).toBe("fr-FR"));
    expect(translate("hello")).toBe("Bonjour");
    expect(requestedLocalesSignal.value.includes("en-US")).toBe(true);
    expect(textsSignal.value?.["en-US"] === undefined).toBe(false);
    stopFilling();
  });

  it("loadLocale signal: a language the app marks null (missing) falls back to the next one", async () => {
    const textsSignal = signal<LocaleBundle | null>({ "de-DE": null });
    const stopFilling = fillLocaleBundle(textsSignal, loadTexts);
    localStorage.setItem("LOCSIG2-LANG", "de-DE");
    const config: UiConfig = { appNameKey: "LOCSIG2", themes: ["light"], loadLocale: textsSignal };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(localeSignal.value).toBe("en-US"));
    stopFilling();
  });

  it("loadThemes signal: the saved custom theme stays while null, then the themes arrive and apply", async () => {
    const themesSignal = signal<CustomThemesModule | null>(null);
    localStorage.setItem("THEMESIG-THEME", "org-dark");
    const config: UiConfig = { appNameKey: "THEMESIG", themes: ["light"], loadThemes: themesSignal };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    expect(themeSignal.value).toBe("org-dark");
    await act(async () => {
      themesSignal.value = { default: [{ name: "org-dark", isDark: true, variables: { "color-primary": "blue" } }] };
    });
    expect(readThemeNames(config)[0]).toBe("org-dark");
    expect(themeSignal.value).toBe("org-dark");
  });
});

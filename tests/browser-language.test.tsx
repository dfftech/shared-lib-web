// browser-language.test.tsx — no defaultLanguage: the browser / system language is used, else en-US.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { cleanup, render, waitFor } from "@testing-library/react";
import {
  LanguageSwitcher,
  SharedWebUiProvider,
  localeSignal,
  matchLanguageCode,
  readDefaultLanguage,
  readFallbackLanguage,
  type LanguageOption,
  type LocaleModule,
  type UiConfig,
} from "../src/index.ts";
import { clearLocaleCache } from "../src/i18n/locale-service.ts";

const originalLanguages = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages");
const originalLanguage = Object.getOwnPropertyDescriptor(Navigator.prototype, "language");

function setBrowserLanguages(codes: string[]): void {
  Object.defineProperty(Navigator.prototype, "languages", { configurable: true, get: () => codes });
  Object.defineProperty(Navigator.prototype, "language", { configurable: true, get: () => codes[0] ?? "" });
}

const listedLanguages: LanguageOption[] = [
  { code: "en-US", label: "English" },
  { code: "fr-FR", label: "Français" },
  { code: "ar-SA", label: "العربية" },
];

function loadLocale(languageCode: string): Promise<LocaleModule> {
  const files: Record<string, LocaleModule> = { "en-US": { hello: "Hello" }, "fr-FR": { hello: "Bonjour" } };
  const file = files[languageCode];
  return file ? Promise.resolve(file) : Promise.reject(new Error(`no ${languageCode}.json`));
}

describe("browser language", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    clearLocaleCache();
    if (originalLanguages) {
      Object.defineProperty(Navigator.prototype, "languages", originalLanguages);
    }
    if (originalLanguage) {
      Object.defineProperty(Navigator.prototype, "language", originalLanguage);
    }
  });

  it("matches exactly, then by base language, best browser code first", () => {
    expect(matchLanguageCode(["fr-FR", "en-US"], listedLanguages)).toBe("fr-FR");
    expect(matchLanguageCode(["fr-CA", "en-US"], listedLanguages)).toBe("fr-FR");
    expect(matchLanguageCode(["ar"], listedLanguages)).toBe("ar-SA");
    expect(matchLanguageCode(["EN-us"], listedLanguages)).toBe("en-US");
    expect(matchLanguageCode(["de-DE", "ja"], listedLanguages)).toBe(undefined);
  });

  it("the fallback language is defaultLanguage, else en-US", () => {
    expect(readFallbackLanguage({ appNameKey: "A" })).toBe("en-US");
    expect(readFallbackLanguage({ appNameKey: "A", defaultLanguage: "fr-FR" })).toBe("fr-FR");
  });

  it("config.defaultLanguage wins over the browser", () => {
    setBrowserLanguages(["fr-FR"]);
    expect(readDefaultLanguage({ appNameKey: "A", defaultLanguage: "ar-SA" })).toBe("ar-SA");
  });

  it("no defaultLanguage, a language list: starts in the browser language (fr-CA -> fr-FR)", async () => {
    setBrowserLanguages(["fr-CA", "en-US"]);
    const config: UiConfig = { appNameKey: "BROWSER", languages: listedLanguages, loadLocale: loadLocale };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(localeSignal.value).toBe("fr-FR"));
  });

  it("no defaultLanguage, no list: tries the browser codes, a missing file falls back to en-US", async () => {
    setBrowserLanguages(["de-DE"]);
    const config: UiConfig = { appNameKey: "BROWSER2", loadLocale: loadLocale };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(localeSignal.value).toBe("en-US"));
  });

  it("no defaultLanguage, no list: a browser code with a locale file is used", async () => {
    setBrowserLanguages(["fr-FR"]);
    const config: UiConfig = { appNameKey: "BROWSER3", loadLocale: loadLocale };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(localeSignal.value).toBe("fr-FR"));
  });
});

describe("language switcher text", () => {
  afterEach(cleanup);

  it("shows the code in the header and the full name with isFullName (login)", async () => {
    const config: UiConfig = { appNameKey: "SWITCHER", defaultLanguage: "fr-FR", languages: listedLanguages, loadLocale: loadLocale };
    const view = render(
      <SharedWebUiProvider config={config}>
        <LanguageSwitcher />
        <LanguageSwitcher isFullName />
      </SharedWebUiProvider>,
    );
    await waitFor(() => expect(localeSignal.value).toBe("fr-FR"));
    const buttons = view.container.querySelectorAll("[role=button]");
    expect(buttons[0]?.textContent).toBe("FR");
    expect(buttons[1]?.textContent).toBe("Français");
  });
});

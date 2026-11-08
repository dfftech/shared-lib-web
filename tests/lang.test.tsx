// Tests for backend languages: toLanguageOptions(), setLanguages() and config.loadSupportLanguages.
// Separate file = fresh module state (chosen language, locale cache).
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { BackendData } from "./backend-data.tsx";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  SharedWebUiProvider,
  changeLanguage,
  readDefaultLanguageCode,
  toLanguageOptions,
  useUi,
  type LangResponseType,
  type LangSource,
  type LanguageOption,
  type LocaleModule,
  type UiConfig,
} from "../src/index.ts";

const LANGUAGE_KEY = "LANG-LANG";

const MESSAGES_BY_CODE: Record<string, LocaleModule> = {
  "en-US": { default: { greeting: "Hello" } },
  "fr-FR": { default: { greeting: "Bonjour" } },
  "ar-SA": { default: { greeting: "مرحبا" } },
};

/** config.loadLocale: in an app this is import(`./locales/${code}.json`). */
function loadLocale(languageCode: string): Promise<LocaleModule> {
  const localeModule = MESSAGES_BY_CODE[languageCode];
  if (!localeModule) {
    return Promise.reject(new Error(`no ${languageCode}.json`));
  }
  return Promise.resolve(localeModule);
}

function buildLangConfig(): UiConfig {
  return {
    appNameKey: "LANG",
    appName: "app.name",
    defaultLanguage: "en-US",
    loadLocale: loadLocale,
    themes: ["light", "dark"],
    defaultTheme: "light",
  };
}

const langResponse: LangResponseType = {
  data: [
    { code: "en-US", name: "English", flag: "🇺🇸", isDefault: true, priority: 1 },
    { code: "ar-SA", name: "العربية", direction: "rtl", priority: 3 },
    { code: "fr-FR", name: "Français", priority: 2 },
    { code: "de-DE", name: "Deutsch", active: false, priority: 4 },
  ],
  meta: { requestId: "test" },
};

const frenchDefaultResponse: LangResponseType = {
  data: [
    { code: "en-US", name: "English" },
    { code: "fr-FR", name: "Français", isDefault: true },
  ],
};

function readCodes(languages: LanguageOption[]): string {
  const codes: string[] = [];
  for (const language of languages) {
    codes.push(language.code);
  }
  return codes.join(",");
}

function LangProbe() {
  const { locale, direction, languages, t } = useUi();
  const languageCodes = readCodes(languages);
  const greeting = t("greeting");
  const summary = `${locale}|${direction}|${greeting}|${languageCodes}`;
  return <span data-testid="summary">{summary}</span>;
}

interface LangShellProps {
  config: UiConfig;
  lang: LangSource | null;
}

function LangShell(props: LangShellProps) {
  return (
    <SharedWebUiProvider config={props.config}>
      <BackendData lang={props.lang} />
      <LangProbe />
    </SharedWebUiProvider>
  );
}

function readSummary(): string {
  const summary = screen.getByTestId("summary");
  return summary.textContent ?? "";
}

function resetLanguageStorage(): void {
  cleanup();
  window.localStorage.clear();
}

function testToLanguageOptions(): void {
  const options = toLanguageOptions(langResponse);
  expect(readCodes(options)).toBe("en-US,fr-FR,ar-SA");
  expect(options[0]).toEqual({ code: "en-US", label: "English", flag: "🇺🇸" });
  expect(options[2].direction).toBe("rtl");
  expect(readDefaultLanguageCode(langResponse)).toBe("en-US");
  const otherFieldNames = toLanguageOptions([{ langCode: "hi-IN", label: "हिन्दी", dir: "LTR" }]);
  expect(otherFieldNames).toEqual([{ code: "hi-IN", label: "हिन्दी", direction: "ltr" }]);
  expect(toLanguageOptions(null)).toEqual([]);
}

async function testNullThenData(): Promise<void> {
  const config = buildLangConfig();
  const view = render(<LangShell config={config} lang={null} />);
  await screen.findByTestId("summary");
  // Before the reply: config.defaultLanguage texts (en-US.json), no list yet.
  expect(readSummary()).toBe("en-US|ltr|Hello|");
  view.rerender(<LangShell config={config} lang={langResponse} />);
  expect(readSummary()).toBe("en-US|ltr|Hello|en-US,fr-FR,ar-SA");
  await act(switchToArabic);
  expect(readSummary()).toBe("ar-SA|rtl|مرحبا|en-US,fr-FR,ar-SA");
  expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe("ar-SA");
}

async function switchToArabic(): Promise<void> {
  await changeLanguage("ar-SA");
}

async function testBackendDefaultIsUsed(): Promise<void> {
  const config = buildLangConfig();
  const view = render(<LangShell config={config} lang={null} />);
  await screen.findByTestId("summary");
  view.rerender(<LangShell config={config} lang={frenchDefaultResponse} />);
  await waitFor(expectFrench);
  expect(window.localStorage.getItem(LANGUAGE_KEY)).toBeNull();
}

function expectFrench(): void {
  expect(readSummary()).toBe("fr-FR|ltr|Bonjour|en-US,fr-FR");
}

async function testSavedChoiceWins(): Promise<void> {
  window.localStorage.setItem(LANGUAGE_KEY, "ar-SA");
  const config = buildLangConfig();
  const view = render(<LangShell config={config} lang={null} />);
  await screen.findByTestId("summary");
  expect(readSummary()).toBe("ar-SA|rtl|مرحبا|");
  view.rerender(<LangShell config={config} lang={langResponse} />);
  expect(readSummary()).toBe("ar-SA|rtl|مرحبا|en-US,fr-FR,ar-SA");
}

async function testSavedChoiceNotListed(): Promise<void> {
  window.localStorage.setItem(LANGUAGE_KEY, "ar-SA");
  const config = buildLangConfig();
  const view = render(<LangShell config={config} lang={null} />);
  await screen.findByTestId("summary");
  view.rerender(<LangShell config={config} lang={frenchDefaultResponse} />);
  await waitFor(expectFrench);
}

async function testMissingFileFallsBack(): Promise<void> {
  window.localStorage.setItem(LANGUAGE_KEY, "xx-XX");
  const config = buildLangConfig();
  render(<LangShell config={config} lang={null} />);
  await screen.findByTestId("summary");
  expect(readSummary()).toBe("en-US|ltr|Hello|");
}

/** sor /load/LANG: { data: [{ key, label, locale, disabled }] } — disabled rows are hidden. */
function testSorLanguageRows(): void {
  const sorReply = {
    meta: { duration: 41 },
    data: [
      { disabled: true, key: "ar-SA", label: "Arabic", locale: "العربية" },
      { disabled: false, key: "en-US", label: "English", locale: "English" },
      { disabled: false, key: "fr-FR", label: "Français", locale: "Français" },
      { disabled: false, key: "te-IN", locale: "తెలుగు" },
    ],
    status: "LOADED_SUCCESSFULLY",
  };
  const options = toLanguageOptions(sorReply);
  expect(options.length).toBe(3);
  expect(options[0].code).toBe("en-US");
  expect(options[1].label).toBe("Français");
  expect(options[2].label).toBe("తెలుగు");
}

describe("Backend languages", function describeBackendLanguages() {
  afterEach(resetLanguageStorage);
  it("converts the backend reply into language options", testToLanguageOptions);
  it("reads the sor /load/LANG rows (key, label, locale, disabled)", testSorLanguageRows);
  it("starts with lang null and shows the list when it arrives", testNullThenData);
  it("switches to the backend default when nothing was chosen", testBackendDefaultIsUsed);
  it("keeps the saved language when it is in the list", testSavedChoiceWins);
  it("switches to the default when the saved language is not listed", testSavedChoiceNotListed);
  it("falls back to the default when a locale file is missing", testMissingFileFallsBack);
});

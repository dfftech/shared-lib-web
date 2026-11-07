// The provider with nav, lang and branch all null: the app still works with config.defaultLanguage (en-US),
// shows no branch switcher, no language switcher and no sidebar / mega menu choice (there is no menu to show).
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { BackendData } from "./backend-data.tsx";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  PREFERENCE_EVENT,
  SharedWebUiProvider,
  localeSignal,
  navigationSignal,
  themeSignal,
  type LocaleModule,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";

function loadLocale(languageCode: string): Promise<LocaleModule> {
  const messages = { app: { name: `App ${languageCode}` }, page: { text: "Null inputs page" } };
  return Promise.resolve({ default: messages });
}

/** No languages, no navigation in the config: everything comes (or not) from the null inputs. */
const nullConfig: UiConfig = {
  appNameKey: "NULLS",
  appName: "app.name",
  defaultLanguage: "en-US",
  loadLocale: loadLocale,
  defaultTheme: "light",
  themes: ["light", "dark"],
  layout: { headerSettings: "menu" },
};

function NullInputsApp() {
  const page = <p>page body</p>;
  return (
    <SharedWebUiProvider config={nullConfig}>
      <BackendData nav={null} lang={null} branch={null} />
      <AppLayout>{page}</AppLayout>
    </SharedWebUiProvider>
  );
}

async function testAllNull(): Promise<void> {
  render(<NullInputsApp />);
  await screen.findByText("page body");
  expect(localeSignal.value).toBe("en-US");
  expect(document.documentElement.getAttribute("lang")).toBe("en-US");
  expect(screen.getAllByText("App en-US").length).toBeGreaterThan(0);
  expect(navigationSignal.value.length).toBe(0);
  const banner = screen.getByRole("banner");
  expect(within(banner).queryByRole("button", { name: /Branch/ })).toBeNull();
  expect(within(banner).queryByRole("button", { name: "Language" })).toBeNull();
  const settingsButton = within(banner).getByRole("button", { name: "Settings" });
  fireEvent.click(settingsButton);
  const dialog = screen.getByRole("dialog", { name: "Settings" });
  expect(within(dialog).getByText("Theme")).toBeTruthy();
  expect(within(dialog).queryByText("Language")).toBeNull();
  expect(within(dialog).queryByText("Navigation")).toBeNull();
  expect(within(dialog).queryByRole("button", { name: "Mega menu" })).toBeNull();
}

/** Another copy of the library (another MFE) saved the theme: this copy follows without saving it again. */
async function testPreferenceSync(): Promise<void> {
  render(<NullInputsApp />);
  await screen.findByText("page body");
  expect(themeSignal.value).toBe("light");
  window.localStorage.setItem("NULLS-THEME", "dark");
  const eventInit = { detail: { key: "THEME" } };
  const preferenceEvent = new CustomEvent(PREFERENCE_EVENT, eventInit);
  act(dispatchPreference.bind(null, preferenceEvent));
  expect(themeSignal.value).toBe("dark");
  window.localStorage.removeItem("NULLS-THEME");
}

function dispatchPreference(preferenceEvent: Event): void {
  window.dispatchEvent(preferenceEvent);
}

describe("Null inputs", function describeNullInputs() {
  afterEach(cleanup);
  it("works with nav, lang and branch all null (en-US, no switchers, no menu mode choice)", testAllNull);
  it("follows a theme saved by another library copy (microfrontends)", testPreferenceSync);
});

/** The smallest config: no defaultLanguage, no languages, no loadLocale, no lang input. */
const minimalConfig: UiConfig = {
  appNameKey: "MIN",
  defaultTheme: "light",
  themes: ["light"],
};

function MinimalApp() {
  const page = <p>minimal page</p>;
  return (
    <SharedWebUiProvider config={minimalConfig}>
      <AppLayout>{page}</AppLayout>
    </SharedWebUiProvider>
  );
}

async function testWithoutLanguageSettings(): Promise<void> {
  render(<MinimalApp />);
  await screen.findByText("minimal page");
  expect(localeSignal.value).toBe("en-US");
  expect(document.documentElement.getAttribute("lang")).toBe("en-US");
  // The library's own English texts are used.
  expect(screen.getByRole("button", { name: "Collapse menu" })).toBeTruthy();
}

describe("Minimal config", function describeMinimalConfig() {
  afterEach(cleanup);
  it("works without defaultLanguage, languages, loadLocale and lang (en-US + built-in texts)", testWithoutLanguageSettings);
});

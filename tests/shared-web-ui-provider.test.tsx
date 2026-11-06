// Tests for SharedWebUiProvider + useUi: lazy locales, RTL, themes, localStorage restore.
import { afterEach, describe, it, mock } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SharedWebUiProvider, changeLanguage, changeTheme, useUi } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

function UiProbe() {
  const { locale, theme, direction, t } = useUi();
  const appName = t("app.name");
  const hello = t("hello", { name: "Asha" });
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="theme">{theme}</span>
      <span data-testid="direction">{direction}</span>
      <span data-testid="app-name">{appName}</span>
      <span data-testid="hello">{hello}</span>
    </div>
  );
}

function readText(testId: string): string {
  const element = screen.getByTestId(testId);
  return element.textContent ?? "";
}

async function renderProbe(): Promise<void> {
  render(
    <SharedWebUiProvider config={testConfig}>
      <UiProbe />
    </SharedWebUiProvider>,
  );
  await screen.findByTestId("locale");
}

function switchToArabic(): Promise<void> {
  return changeLanguage("ar");
}

function switchToFrench(): Promise<void> {
  return changeLanguage("fr");
}

function switchToDarkTheme(): void {
  changeTheme("dark");
}

function switchToUnknownTheme(): void {
  changeTheme("not-a-theme");
}

async function testDefaultsAndLazyLoad(): Promise<void> {
  await renderProbe();
  expect(readText("locale")).toBe("en");
  expect(readText("theme")).toBe("light");
  expect(readText("direction")).toBe("ltr");
  expect(readText("app-name")).toBe("Test App");
  expect(readText("hello")).toBe("Hello Asha");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
}

async function testSwitchLanguageAndRtl(): Promise<void> {
  await renderProbe();
  await act(switchToArabic);
  expect(readText("direction")).toBe("rtl");
  expect(readText("app-name")).toBe("تطبيق");
  expect(readText("hello")).toBe("Hello Asha");
  expect(document.documentElement.lang).toBe("ar");
  expect(document.documentElement.dir).toBe("rtl");
  expect(window.localStorage.getItem("TEST-LANG")).toBe("ar");
  await act(switchToFrench);
  expect(readText("hello")).toBe("Bonjour Asha");
  expect(document.documentElement.dir).toBe("ltr");
}

async function testSwitchTheme(): Promise<void> {
  await renderProbe();
  act(switchToDarkTheme);
  expect(readText("theme")).toBe("dark");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  expect(window.localStorage.getItem("TEST-THEME")).toBe("dark");
  act(switchToUnknownTheme);
  expect(readText("theme")).toBe("dark");
}

function ComponentWithoutProvider() {
  useUi();
  return null;
}

function renderWithoutProvider(): void {
  render(<ComponentWithoutProvider />);
}

function testUseUiOutsideProvider(): void {
  const consoleError = mock.method(console, "error", doNothing);
  expect(renderWithoutProvider).toThrow(/SharedWebUiProvider/);
  consoleError.mock.restore();
}

function doNothing(): void {
  // Silences React's error log in the test above.
}

describe("SharedWebUiProvider and useUi", function describeUiProvider() {
  afterEach(cleanup);
  it("loads the default language lazily and applies the default theme", testDefaultsAndLazyLoad);
  it("switches language, sets lang/dir and saves to localStorage", testSwitchLanguageAndRtl);
  it("switches theme, sets data-theme and ignores unknown themes", testSwitchTheme);
  it("throws a clear error outside SharedWebUiProvider", testUseUiOutsideProvider);
});

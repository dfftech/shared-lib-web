// layout-choice.test.tsx — the app layout choice (app / aside) kept in the library and synced like the theme.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  AppStorage,
  LAYOUT_CHOICE,
  PREFERENCE_EVENT,
  SettingsMenu,
  SharedWebUiProvider,
  changeLayoutChoice,
  layoutChoiceSignal,
  toLayoutChoice,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout, AsideLayout } from "../src/layout.ts";

const config: UiConfig = { appNameKey: "LAYOUTTEST", themes: ["light"] };

function SwitchableShell() {
  useSignals();
  const content = <p>switchable page</p>;
  return layoutChoiceSignal.value === "aside"
    ? <AsideLayout showSettings>{content}</AsideLayout>
    : <AppLayout><SettingsMenu showLayoutChoice />{content}</AppLayout>;
}

describe("layout choice", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    layoutChoiceSignal.value = "aside";
  });

  it("defaults to aside; only an explicit 'app' choice selects app", () => {
    expect(toLayoutChoice("aside")).toBe("aside");
    expect(toLayoutChoice("app")).toBe("app");
    expect(toLayoutChoice("single")).toBe("aside");
    expect(toLayoutChoice(null)).toBe("aside");
  });

  it("uses aside when there is no saved choice", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    expect(layoutChoiceSignal.value).toBe("aside");
  });

  it("uses the configured default when there is no saved choice", () => {
    const appDefaultConfig: UiConfig = { ...config, layout: { defaultLayout: "app" } };
    render(<SharedWebUiProvider config={appDefaultConfig}><p>page</p></SharedWebUiProvider>);
    expect(layoutChoiceSignal.value).toBe("app");
  });

  it("the provider reads the saved choice; changeLayoutChoice saves it", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    act(() => {
      changeLayoutChoice("aside");
    });
    expect(AppStorage.getText(LAYOUT_CHOICE)).toBe("aside");
    cleanup();
    layoutChoiceSignal.value = "aside";
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    expect(layoutChoiceSignal.value).toBe("aside");
  });

  it("switches the rendered shell when the settings choice changes", async () => {
    const appConfig: UiConfig = { ...config, layout: { defaultLayout: "app" } };
    render(
      <SharedWebUiProvider config={appConfig}>
        <SwitchableShell />
      </SharedWebUiProvider>,
    );
    const dialogButton = await screen.findByRole("button", { name: "Settings" });
    act(() => dialogButton.click());
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    act(() => within(dialog).getByRole("button", { name: "Aside layout" }).click());
    expect(await screen.findByText("switchable page")).toBeTruthy();
    expect(screen.queryByRole("banner")).toBeNull();
    const asideSettingsButton = await screen.findByRole("button", { name: "Settings" });
    act(() => asideSettingsButton.click());
    const asideDialog = screen.getByRole("dialog", { name: "Settings" });
    act(() => within(asideDialog).getByRole("button", { name: "App layout" }).click());
    expect(screen.getByRole("banner")).toBeTruthy();
  });

  it("follows a choice saved by another copy of the library (PREFERENCE_EVENT)", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    act(() => {
      localStorage.setItem("LAYOUTTEST-LAYOUT_CHOICE", "aside");
      window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { key: LAYOUT_CHOICE } }));
    });
    expect(layoutChoiceSignal.value).toBe("aside");
  });
});

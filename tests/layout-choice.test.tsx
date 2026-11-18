// layout-choice.test.tsx — the app layout choice (app / aside) kept in the library and synced like the theme.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render } from "@testing-library/react";
import {
  AppStorage,
  LAYOUT_CHOICE,
  PREFERENCE_EVENT,
  SharedWebUiProvider,
  changeLayoutChoice,
  layoutChoiceSignal,
  toLayoutChoice,
  type UiConfig,
} from "../src/index.ts";

const config: UiConfig = { appNameKey: "LAYOUTTEST", themes: ["light"] };

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

  it("follows a choice saved by another copy of the library (PREFERENCE_EVENT)", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    act(() => {
      localStorage.setItem("LAYOUTTEST-LAYOUT_CHOICE", "aside");
      window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { key: LAYOUT_CHOICE } }));
    });
    expect(layoutChoiceSignal.value).toBe("aside");
  });
});

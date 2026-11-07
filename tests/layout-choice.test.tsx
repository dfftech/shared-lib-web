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
    layoutChoiceSignal.value = "app";
  });

  it("only 'aside' is aside; anything else is 'app'", () => {
    expect(toLayoutChoice("aside")).toBe("aside");
    expect(toLayoutChoice("single")).toBe("app");
    expect(toLayoutChoice(null)).toBe("app");
  });

  it("the provider reads the saved choice; changeLayoutChoice saves it", () => {
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    act(() => {
      changeLayoutChoice("aside");
    });
    expect(AppStorage.getText(LAYOUT_CHOICE)).toBe("aside");
    cleanup();
    layoutChoiceSignal.value = "app";
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

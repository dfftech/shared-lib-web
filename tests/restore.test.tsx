// Saved language and theme are restored on refresh (separate file = fresh module state).
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { cleanup, render, screen } from "@testing-library/react";
import { SharedWebUiProvider, useUi } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

function RestoreProbe() {
  const { locale, theme, direction } = useUi();
  const summary = `${locale}|${theme}|${direction}`;
  return <span data-testid="summary">{summary}</span>;
}

async function testRestoreFromLocalStorage(): Promise<void> {
  window.localStorage.setItem("TEST-LANG", "ar");
  window.localStorage.setItem("TEST-THEME", "corporate");
  render(
    <SharedWebUiProvider config={testConfig}>
      <RestoreProbe />
    </SharedWebUiProvider>,
  );
  const summary = await screen.findByTestId("summary");
  expect(summary.textContent).toBe("ar|corporate|rtl");
  expect(document.documentElement.dir).toBe("rtl");
  cleanup();
}

describe("restore on refresh", function describeRestore() {
  it("restores the saved language and theme", testRestoreFromLocalStorage);
});

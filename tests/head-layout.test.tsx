// Tests for HeadLayout: the sticky page header with the title on the start side and actions on the end side,
// and TypeButton's form prop so a Submit button in the header can submit a form further down the page.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { HeadLayout, SharedWebUiProvider, TypeButton } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

let submitCount = 0;

function handleTestSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
  submitCount = submitCount + 1;
}

function HeadLayoutPage() {
  const actions = (
    <>
      <TypeButton action="ghost" label="Cancel" />
      <TypeButton type="submit" form="test-form" label="Submit" />
    </>
  );
  return (
    <SharedWebUiProvider config={testConfig}>
      <HeadLayout title="Edit user" actions={actions} />
      <form id="test-form" onSubmit={handleTestSubmit}>
        <input name="name" />
      </form>
    </SharedWebUiProvider>
  );
}

describe("HeadLayout", () => {
  afterEach(cleanup);

  it("shows the title and actions in a sticky bar under the app header", async () => {
    render(<HeadLayoutPage />);
    const heading = await screen.findByRole("heading", { name: "Edit user" });
    const bar = heading.closest("[data-head-layout]");
    expect(bar).not.toBeNull();
    const barClass = bar?.className ?? "";
    expect(barClass).toContain("sticky");
    expect(barClass).toContain("top-16");
    expect(barClass.includes("border-b")).toBe(true);
    expect(barClass).toContain("min-h-16");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("sticks at top-0 when there is no app header", async () => {
    render(
      <SharedWebUiProvider config={testConfig}>
        <HeadLayout title="Plain" isBelowHeader={false} isFullWidth={false} />
      </SharedWebUiProvider>,
    );
    const heading = await screen.findByRole("heading", { name: "Plain" });
    const barClass = heading.closest("[data-head-layout]")?.className ?? "";
    expect(barClass).toContain("top-0");
    expect(barClass).toContain("rounded-box");
  });

  it("submits the form through the form prop from outside the form", async () => {
    submitCount = 0;
    render(<HeadLayoutPage />);
    const submitButton = await screen.findByRole("button", { name: "Submit" });
    expect(submitButton.getAttribute("form")).toBe("test-form");
    fireEvent.click(submitButton);
    expect(submitCount).toBe(1);
  });
});

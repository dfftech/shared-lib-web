// layout.pageMode "path": pages live in the path (/settings) instead of ?page=settings.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  SharedWebUiProvider,
  buildPageHref,
  currentPageSignal,
  openPage,
  readPageFromLocation,
  useCurrentPage,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";
import { testConfig } from "./test-config.ts";

const pathConfig: UiConfig = { ...testConfig, appNameKey: "PATH", layout: { pageMode: "path" } };

function PathApp() {
  const page = useCurrentPage();
  const pageText = <p>page is {page}</p>;
  return (
    <SharedWebUiProvider config={pathConfig}>
      <AppLayout>{pageText}</AppLayout>
    </SharedWebUiProvider>
  );
}

function openUsers(): void {
  openPage("/group/users", { userId: "7" });
}

function waitForPopState(): Promise<void> {
  return new Promise<void>(resolveAfterPopState);
}

function resolveAfterPopState(resolve: () => void): void {
  window.addEventListener("popstate", resolve, { once: true });
}

async function testPathMode(): Promise<void> {
  window.history.pushState({}, "", "/settings");
  render(<PathApp />);
  await screen.findByText("page is /settings");
  expect(buildPageHref("/group/users")).toBe("/group/users");
  expect(buildPageHref("/")).toBe("/");
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  const homeLink = within(navigation).getByRole("link", { name: "Home page" });
  fireEvent.click(homeLink);
  expect(window.location.pathname).toBe("/");
  expect(screen.getByText("page is /")).toBeTruthy();
  act(openUsers);
  expect(window.location.pathname).toBe("/group/users");
  expect(window.location.search).toBe("?userId=7");
  expect(currentPageSignal.value).toBe("/group/users");
  const backDone = waitForPopState();
  window.history.back();
  await backDone;
  await screen.findByText("page is /");
  const location = new URL("http://host/forms?x=1");
  expect(readPageFromLocation(location)).toBe("/forms");
  window.history.pushState({}, "", "/");
}

describe("pageMode path", function describePathMode() {
  afterEach(cleanup);
  it("uses /settings instead of ?page=settings (links, openPage, back, readPageFromLocation)", testPathMode);
});

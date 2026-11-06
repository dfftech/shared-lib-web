// Tests for AppLayout: config-driven sidebar, switchers, pages by ?page query parameter (no router),
// mega menu and permissions.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  isSidebarCollapsedSignal,
  SharedWebUiProvider,
  canAccess,
  changeNavigationMode,
  currentPageSignal,
  findNavTrail,
  isDarkThemeName,
  openPage,
  readQueryParam,
  removeQueryParam,
  setQueryParam,
  splitThemesByMode,
  toggleSidebarCollapsed,
  useCurrentPage,
  useQueryParam,
  buildPageHref,
  toPagePath,
  toPageParamValue,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";
import type { ReactElement } from "react";
import { testConfig } from "./test-config.ts";

const testNavigation = testConfig.navigation ?? [];

function UsersPage() {
  return <h1>Users page content</h1>;
}

function UserDetailPage() {
  const userId = useQueryParam("userId");
  return <h1>User {userId}</h1>;
}

function SettingsPage() {
  return <h1>Settings page content</h1>;
}

function NotFound() {
  return <h1>Nothing here</h1>;
}

/** One component per page value (?page=...). The app decides; the library only keeps ?page. */
const PAGE_ELEMENTS: Record<string, ReactElement> = {
  "/group/users": <UsersPage />,
  "/settings": <SettingsPage />,
};

function readPageElement(page: string, userId: string | undefined): ReactElement {
  const hasUserId = Boolean(userId);
  if (page === "/group/users" && hasUserId) {
    return <UserDetailPage />;
  }
  return PAGE_ELEMENTS[page] ?? <NotFound />;
}

function ShellApp() {
  const page = useCurrentPage();
  const userId = useQueryParam("userId");
  const pageElement = readPageElement(page, userId);
  return <AppLayout>{pageElement}</AppLayout>;
}

async function renderShellAt(page: string): Promise<void> {
  const pageValue = toPageParamValue(page);
  window.history.pushState({}, "", `/?page=${pageValue}`);
  render(
    <SharedWebUiProvider config={testConfig}>
      <ShellApp />
    </SharedWebUiProvider>,
  );
  await screen.findByRole("main");
}

function readNavigation(): HTMLElement {
  return screen.getByRole("navigation", { name: "Main navigation" });
}

async function testSidebarFromConfig(): Promise<void> {
  await renderShellAt("/group/users");
  const navigation = readNavigation();
  expect(within(navigation).getByText("Home page")).toBeTruthy();
  expect(within(navigation).getByText("Group")).toBeTruthy();
  const usersLink = within(navigation).getByRole("link", { name: "Users" });
  expect(usersLink.className).toContain("menu-active");
  expect(usersLink.querySelector("svg")).not.toBeNull();
}

async function testHiddenWithoutReadPermission(): Promise<void> {
  await renderShellAt("/group/users");
  const navigation = readNavigation();
  expect(within(navigation).queryByText("Secret")).toBeNull();
}

function goToSettings(): void {
  openPage("/settings");
}

function showUser42(): void {
  setQueryParam("userId", "42");
}

function hideUser(): void {
  removeQueryParam("userId");
}

async function testPagesByQueryParam(): Promise<void> {
  await renderShellAt("/group/users");
  expect(screen.getByText("Users page content")).toBeTruthy();
  act(goToSettings);
  expect(window.location.pathname).toBe("/");
  expect(window.location.search).toBe("?page=settings");
  expect(currentPageSignal.value).toBe("/settings");
  expect(screen.getByText("Settings page content")).toBeTruthy();
}

async function testOldLinkWithSlash(): Promise<void> {
  window.history.pushState({}, "", "/?page=/settings");
  render(
    <SharedWebUiProvider config={testConfig}>
      <ShellApp />
    </SharedWebUiProvider>,
  );
  await screen.findByText("Settings page content");
  expect(currentPageSignal.value).toBe("/settings");
  expect(toPagePath("group/users")).toBe("/group/users");
  expect(toPageParamValue("/group/users")).toBe("group/users");
  expect(buildPageHref("/settings")).toBe("/?page=settings");
}

async function testSetAndReadQueryParam(): Promise<void> {
  await renderShellAt("/group/users");
  act(showUser42);
  expect(readQueryParam("userId")).toBe("42");
  expect(window.location.search).toContain("userId=42");
  expect(window.location.search).toContain("page=group/users");
  expect(screen.getByText("User 42")).toBeTruthy();
  act(hideUser);
  expect(readQueryParam("userId")).toBeUndefined();
  expect(screen.getByText("Users page content")).toBeTruthy();
}

function openSettingsFromUser(): void {
  openPage("/settings");
}

async function testOpenPageClearsOldParams(): Promise<void> {
  await renderShellAt("/group/users");
  act(showUser42);
  act(openSettingsFromUser);
  expect(window.location.search).toBe("?page=settings");
  expect(readQueryParam("userId")).toBeUndefined();
}

async function goBackInHistory(): Promise<void> {
  window.history.back();
  await waitForPopState();
}

function waitForPopState(): Promise<void> {
  return new Promise<void>(listenForPopStateOnce);
}

function listenForPopStateOnce(resolve: () => void): void {
  window.addEventListener("popstate", resolve, { once: true });
}

async function testBackButton(): Promise<void> {
  await renderShellAt("/group/users");
  act(goToSettings);
  expect(screen.getByText("Settings page content")).toBeTruthy();
  await act(goBackInHistory);
  expect(currentPageSignal.value).toBe("/group/users");
  expect(screen.getByText("Users page content")).toBeTruthy();
}

async function testLinkClickNavigates(): Promise<void> {
  await renderShellAt("/group/users");
  const navigation = readNavigation();
  const settingsLink = within(navigation).getByRole("link", { name: "Settings" });
  fireEvent.click(settingsLink);
  expect(screen.getByText("Settings page content")).toBeTruthy();
}

async function testUnknownPage(): Promise<void> {
  await renderShellAt("/does-not-exist");
  expect(screen.getByText("Nothing here")).toBeTruthy();
}

async function testPermissionOfCurrentScreen(): Promise<void> {
  await renderShellAt("/settings");
  expect(canAccess("read")).toBe(true);
  expect(canAccess("delete")).toBe(false);
}

function switchToMegaMenu(): void {
  changeNavigationMode("megamenu");
}

function switchToSidebar(): void {
  changeNavigationMode("sidebar");
}

async function testMegaMenu(): Promise<void> {
  await renderShellAt("/settings");
  act(switchToMegaMenu);
  const groupButton = screen.getByRole("button", { name: "Group" });
  fireEvent.click(groupButton);
  const panel = screen.getByRole("menu", { name: "Group" });
  expect(within(panel).getByText("Users")).toBeTruthy();
  expect(within(panel).getByText("All users of the app")).toBeTruthy();
  const usersCard = within(panel).getByRole("link", { name: /Users/ });
  fireEvent.click(usersCard);
  expect(screen.queryByRole("menu", { name: "Group" })).toBeNull();
  expect(screen.getByText("Users page content")).toBeTruthy();
  act(switchToSidebar);
}

function collapseSidebar(): void {
  toggleSidebarCollapsed();
}

async function testRailFlyout(): Promise<void> {
  await renderShellAt("/settings");
  act(collapseSidebar);
  const railButton = screen.getByRole("button", { name: "Group" });
  fireEvent.click(railButton);
  const flyout = screen.getByRole("menu", { name: "Group" });
  expect(within(flyout).getByRole("link", { name: "Users" })).toBeTruthy();
  fireEvent.keyDown(flyout, { key: "Escape" });
  expect(screen.queryByRole("menu", { name: "Group" })).toBeNull();
  act(collapseSidebar);
}

async function testCollapseButtonAtSidebarBottom(): Promise<void> {
  await renderShellAt("/settings");
  expect(isSidebarCollapsedSignal.value).toBe(false);
  const collapseButton = screen.getByRole("button", { name: "Collapse menu" });
  const banner = screen.getByRole("banner");
  expect(banner.contains(collapseButton)).toBe(false);
  const aside = collapseButton.closest("aside");
  expect(aside).not.toBeNull();
  const lastBar = aside?.lastElementChild ?? null;
  expect(lastBar?.contains(collapseButton)).toBe(true);
  fireEvent.click(collapseButton);
  expect(isSidebarCollapsedSignal.value).toBe(true);
  const expandButton = screen.getByRole("button", { name: "Expand menu" });
  fireEvent.click(expandButton);
  expect(isSidebarCollapsedSignal.value).toBe(false);
}

async function testRailTooltip(): Promise<void> {
  await renderShellAt("/settings");
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  const settingsLink = within(navigation).getByRole("link", { name: "Settings" });
  fireEvent.mouseOver(settingsLink);
  expect(screen.queryByRole("tooltip")).toBeNull();
  act(collapseSidebar);
  const railLink = within(navigation).getByRole("link", { name: "Settings" });
  fireEvent.mouseOver(railLink);
  const tooltip = screen.getByRole("tooltip");
  expect(tooltip.textContent).toBe("Settings");
  const railGroupButton = screen.getByRole("button", { name: "Group" });
  fireEvent.mouseOver(railGroupButton);
  expect(screen.getByRole("tooltip").textContent).toBe("Group");
  const aside = railGroupButton.closest("aside");
  if (aside) {
    fireEvent.mouseLeave(aside);
  }
  expect(screen.queryByRole("tooltip")).toBeNull();
  act(collapseSidebar);
}

async function testSwitchersUseConfigLists(): Promise<void> {
  await renderShellAt("/group/users");
  expect(screen.getByRole("button", { name: "English" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "العربية" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /corporate/ })).toBeTruthy();
  const lightTitle = screen.getByText("Light themes");
  const darkTitle = screen.getByText("Dark themes");
  expect(lightTitle.className).toContain("menu-title");
  expect(darkTitle.className).toContain("menu-title");
  const groups = splitThemesByMode(["light", "dark", "corporate", "dracula"]);
  expect(groups).toEqual({ lightThemes: ["light", "corporate"], darkThemes: ["dark", "dracula"] });
  expect(isDarkThemeName("dark")).toBe(true);
  expect(isDarkThemeName("corporate")).toBe(false);
}

function testFindNavTrail(): void {
  const trail = findNavTrail(testNavigation, "/group/users/42");
  const ids: string[] = [];
  for (const item of trail) {
    ids.push(item.id);
  }
  expect(ids).toEqual(["group", "users"]);
  const emptyTrail = findNavTrail(testNavigation, "/unknown");
  expect(emptyTrail).toEqual([]);
}

describe("AppLayout", function describeAppLayout() {
  afterEach(cleanup);
  it("builds the sidebar from config.navigation", testSidebarFromConfig);
  it("hides items without read permission", testHiddenWithoutReadPermission);
  it("switches pages with the ?page query parameter (no redirect)", testPagesByQueryParam);
  it("writes ?page without a leading slash and still reads old links", testOldLinkWithSlash);
  it("sets and reads other query parameters", testSetAndReadQueryParam);
  it("removes the old page parameters when a page opens", testOpenPageClearsOldParams);
  it("follows the back button", testBackButton);
  it("opens a page on link click without reload", testLinkClickNavigates);
  it("lets the app show its own component for unknown pages", testUnknownPage);
  it("reads the permissions of the current screen", testPermissionOfCurrentScreen);
  it("opens the full-width mega menu", testMegaMenu);
  it("opens the rail flyout when collapsed", testRailFlyout);
  it("shows a tooltip next to the collapsed rail", testRailTooltip);
  it("shows the collapse button fixed at the bottom of the sidebar", testCollapseButtonAtSidebarBottom);
  it("lists languages and themes (light and dark groups) from the config", testSwitchersUseConfigLists);
  it("finds the nav trail for nested paths", testFindNavTrail);
});

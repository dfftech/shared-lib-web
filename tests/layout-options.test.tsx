// Tests for the optional app shell: AppLayout options, own layouts built from the parts, and the main entry
// working without any layout.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import * as mainEntry from "../src/index.ts";
import {
  SharedWebUiProvider,
  changeNavigationMode,
  isDesktopSidebarSignal,
  isMenuVisibleSignal,
  isSidebarOpenSignal,
  openPage,
  setMenuVisible,
  toggleMenuVisible,
  UserMenu,
  isAsideLayoutSignal,
  isRailEverywhereSignal,
  isSmallScreenSignal,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout, AsideLayout, Header, SidebarNav } from "../src/layout.ts";
import { testConfig } from "./test-config.ts";

function OwnHeader() {
  return <header>My own header</header>;
}

function OwnSidebar() {
  return <aside>My own sidebar</aside>;
}

function OwnFooter() {
  return <footer>My footer</footer>;
}

/** A layout the project builds itself from the parts. */
function MainLayout() {
  return (
    <div className="flex">
      <aside className="w-64">
        <SidebarNav isAlwaysExpanded />
      </aside>
      <div className="flex-1">
        <Header showSwitchers={false} isStandalone />
        <main>
          <p>project page</p>
        </main>
      </div>
    </div>
  );
}

async function renderInProvider(content: React.ReactNode, readyText: string): Promise<void> {
  window.history.pushState({}, "", "/?page=group/users");
  render(<SharedWebUiProvider config={testConfig}>{content}</SharedWebUiProvider>);
  await screen.findByText(readyText);
}

async function testMainEntryHasNoShell(): Promise<void> {
  expect("AppLayout" in mainEntry).toBe(false);
  expect("Header" in mainEntry).toBe(false);
  expect("Sidebar" in mainEntry).toBe(false);
  expect("Breadcrumbs" in mainEntry).toBe(false);
  expect("AppBrand" in mainEntry).toBe(true);
  expect("TypeInput" in mainEntry).toBe(true);
  await renderInProvider(<p>no layout at all</p>, "no layout at all");
  expect(screen.getByText("no layout at all")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
}

async function testHideSidebar(): Promise<void> {
  const page = <p>header only</p>;
  await renderInProvider(<AppLayout showSidebar={false}>{page}</AppLayout>, "header only");
  expect(screen.getByText("header only")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
  expect(screen.getByRole("banner")).toBeTruthy();
}

async function testReplaceParts(): Promise<void> {
  const ownHeader = <OwnHeader />;
  const ownSidebar = <OwnSidebar />;
  const ownFooter = <OwnFooter />;
  const page = <p>page</p>;
  await renderInProvider(
    <AppLayout header={ownHeader} sidebar={ownSidebar} footer={ownFooter}>
      {page}
    </AppLayout>,
    "page",
  );
  expect(screen.getByText("My own header")).toBeTruthy();
  expect(screen.getByText("My own sidebar")).toBeTruthy();
  expect(screen.getByText("My footer")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
}

function openSettingsPage(): void {
  openPage("/settings");
}

async function testMainLayoutFromParts(): Promise<void> {
  const mainLayout = <MainLayout />;
  await renderInProvider(mainLayout, "project page");
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  const usersLink = within(navigation).getByRole("link", { name: "Users" });
  expect(usersLink.className).toContain("menu-active");
  expect(screen.queryByRole("button", { name: "English" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Collapse menu" })).toBeNull();
  const menuButton = screen.getByRole("button", { name: "Open menu" });
  fireEvent.click(menuButton);
  expect(isSidebarOpenSignal.value).toBe(true);
  act(openSettingsPage);
  expect(isSidebarOpenSignal.value).toBe(false);
  const settingsLink = within(navigation).getByRole("link", { name: "Settings" });
  expect(settingsLink.className).toContain("menu-active");
}

function hideMenu(): void {
  setMenuVisible(false);
}

function showMenu(): void {
  setMenuVisible(true);
}

function switchToMegaMenu(): void {
  changeNavigationMode("megamenu");
}

function switchToSidebarMode(): void {
  changeNavigationMode("sidebar");
}

function readMainNavigation(): HTMLElement | null {
  return screen.queryByRole("navigation", { name: "Main navigation" });
}

async function testMenuOnOffAtRuntime(): Promise<void> {
  const page = <p>menu page</p>;
  await renderInProvider(<AppLayout>{page}</AppLayout>, "menu page");
  expect(readMainNavigation()).not.toBeNull();
  act(hideMenu);
  expect(readMainNavigation()).toBeNull();
  expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Collapse menu" })).toBeNull();
  expect(screen.getByText("menu page")).toBeTruthy();
  act(showMenu);
  expect(readMainNavigation()).not.toBeNull();
  act(toggleMenuVisible);
  expect(isMenuVisibleSignal.value).toBe(false);
  act(toggleMenuVisible);
  expect(isMenuVisibleSignal.value).toBe(true);
}

async function testMegaMenuOnOff(): Promise<void> {
  const page = <p>mega page</p>;
  await renderInProvider(<AppLayout>{page}</AppLayout>, "mega page");
  act(switchToMegaMenu);
  expect(screen.getByRole("button", { name: "Group" })).toBeTruthy();
  act(hideMenu);
  expect(screen.queryByRole("button", { name: "Group" })).toBeNull();
  act(showMenu);
  expect(screen.getByRole("button", { name: "Group" })).toBeTruthy();
  act(switchToSidebarMode);
}

async function testSidebarNavFollowsMenuSwitch(): Promise<void> {
  const mainLayout = <MainLayout />;
  await renderInProvider(mainLayout, "project page");
  expect(readMainNavigation()).not.toBeNull();
  act(hideMenu);
  expect(readMainNavigation()).toBeNull();
  act(showMenu);
}

const menuOffConfig: UiConfig = { ...testConfig, layout: { ...testConfig.layout, showMenu: false } };

async function testMenuOffFromConfig(): Promise<void> {
  window.history.pushState({}, "", "/");
  const page = <p>no menu at start</p>;
  render(
    <SharedWebUiProvider config={menuOffConfig}>
      <AppLayout>{page}</AppLayout>
    </SharedWebUiProvider>,
  );
  await screen.findByText("no menu at start");
  expect(readMainNavigation()).toBeNull();
  act(showMenu);
  expect(readMainNavigation()).not.toBeNull();
}

async function testSidebarNavInMegaMenuMode(): Promise<void> {
  const mainLayout = <MainLayout />;
  await renderInProvider(mainLayout, "project page");
  expect(isDesktopSidebarSignal.value).toBe(true);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  const hasHiddenClass = navigation.className.includes("lg:hidden");
  expect(hasHiddenClass).toBe(false);
  act(switchToMegaMenu);
  expect(isDesktopSidebarSignal.value).toBe(false);
  const megaNavigation = screen.getAllByRole("navigation", { name: "Main navigation" });
  const sidebarNavigation = megaNavigation.find(isSidebarNav);
  expect(sidebarNavigation?.className).toContain("lg:hidden");
  act(switchToSidebarMode);
  act(hideMenu);
  expect(isDesktopSidebarSignal.value).toBe(false);
  act(showMenu);
}

function isSidebarNav(element: HTMLElement): boolean {
  return element.className.includes("overflow-y-auto");
}

async function testSidebarUser(): Promise<void> {
  const sidebarUser = <UserMenu isInSidebar name="Asha Rao" email="asha@example.com" />;
  const page = <p>user page</p>;
  await renderInProvider(<AppLayout sidebarUser={sidebarUser}>{page}</AppLayout>, "user page");
  const accountButton = screen.getByRole("button", { name: "Account" });
  const aside = accountButton.closest("aside");
  expect(aside).not.toBeNull();
  const nameTexts = within(accountButton).getAllByText("Asha Rao");
  expect(nameTexts.length).toBe(1);
  expect(within(accountButton).getByText("asha@example.com")).toBeTruthy();
}

function setSmallScreen(): void {
  isSmallScreenSignal.value = true;
}

function setLargeScreen(): void {
  isSmallScreenSignal.value = false;
}

async function testAsideLayout(): Promise<void> {
  act(switchToMegaMenu);
  const sidebarUser = <UserMenu isInSidebar name="Asha Rao" />;
  const page = <p>aside page</p>;
  const view = render(
    <SharedWebUiProvider config={testConfig}>
      <AsideLayout sidebarUser={sidebarUser}>{page}</AsideLayout>
    </SharedWebUiProvider>,
  );
  await screen.findByText("aside page");
  // No top header, the side menu is there even in "megamenu" mode, settings at the bottom.
  expect(screen.queryByRole("banner")).toBeNull();
  expect(isAsideLayoutSignal.value).toBe(true);
  expect(isDesktopSidebarSignal.value).toBe(true);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(navigation.className.includes("lg:hidden")).toBe(false);
  expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
  expect(screen.getByRole("button", { name: "Account" })).toBeTruthy();
  // Small screens: always the icon rail.
  expect(isRailEverywhereSignal.value).toBe(false);
  act(setSmallScreen);
  expect(isRailEverywhereSignal.value).toBe(true);
  const usersLink = within(navigation).getByRole("link", { name: "Users" });
  const aside = usersLink.closest("aside");
  expect(aside?.className.includes("w-20")).toBe(true);
  act(setLargeScreen);
  view.unmount();
  expect(isAsideLayoutSignal.value).toBe(false);
  act(switchToSidebarMode);
}

describe("Optional layout", function describeOptionalLayout() {
  afterEach(cleanup);
  it("main entry has components but no app shell", testMainEntryHasNoShell);
  it("AppLayout shows the user at the bottom of the sidebar", testSidebarUser);
  it("AsideLayout has no header, no mega menu and a rail on small screens", testAsideLayout);
  it("AppLayout can hide the sidebar", testHideSidebar);
  it("AppLayout can take an own header, sidebar and footer", testReplaceParts);
  it("a project builds MainLayout from Header and SidebarNav", testMainLayoutFromParts);
  it("switches the menu on and off at runtime", testMenuOnOffAtRuntime);
  it("hides the mega menu bar when the menu is off", testMegaMenuOnOff);
  it("SidebarNav follows the menu switch", testSidebarNavFollowsMenuSwitch);
  it("starts without menu when config.layout.showMenu is false", testMenuOffFromConfig);
  it("SidebarNav hides on desktop in mega menu mode (isDesktopSidebarSignal)", testSidebarNavInMegaMenuMode);
});

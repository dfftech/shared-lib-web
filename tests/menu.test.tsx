// Tests for backend menus: toNavigation(), setMenu() and config.loadMenuNavigation.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { BackendData } from "./backend-data.tsx";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import {
  SharedWebUiProvider,
  canAccess,
  changeLanguage,
  clearMenu,
  openPage,
  navigationLoadingSignal,
  navigationSignal,
  setMenu,
  toNavigation,
  type MenuSource,
  type NavItem,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";
import { adminMenuResponse } from "./admin-menu-response.ts";
import { testConfig } from "./test-config.ts";

const menuConfig: UiConfig = { ...testConfig, navigation: undefined };

function readIds(items: NavItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    ids.push(item.id);
  }
  return ids;
}

function readChildIds(items: NavItem[], groupIndex: number): string[] {
  const group = items[groupIndex];
  const children = group.children ?? [];
  return readIds(children);
}

function readNavigation(): HTMLElement {
  return screen.getByRole("navigation", { name: "Main navigation" });
}

interface MenuShellProps {
  nav: MenuSource | null;
}

function MenuShell(props: MenuShellProps) {
  return (
    <SharedWebUiProvider config={menuConfig}>
      <BackendData nav={props.nav} />
      <AppLayout>
        <p>page</p>
      </AppLayout>
    </SharedWebUiProvider>
  );
}

async function renderWithMenu(menu: MenuSource | null): Promise<void> {
  render(<MenuShell nav={menu} />);
  await screen.findByRole("main");
}

function testRootGroupIsFlattened(): void {
  const navItems = toNavigation(adminMenuResponse);
  const ids = readIds(navItems);
  expect(ids).toEqual(["ADMIN_DASHBOARD", "ADMIN_PRODUCTS", "ADMIN_ADMINISTRATOR", "ADMIN_SETTINGS"]);
}

function testSamePriorityKeepsBackendOrder(): void {
  const navItems = toNavigation(adminMenuResponse);
  const childIds = readChildIds(navItems, 2);
  const expectedIds = [
    "ADMIN_ADMINISTRATOR_BRANCHES",
    "ADMIN_ADMINISTRATOR_PROFILES",
    "ADMIN_ADMINISTRATOR_BRANCH_MANAGEMENT",
    "ADMIN_ADMINISTRATOR_ROLE_ASSIGNOR",
  ];
  expect(childIds).toEqual(expectedIds);
}

function testIconsAndPermissions(): void {
  const navItems = toNavigation(adminMenuResponse);
  expect(navItems[0].icon).toBe("LayoutDashboard");
  expect(navItems[0].path).toBe("/dashboard");
  const settingsChildren = navItems[3].children ?? [];
  expect(settingsChildren[0].icon).toBe("Menu");
  expect(settingsChildren[1].icon).toBe("UserRoundKey");
  expect(settingsChildren[1].permissions).toEqual({ read: true, create: true, update: true, delete: true });
  expect(navItems[2].permissions).toEqual({ read: true, create: false, update: false, delete: false });
}

function testPlainListAndOptions(): void {
  const listItems = toNavigation(adminMenuResponse.data);
  expect(listItems.length).toBe(4);
  const keptItems = toNavigation(adminMenuResponse, { isRootFlattened: false });
  const keptIds = readIds(keptItems);
  expect(keptIds).toEqual(["ADMIN_ROOT", "ADMIN_ADMINISTRATOR", "ADMIN_SETTINGS"]);
  const emptyItems = toNavigation(null);
  expect(emptyItems).toEqual([]);
}

async function testProviderMenuProp(): Promise<void> {
  await renderWithMenu(adminMenuResponse);
  const navigation = readNavigation();
  expect(within(navigation).getByRole("link", { name: "Dashboard" })).toBeTruthy();
  expect(within(navigation).getByText("Administrator")).toBeTruthy();
  expect(within(navigation).queryByText("Root")).toBeNull();
}

async function testNullMenuShowsLoading(): Promise<void> {
  await renderWithMenu(null);
  expect(navigationLoadingSignal.value).toBe(true);
  act(applyAdminMenu);
  expect(navigationLoadingSignal.value).toBe(false);
  const navigation = readNavigation();
  expect(within(navigation).getByRole("link", { name: "Products" })).toBeTruthy();
}

async function testNavPropNullThenData(): Promise<void> {
  const view = render(<MenuShell nav={null} />);
  await screen.findByRole("main");
  expect(navigationLoadingSignal.value).toBe(true);
  // The backend reply arrives later: a new value for the same prop.
  view.rerender(<MenuShell nav={adminMenuResponse} />);
  expect(navigationLoadingSignal.value).toBe(false);
  const navigation = readNavigation();
  expect(within(navigation).getByRole("link", { name: "Dashboard" })).toBeTruthy();
  // Logout -> null again, then a new reply (another persona).
  view.rerender(<MenuShell nav={null} />);
  expect(navigationLoadingSignal.value).toBe(true);
  const nextReply: MenuSource = { data: adminMenuResponse.data.slice(1) };
  view.rerender(<MenuShell nav={nextReply} />);
  const nextNavigation = readNavigation();
  expect(within(nextNavigation).queryByRole("link", { name: "Dashboard" })).toBeNull();
  expect(within(nextNavigation).getByText("Administrator")).toBeTruthy();
}

function applyAdminMenu(): void {
  setMenu(adminMenuResponse);
}

function goToAdministratorGroup(): void {
  openPage("/stores");
}

async function testMenuPermissionsForScreen(): Promise<void> {
  await renderWithMenu(adminMenuResponse);
  act(goToAdministratorGroup);
  expect(canAccess("update")).toBe(true);
}

const multiLanguageMenu: MenuSource = [
  { id: "HOME", name: "Home", nameLang: { "en-US": "Home", "fr-FR": "Accueil", "ar-SA": "الرئيسية" }, href: "/", priority: 1 },
  { id: "ONLY_NAME", name: "Reports", nameLang: { "en-US": "Reports" }, href: "/reports", priority: 2 },
];

async function switchToFrench(): Promise<void> {
  await changeLanguage("fr");
}

async function switchToArabic(): Promise<void> {
  await changeLanguage("ar");
}

async function testMultiLanguageLabels(): Promise<void> {
  await renderWithMenu(multiLanguageMenu);
  const navigation = readNavigation();
  expect(within(navigation).getByRole("link", { name: "Home" })).toBeTruthy();
  await act(switchToFrench);
  expect(within(navigation).getByRole("link", { name: "Accueil" })).toBeTruthy();
  expect(within(navigation).getByRole("link", { name: "Reports" })).toBeTruthy();
  await act(switchToArabic);
  expect(within(navigation).getByRole("link", { name: "الرئيسية" })).toBeTruthy();
  expect(document.documentElement.dir).toBe("rtl");
}

function testClearMenu(): void {
  setMenu(adminMenuResponse);
  clearMenu();
  expect(navigationSignal.value).toEqual([]);
}

describe("Backend menu", function describeBackendMenu() {
  afterEach(cleanup);
  it("moves the Root group children to the top level", testRootGroupIsFlattened);
  it("keeps the backend order for the same priority", testSamePriorityKeepsBackendOrder);
  it("converts icon names and permission flags", testIconsAndPermissions);
  it("accepts the plain list and options", testPlainListAndOptions);
  it("shows the menu passed to the provider", testProviderMenuProp);
  it("shows a skeleton while the menu is null", testNullMenuShowsLoading);
  it("starts with nav null and shows the data when it arrives", testNavPropNullThenData);
  it("uses menu permissions for the current screen", testMenuPermissionsForScreen);
  it("shows nameLang in the current language", testMultiLanguageLabels);
  it("clears the menu", testClearMenu);
});

// Tests for menu conversion, option lists, TypeFilter, TypeSearch, progress, settings menu and markdown.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import {
  SettingsMenu,
  SharedWebUiProvider,
  ShowProgress,
  TypeFilter,
  TypeSearch,
  progressSignal,
  readCountryOptions,
  readSearchText,
  readTelCode,
  readTelCodeOptions,
  themeSignal,
  toNavItems,
  type MenuAccessType,
} from "../src/index.ts";
import { TypeMdv } from "../src/markdown.ts";
import { testConfig } from "./test-config.ts";

const backendMenus: MenuAccessType[] = [
  { id: "settings", name: "Settings", href: "/settings", priority: 3 },
  {
    id: "profiles",
    name: "Profiles",
    nameLang: { fr: "Profils" },
    priority: 1,
    type: "group",
    children: [
      { id: "users", name: "Users", href: "/users", icon: "Users", read: true, update: false, priority: 2 },
      { id: "old", name: "Old", href: "/old", active: false },
    ],
  },
];

function testToNavItems(): void {
  const navItems = toNavItems(backendMenus);
  expect(navItems[0]?.id).toBe("profiles");
  expect(navItems[0]?.labelLang).toEqual({ fr: "Profils" });
  const children = navItems[0]?.children ?? [];
  expect(children.length).toBe(1);
  expect(children[0]?.path).toBe("/users");
  expect(children[0]?.permissions?.update).toBe(false);
  expect(navItems[1]?.id).toBe("settings");
}

function testOptionLists(): void {
  const countries = readCountryOptions();
  const india = countries.find(isIndia);
  expect(india?.label).toBe("India");
  const telCodes = readTelCodeOptions();
  expect(telCodes.length).toBe(countries.length);
  expect(readTelCode("IN")).toBe("+91");
}

function isIndia(option: { key: string | number }): boolean {
  return option.key === "IN";
}

const filterValues: string[] = [];

function recordFilter(event: ChangeEvent<HTMLSelectElement>): void {
  filterValues.push(event.currentTarget.value);
}

const searchedTexts: string[] = [];

function recordSearch(event: FormEvent<HTMLFormElement>): void {
  const text = readSearchText(event);
  searchedTexts.push(text);
}

async function renderInProvider(element: React.ReactElement, readyText: string): Promise<void> {
  render(
    <SharedWebUiProvider config={testConfig}>
      {element}
      <span>{readyText}</span>
    </SharedWebUiProvider>,
  );
  await screen.findByText(readyText);
}

async function testFilterAndSearch(): Promise<void> {
  const options = [{ key: "admin", label: "Admin" }];
  await renderInProvider(
    <>
      <TypeFilter label="Role" options={options} value="" onChange={recordFilter} />
      <TypeSearch name="users" label="Find users" onSearch={recordSearch} />
    </>,
    "filters-ready",
  );
  const select = screen.getByLabelText("Role");
  expect(within(select).getByText("All")).toBeTruthy();
  fireEvent.change(select, { target: { value: "admin" } });
  expect(filterValues).toEqual(["admin"]);
  const searchBox = screen.getByRole("searchbox", { name: "Find users" });
  fireEvent.change(searchBox, { target: { value: "asha" } });
  const searchForm = screen.getByRole("search");
  fireEvent.submit(searchForm);
  expect(searchedTexts).toEqual(["asha"]);
}

function startTwoRequests(): void {
  ShowProgress(true);
  ShowProgress(true);
}

function finishOneRequest(): void {
  ShowProgress(false);
}

async function testProgress(): Promise<void> {
  await renderInProvider(<span />, "progress-ready");
  act(startTwoRequests);
  expect(screen.getByRole("progressbar")).toBeTruthy();
  act(finishOneRequest);
  expect(progressSignal.value).toBe(true);
  act(finishOneRequest);
  expect(screen.queryByRole("progressbar")).toBeNull();
}

async function testSettingsMenu(): Promise<void> {
  await renderInProvider(<SettingsMenu />, "settings-ready");
  const settingsButton = screen.getByRole("button", { name: "Settings" });
  fireEvent.click(settingsButton);
  const dialog = screen.getByRole("dialog", { name: "Settings" });
  const darkButton = within(dialog).getByRole("button", { name: "dark" });
  fireEvent.click(darkButton);
  expect(themeSignal.value).toBe("dark");
  expect(within(dialog).getByRole("button", { name: "Mega menu" })).toBeTruthy();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
}

async function testMarkdownViewer(): Promise<void> {
  await renderInProvider(<TypeMdv text={"# Hello\n\n**bold** text"} />, "markdown-ready");
  expect(await screen.findByRole("heading", { name: "Hello" })).toBeTruthy();
  expect(screen.getByText("bold").tagName).toBe("STRONG");
}

describe("extras", function describeExtras() {
  afterEach(cleanup);
  it("turns backend menus into nav items", testToNavItems);
  it("builds country and phone code options from dff-util", testOptionLists);
  it("TypeFilter and TypeSearch report values", testFilterAndSearch);
  it("ShowProgress counts parallel requests", testProgress);
  it("SettingsMenu switches theme and closes on Escape", testSettingsMenu);
  it("TypeMdv renders markdown", testMarkdownViewer);
});

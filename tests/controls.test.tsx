// Tests for the extra Type* controls, overlays and utils.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import {
  AppStorage,
  SharedWebUiProvider,
  TypeConfirm,
  TypeDate,
  TypeDrawer,
  TypeLang,
  TypeList,
  TypeOtp,
  TypeTable,
  changeLanguage,
  formatDateInputValue,
  trans,
} from "../src/index.ts";
import { testConfig } from "./test-config.ts";

/** Fake translation service: answers like lingva.ml with "<text> (<target>)". */
async function fakeTranslateFetch(input: string | URL | Request): Promise<Response> {
  const url = String(input);
  const urlParts = url.split("/");
  const encodedText = urlParts[urlParts.length - 1] ?? "";
  const target = urlParts[urlParts.length - 2] ?? "";
  const text = decodeURIComponent(encodedText);
  const body = JSON.stringify({ translation: `${text} (${target})` });
  return new Response(body, { status: 200 });
}

interface ControlsForm {
  code: string;
  colors: string[];
  startDate: string;
  title: Record<string, string>;
}

const controlsDefaults: ControlsForm = { code: "", colors: [], startDate: "", title: { en: "Hello" } };

const colorOptions = [
  { key: "red", label: "Red", lang: { en: "Red (en)" } },
  { key: "blue", label: "Blue" },
];

const submittedValues: ControlsForm[] = [];

function saveControls(values: ControlsForm): void {
  submittedValues.push(values);
}

function ControlsDemo() {
  const formOptions = { defaultValues: controlsDefaults };
  const form = useForm<ControlsForm>(formOptions);
  const onSubmit = form.handleSubmit(saveControls);
  return (
    <form onSubmit={onSubmit}>
      <TypeOtp control={form.control} name="code" label="Code" length={4} />
      <TypeList control={form.control} name="colors" label="Colors" options={colorOptions} />
      <TypeDate control={form.control} name="startDate" label="Start" />
      <TypeLang control={form.control} name="title" label="Title" />
      <button type="submit">Send</button>
    </form>
  );
}

async function renderInProvider(element: React.ReactElement): Promise<void> {
  render(<SharedWebUiProvider config={testConfig}>{element}</SharedWebUiProvider>);
  await screen.findByRole("form", {}, { timeout: 50 }).catch(ignoreMissing);
}

function ignoreMissing(): null {
  return null;
}

function clickSend(): void {
  const sendButton = screen.getByRole("button", { name: "Send" });
  fireEvent.click(sendButton);
}

async function submitControls(): Promise<void> {
  await act(clickSend);
}

async function testFormControls(): Promise<void> {
  submittedValues.length = 0;
  await renderInProvider(<ControlsDemo />);
  const codeInput = await screen.findByLabelText("Code");
  fireEvent.change(codeInput, { target: { value: "1234" } });
  const redBox = screen.getByLabelText("Red (en)");
  fireEvent.click(redBox);
  const blueBox = screen.getByLabelText("Blue");
  fireEvent.click(blueBox);
  const dateInput = screen.getByLabelText("Start");
  fireEvent.change(dateInput, { target: { value: "2026-11-05" } });
  await submitControls();
  const saved = submittedValues[0];
  expect(saved?.code).toBe("1234");
  expect(saved?.colors).toEqual(["red", "blue"]);
  expect(saved?.startDate).toBe("2026-11-05");
}

function clickFrenchTranslate(): void {
  const titleGroup = screen.getByRole("group", { name: "Title" });
  const translateButtons = within(titleGroup).getAllByRole("button", { name: "Translate" });
  const firstButton = translateButtons[0];
  if (firstButton) {
    fireEvent.click(firstButton);
  }
}

async function waitForTranslation(): Promise<void> {
  await new Promise<void>(resolveSoon);
}

function resolveSoon(resolve: () => void): void {
  setTimeout(resolve, 10);
}

async function testTypeLangTranslate(): Promise<void> {
  submittedValues.length = 0;
  await renderInProvider(<ControlsDemo />);
  const titleGroup = await screen.findByRole("group", { name: "Title" });
  const inputs = within(titleGroup).getAllByRole("textbox");
  expect(inputs.length).toBe(3);
  expect(inputs[0]?.getAttribute("lang")).toBe("en");
  globalThis.fetch = fakeTranslateFetch as typeof fetch;
  await act(clickFrenchTranslate);
  await act(waitForTranslation);
  expect(inputs[1]).toHaveProperty("value", "Hello (fr)");
}

let cancelCount = 0;

function countCancel(): void {
  cancelCount += 1;
}

function doNothing(): void {
  // Not used in this test.
}

async function testConfirmEscape(): Promise<void> {
  cancelCount = 0;
  await renderInProvider(
    <TypeConfirm isOpen title="Delete user?" message="This cannot be undone." tone="error" onConfirm={doNothing} onCancel={countCancel} />,
  );
  const dialog = await screen.findByRole("dialog", { name: "Delete user?" });
  const cancelButton = within(dialog).getByRole("button", { name: "Cancel" });
  expect(document.activeElement).toBe(cancelButton);
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(cancelCount).toBe(1);
}

async function testDrawer(): Promise<void> {
  cancelCount = 0;
  await renderInProvider(
    <TypeDrawer isOpen title="Edit" subTitle="User 42" onClose={countCancel}>
      Drawer body
    </TypeDrawer>,
  );
  const dialog = await screen.findByRole("dialog", { name: "Edit" });
  expect(within(dialog).getByText("Drawer body")).toBeTruthy();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(cancelCount).toBe(1);
}

async function testTableEmptyState(): Promise<void> {
  const columns = [{ key: "name" as const, headerKey: "Name" }];
  await renderInProvider(<TypeTable rows={[]} columns={columns} rowKey="name" />);
  expect(await screen.findByText("No data found")).toBeTruthy();
}

function switchToFrench(): Promise<void> {
  return changeLanguage("fr");
}

async function testTrans(): Promise<void> {
  await renderInProvider(<span>ready</span>);
  await screen.findByText("ready");
  await act(switchToFrench);
  expect(trans({ en: "Users", "fr-FR": "Utilisateurs" }, "Default")).toBe("Utilisateurs");
  expect(trans({ en: "Users" }, "Default")).toBe("Default");
  expect(trans(undefined, "Default")).toBe("Default");
}

async function testAppStorage(): Promise<void> {
  await renderInProvider(<span>storage</span>);
  AppStorage.setData("TOKEN", "abc");
  AppStorage.setData("PROFILE", { name: "Asha" });
  AppStorage.setData("THEME", "dark");
  AppStorage.setData("REMEMBER_ME", true);
  // Only the preference keys go to localStorage; everything else is sessionStorage.
  expect(window.sessionStorage.getItem("TEST-TOKEN")).toBe("abc");
  expect(window.localStorage.getItem("TEST-TOKEN")).toBeNull();
  expect(window.sessionStorage.getItem("TEST-PROFILE")).toBe('{"name":"Asha"}');
  expect(window.localStorage.getItem("TEST-THEME")).toBe("dark");
  expect(window.localStorage.getItem("TEST-REMEMBER_ME")).toBe("true");
  expect(AppStorage.getData("PROFILE")).toEqual({ name: "Asha" });
  AppStorage.clearData(["PROFILE"]);
  expect(AppStorage.getData("TOKEN")).toBeNull();
  expect(AppStorage.getData("PROFILE")).toEqual({ name: "Asha" });
  expect(AppStorage.getData("THEME")).toBe("dark");
  // Old values in localStorage that are not preferences are removed.
  window.localStorage.setItem("TEST-NAV", "[]");
  AppStorage.cleanLocalStorage();
  expect(window.localStorage.getItem("TEST-NAV")).toBeNull();
  expect(window.localStorage.getItem("TEST-THEME")).toBe("dark");
  AppStorage.removeData("THEME");
  AppStorage.removeData("REMEMBER_ME");
  AppStorage.removeData("PROFILE");
}

function testFormatDate(): void {
  const date = new Date(2026, 10, 5, 9, 7);
  expect(formatDateInputValue(date, false)).toBe("2026-11-05");
  expect(formatDateInputValue(date, true)).toBe("2026-11-05T09:07");
}

describe("Type* controls, overlays and utils", function describeControls() {
  afterEach(cleanup);
  it("TypeOtp, TypeList and TypeDate give form values", testFormControls);
  it("TypeLang shows all config languages and translates", testTypeLangTranslate);
  it("TypeConfirm focuses Cancel and closes on Escape", testConfirmEscape);
  it("TypeDrawer closes on Escape", testDrawer);
  it("TypeTable shows the empty state", testTableEmptyState);
  it("trans() picks the current language", testTrans);
  it("AppStorage uses the config prefix", testAppStorage);
  it("formats dates for date inputs", testFormatDate);
});

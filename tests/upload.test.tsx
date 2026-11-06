// Tests for TypeUpload, file helpers and the reusable utils ported from the existing apps.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import {
  SharedWebUiProvider,
  TypeUpload,
  decryptResponse,
  encryptPayload,
  formatBytes,
  isFileTypeAllowed,
  normalizeFileTypes,
  parseSizeToBytes,
  resolveLucideIcon,
  toOptionTypes,
  unwrapRootMenu,
} from "../src/index.ts";
import { testConfig } from "./test-config.ts";

interface UploadForm {
  csvFile: File | null;
  photos: File[];
}

const uploadDefaults: UploadForm = { csvFile: null, photos: [] };
const submittedUploads: UploadForm[] = [];

function saveUploads(values: UploadForm): void {
  submittedUploads.push(values);
}

function UploadDemo() {
  const formOptions = { defaultValues: uploadDefaults };
  const form = useForm<UploadForm>(formOptions);
  const onSubmit = form.handleSubmit(saveUploads);
  return (
    <form onSubmit={onSubmit}>
      <TypeUpload control={form.control} name="csvFile" label="CSV file" fileType="csv" maxSize="1KB" />
      <TypeUpload control={form.control} name="photos" label="Photos" fileType="image/*" maxSize="1KB" isMultiple totalSize="1.5KB" />
      <button type="submit">Send</button>
    </form>
  );
}

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = "x".repeat(sizeBytes);
  return new File([content], name, { type: type });
}

function readUploadInput(label: string): HTMLInputElement {
  const group = screen.getByRole("group", { name: label });
  const input = group.querySelector<HTMLInputElement>("input[type=file]");
  if (!input) {
    throw new Error("file input missing");
  }
  return input;
}

function pickFiles(label: string, files: File[]): void {
  const input = readUploadInput(label);
  fireEvent.change(input, { target: { files: files } });
}

function clickSend(): void {
  const sendButton = screen.getByRole("button", { name: "Send" });
  fireEvent.click(sendButton);
}

async function renderUploadDemo(): Promise<void> {
  render(
    <SharedWebUiProvider config={testConfig}>
      <UploadDemo />
    </SharedWebUiProvider>,
  );
  await screen.findByRole("group", { name: "CSV file" });
}

async function testSingleUpload(): Promise<void> {
  submittedUploads.length = 0;
  await renderUploadDemo();
  const csvGroup = screen.getByRole("group", { name: "CSV file" });
  expect(within(csvGroup).getByText("Supports CSV files.")).toBeTruthy();
  expect(within(csvGroup).getByText("Max file size: 1 KB")).toBeTruthy();
  const csvFile = makeFile("products.csv", "text/csv", 500);
  pickFiles("CSV file", [csvFile]);
  expect(within(csvGroup).getByText("products.csv")).toBeTruthy();
  await act(clickSend);
  expect(submittedUploads[0]?.csvFile?.name).toBe("products.csv");
}

async function testRejectsWrongTypeAndSize(): Promise<void> {
  await renderUploadDemo();
  const csvGroup = screen.getByRole("group", { name: "CSV file" });
  const pdfFile = makeFile("report.pdf", "application/pdf", 100);
  pickFiles("CSV file", [pdfFile]);
  expect(within(csvGroup).getByRole("alert").textContent).toContain("not an allowed file type");
  const bigFile = makeFile("big.csv", "text/csv", 5000);
  pickFiles("CSV file", [bigFile]);
  expect(within(csvGroup).getByRole("alert").textContent).toContain("larger than the allowed 1 KB");
  expect(within(csvGroup).queryByText("big.csv")).toBeNull();
}

async function testMultipleWithTotalLimitAndRemove(): Promise<void> {
  await renderUploadDemo();
  const photoGroup = screen.getByRole("group", { name: "Photos" });
  const firstPhoto = makeFile("a.png", "image/png", 700);
  const secondPhoto = makeFile("b.jpg", "image/jpeg", 700);
  pickFiles("Photos", [firstPhoto]);
  pickFiles("Photos", [secondPhoto]);
  expect(within(photoGroup).getByText("Selected files: 2")).toBeTruthy();
  const thirdPhoto = makeFile("c.png", "image/png", 700);
  pickFiles("Photos", [thirdPhoto]);
  expect(within(photoGroup).getByRole("alert").textContent).toContain("Total size");
  const removeButton = within(photoGroup).getByRole("button", { name: "Remove file a.png" });
  fireEvent.click(removeButton);
  expect(within(photoGroup).queryByText("a.png")).toBeNull();
  expect(within(photoGroup).getByText("b.jpg")).toBeTruthy();
}

function testFileHelpers(): void {
  expect(parseSizeToBytes(10)).toBe(10 * 1024 * 1024);
  expect(parseSizeToBytes("500KB")).toBe(500 * 1024);
  expect(parseSizeToBytes("1.5 MB")).toBe(1.5 * 1024 * 1024);
  expect(formatBytes(1536)).toBe("1.5 KB");
  const rules = normalizeFileTypes(["csv", ".PNG", "image/*", "application/pdf"]);
  expect(rules.acceptText).toBe(".csv,.png,image/*,application/pdf");
  expect(rules.displayText).toBe("CSV, PNG, IMAGE, PDF");
  const jpg = makeFile("x.jpg", "image/jpeg", 1);
  expect(isFileTypeAllowed(jpg, rules)).toBe(true);
  const zip = makeFile("x.zip", "application/zip", 1);
  expect(isFileTypeAllowed(zip, rules)).toBe(false);
}

function testUtils(): void {
  expect(resolveLucideIcon("user-round-key")).toBe("UserRoundKey");
  expect(resolveLucideIcon("Users")).toBe("Users");
  expect(resolveLucideIcon("nope-nope")).toBe("Circle");
  const rows = [{ value: "ADMIN", name: "Admin" }, { id: 7, label: "Seven" }, { key: "x", active: false }];
  const options = toOptionTypes(rows);
  expect(options.length).toBe(2);
  expect(options[0]?.key).toBe("ADMIN");
  expect(options[1]?.label).toBe("Seven");
  const menus = [{ id: "ADMIN_ROOT", name: "Root", children: [{ id: "a", name: "A" }] }];
  const unwrapped = unwrapRootMenu(menus, "ADMIN_ROOT");
  expect(unwrapped[0]?.id).toBe("a");
}

async function testCryptoRoundTrip(): Promise<void> {
  const keyText = "0123456789abcdef0123456789abcdef";
  const envelope = await encryptPayload({ hello: "world" }, keyText);
  expect(typeof envelope.iv).toBe("string");
  const result = await decryptResponse<{ hello: string }>(envelope, keyText);
  expect(result.hello).toBe("world");
}

describe("TypeUpload and shared utils", function describeUpload() {
  afterEach(cleanup);
  it("uploads a single file into the form", testSingleUpload);
  it("rejects wrong type and too big files with a warning", testRejectsWrongTypeAndSize);
  it("checks the total size of multiple files and removes files", testMultipleWithTotalLimitAndRemove);
  it("parses sizes and file types", testFileHelpers);
  it("resolves icons, options and root menus", testUtils);
  it("encrypts and decrypts payloads", testCryptoRoundTrip);
});

// Tests for the react-hook-form Type* controls.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConstKeys, RegExp } from "dff-util";
import { useForm } from "react-hook-form";
import { TypeButton, TypeInput, TypeSelect, TypeSwitch, SharedWebUiProvider } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

interface ContactType {
  email: string;
  role: string;
  active: boolean;
}

const contactDefaults: ContactType = { email: "", role: "", active: false };

const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};

const roleOptions = [
  { key: "admin", label: "Admin", lang: { en: "Administrator" } },
  { key: "viewer", label: "Viewer" },
];

const savedValues: ContactType[] = [];

function saveContact(values: ContactType): void {
  savedValues.push(values);
}

function ContactForm() {
  const formOptions = { defaultValues: contactDefaults };
  const form = useForm<ContactType>(formOptions);
  const onSubmit = form.handleSubmit(saveContact);
  return (
    <form onSubmit={onSubmit} noValidate>
      <TypeInput control={form.control} name="email" label="Email" type="email" rules={emailRules} />
      <TypeSelect control={form.control} name="role" label="Role" options={roleOptions} />
      <TypeSwitch control={form.control} name="active" label="Active" />
      <TypeButton type="submit" label="Save" />
    </form>
  );
}

async function renderContactForm(): Promise<void> {
  render(
    <SharedWebUiProvider config={testConfig}>
      <ContactForm />
    </SharedWebUiProvider>,
  );
  await screen.findByLabelText("Email");
}

function clickSave(): void {
  const saveButton = screen.getByRole("button", { name: "Save" });
  fireEvent.click(saveButton);
}

async function submitForm(): Promise<void> {
  await act(clickSave);
}

async function testRequiredMessageIsTranslated(): Promise<void> {
  await renderContactForm();
  await submitForm();
  expect(await screen.findByText("Please fill this in")).toBeTruthy();
  expect(savedValues.length).toBe(0);
}

async function testPatternMessageFallsBackToDffUtil(): Promise<void> {
  await renderContactForm();
  const emailInput = screen.getByLabelText("Email");
  fireEvent.change(emailInput, { target: { value: "not-an-email" } });
  await submitForm();
  expect(await screen.findByText("Invalid email format")).toBeTruthy();
}

async function testValidSubmit(): Promise<void> {
  await renderContactForm();
  const emailInput = screen.getByLabelText("Email");
  fireEvent.change(emailInput, { target: { value: "asha@example.com" } });
  const roleSelect = screen.getByLabelText("Role");
  fireEvent.change(roleSelect, { target: { value: "admin" } });
  const activeSwitch = screen.getByLabelText("Active");
  fireEvent.click(activeSwitch);
  await submitForm();
  expect(savedValues).toEqual([{ email: "asha@example.com", role: "admin", active: true }]);
  expect(screen.getByText("Administrator")).toBeTruthy();
}

describe("Type* controls with react-hook-form", function describeForms() {
  afterEach(cleanup);
  it("shows the translated REQUIRED message", testRequiredMessageIsTranslated);
  it("falls back to dff-util ConstMessages", testPatternMessageFallsBackToDffUtil);
  it("submits valid values", testValidSubmit);
});

// Tests for the lightweight translator and direction helpers.
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { fallbackTranslationSignal, interpolate, lookupMessage, resolveDirection, translate, translationSignal } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

function testLookupNestedAndFlatKeys(): void {
  const messages = { nav: { users: "Users" }, "flat.key": "Flat", REQUIRED: "Needed" };
  expect(lookupMessage(messages, "nav.users")).toBe("Users");
  expect(lookupMessage(messages, "flat.key")).toBe("Flat");
  expect(lookupMessage(messages, "REQUIRED")).toBe("Needed");
  expect(lookupMessage(messages, "nav.missing")).toBeUndefined();
  expect(lookupMessage(messages, "nav")).toBeUndefined();
}

function testInterpolate(): void {
  const text = interpolate("Hi {{name}}, you have {{count}} items {{unknown}}", { name: "Asha", count: 3 });
  expect(text).toBe("Hi Asha, you have 3 items {{unknown}}");
}

function testFallbackOrder(): void {
  translationSignal.value = { title: "Titre" };
  fallbackTranslationSignal.value = { title: "Title", only: "Only in fallback" };
  expect(translate("title")).toBe("Titre");
  expect(translate("only")).toBe("Only in fallback");
  expect(translate("ui.close")).toBe("Close");
  expect(translate("INVALID_EMAIL")).toBe("Invalid email format");
  expect(translate("Plain text")).toBe("Plain text");
}

function testDirection(): void {
  const languages = testConfig.languages ?? [];
  expect(resolveDirection("ar", languages)).toBe("rtl");
  expect(resolveDirection("he", languages)).toBe("rtl");
  expect(resolveDirection("fa", languages)).toBe("rtl");
  expect(resolveDirection("ur-PK", languages)).toBe("rtl");
  expect(resolveDirection("en", languages)).toBe("ltr");
  expect(resolveDirection("fr", languages)).toBe("ltr");
  expect(resolveDirection("de", languages)).toBe("ltr");
  expect(resolveDirection("es", languages)).toBe("ltr");
}

function testDirectionOverride(): void {
  const configLanguages = testConfig.languages ?? [];
  const loader = configLanguages[0]?.load;
  if (!loader) {
    throw new Error("missing loader");
  }
  const languages = [{ code: "ar", label: "Arabic (LTR test)", direction: "ltr" as const, load: loader }];
  expect(resolveDirection("ar", languages)).toBe("ltr");
}

describe("translator", function describeTranslator() {
  it("reads nested and flat keys", testLookupNestedAndFlatKeys);
  it("fills {{placeholders}}", testInterpolate);
  it("uses current -> fallback -> package defaults -> key", testFallbackOrder);
  it("detects RTL for ar, he, fa, ur and LTR for en, fr, de, es", testDirection);
  it("lets the config force a direction", testDirectionOverride);
});

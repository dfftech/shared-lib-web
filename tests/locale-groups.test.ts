// locale-groups.test.ts — locales/<code>/<group>.json merged into one messages object (layout "file per group").
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { loadLocaleGroups, readLocaleFilePath, type LocaleGroupFiles } from "../src/index.ts";

function jsonFile(content: Record<string, string>): () => Promise<unknown> {
  return () => Promise.resolve({ default: content });
}

const sharedFiles: LocaleGroupFiles = {
  "../shared/locales/en-US/app.json": jsonFile({ name: "My App" }),
  "../shared/locales/en-US/root.json": jsonFile({ REQUIRED: "Required" }),
  "../shared/locales/en-US/user.json": jsonFile({ title: "Users", add: "Add" }),
  "../shared/locales/fr-FR/app.json": jsonFile({ name: "Mon appli" }),
};

const ownFiles: LocaleGroupFiles = {
  "./locales/en-US/user.json": jsonFile({ add: "Add user" }),
  "./locales/en-US/forms.json": jsonFile({ title: "Form" }),
};

describe("locale groups", () => {
  it("reads the language code and group from a path", () => {
    expect(readLocaleFilePath("./locales/en-US/nav.json")?.group).toBe("nav");
    expect(readLocaleFilePath("./locales/en-US/nav.json")?.languageCode).toBe("en-US");
    expect(readLocaleFilePath("./locales/readme.md")).toBe(undefined);
  });

  it("merges the group files of one language; root.json keys stay on top; later folders win per key", async () => {
    const messages = await loadLocaleGroups({ ...sharedFiles, ...ownFiles }, "en-US");
    expect(messages.REQUIRED).toBe("Required");
    expect((messages.app as Record<string, string>).name).toBe("My App");
    expect((messages.user as Record<string, string>).title).toBe("Users");
    expect((messages.user as Record<string, string>).add).toBe("Add user");
    expect((messages.forms as Record<string, string>).title).toBe("Form");
    expect(messages.fr).toBe(undefined);
  });

  it("only loads the files of the requested language, and fails for a language without files", async () => {
    const french = await loadLocaleGroups(sharedFiles, "fr-FR");
    expect((french.app as Record<string, string>).name).toBe("Mon appli");
    let errorText = "";
    try {
      await loadLocaleGroups(sharedFiles, "de-DE");
    } catch (error) {
      errorText = String(error);
    }
    expect(errorText).toContain("no locale files for de-DE");
  });
});

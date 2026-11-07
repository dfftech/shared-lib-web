// locale-groups.ts
// Locale files split by group: one folder per language, one file per group (the file name is the group).
//
//   locales/en-US/app.json     { "name": "My App" }                    -> t("app.name")
//   locales/en-US/nav.json     { "users": "Users" }                    -> t("nav.users")
//   locales/en-US/root.json   { "REQUIRED": "This field is required" } -> t("REQUIRED")   (top-level keys)
//
//   // config.ts (Vite: import.meta.glob is lazy, only the files of the language in use are downloaded)
//   const localeFiles = import.meta.glob("./locales/*/*.json");
//   loadLocale: loadLocaleGroups.bind(null, localeFiles)
//
// Several folders can be merged ({ ...sharedFiles, ...ownFiles }): the same group in two folders is merged,
// the later file wins per key. Each file is flat, so the "group.key" rule (one sublevel) holds by itself.

import type { LocaleMessages, LocaleModule } from "../interfaces/ui-config.ts";
import { unwrapLocaleModule } from "./locale-service.ts";

/** One lazy file loader, as import.meta.glob returns them. */
export type LocaleFileLoader = () => Promise<unknown>;

/** path -> loader, for example the result of import.meta.glob("./locales/*\/*.json"). */
export type LocaleGroupFiles = Record<string, LocaleFileLoader>;

/** The file whose keys stay at the top level (dff-util messages like REQUIRED, or "greeting"). */
export const ROOT_LOCALE_GROUP = "root";

const JSON_EXTENSION = ".json";

/** Language code and group of a file path: "./locales/en-US/nav.json" -> { languageCode: "en-US", group: "nav" }. */
export function readLocaleFilePath(path: string): { languageCode: string; group: string } | undefined {
  const parts = path.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  const languageCode = parts[parts.length - 2] ?? "";
  const isJsonFile = fileName.endsWith(JSON_EXTENSION);
  if (!isJsonFile || languageCode.length === 0) {
    return undefined;
  }
  const groupLength = fileName.length - JSON_EXTENSION.length;
  const group = fileName.slice(0, groupLength);
  return { languageCode: languageCode, group: group };
}

/** Loads one group file and takes the messages out of the JSON module. */
async function loadGroupFile(loadFile: LocaleFileLoader): Promise<LocaleMessages> {
  const fileModule = await loadFile();
  return unwrapLocaleModule(fileModule as LocaleModule);
}

/** Adds one group file to the messages (the root file goes to the top level). */
function addGroupMessages(messages: LocaleMessages, group: string, groupMessages: LocaleMessages): void {
  if (group === ROOT_LOCALE_GROUP) {
    Object.assign(messages, groupMessages);
    return;
  }
  const existingGroup = messages[group];
  const isExistingGroup = typeof existingGroup === "object" && existingGroup !== null;
  messages[group] = isExistingGroup ? { ...existingGroup, ...groupMessages } : groupMessages;
}

/**
 * Loads all group files of one language (in parallel) and returns one messages object, ready for loadLocale.
 * Throws when the language has no files, so the next language is tried (browser language -> en-US).
 */
export async function loadLocaleGroups(files: LocaleGroupFiles, languageCode: string): Promise<LocaleMessages> {
  const groups: string[] = [];
  const loadings: Array<Promise<LocaleMessages>> = [];
  const entries = Object.entries(files);
  for (const [path, loadFile] of entries) {
    const fileInfo = readLocaleFilePath(path);
    if (fileInfo?.languageCode !== languageCode) {
      continue;
    }
    groups.push(fileInfo.group);
    const loading = loadGroupFile(loadFile);
    loadings.push(loading);
  }
  if (groups.length === 0) {
    throw new Error(`shared-lib-web: no locale files for ${languageCode}`);
  }
  const groupContents = await Promise.all(loadings);
  const messages: LocaleMessages = {};
  for (const [index, group] of groups.entries()) {
    const groupMessages = groupContents[index] ?? {};
    addGroupMessages(messages, group, groupMessages);
  }
  return messages;
}

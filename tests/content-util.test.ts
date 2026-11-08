// content-util.test.ts — readContent: the content of a content-load reply.
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { readContent } from "../src/index.ts";

const messages = { ui: { language: "Language" } };

describe("readContent", () => {
  it("takes off data and follows the query path the reply has", () => {
    expect(readContent({ data: { locales: { "en-US": messages } } }, "locales.en-US")).toEqual(messages);
    expect(readContent({ data: messages }, "locales.en-US")).toEqual(messages);
    expect(readContent(messages, "locales.en-US")).toEqual(messages);
  });

  it("a whole group (query without a code) and the theme", () => {
    const all = { "en-US": messages, "te-IN": messages };
    expect(readContent({ data: { locales: all } }, "locales")).toEqual(all);
    const themes = { "org-dark": { isDark: true, variables: {} } };
    expect(readContent({ theme: themes }, "theme")).toEqual(themes);
    expect(readContent(null, "theme")).toBe(null);
  });
});

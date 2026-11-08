// shared-get.test.ts — AppHttp.GetShared: one request per page for the shell and its microfrontends.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { AppHttp, clearSharedGetCache, setAppConfig } from "../src/index.ts";

const requestedUrls: string[] = [];
const originalFetch = globalThis.fetch;
let isFailing = false;

/** Counts the requests; answers { data: [...] } (or 500 while isFailing). */
async function countingFetch(input: string | URL | Request): Promise<Response> {
  const url = String(input);
  requestedUrls.push(url);
  if (isFailing) {
    return new Response(JSON.stringify({ message: "down" }), { status: 500, headers: { "content-type": "application/json" } });
  }
  const body = JSON.stringify({ data: [{ key: "en-US", label: "English" }] });
  return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
}

describe("AppHttp.GetShared", () => {
  afterEach(() => {
    clearSharedGetCache();
    requestedUrls.length = 0;
    isFailing = false;
    globalThis.fetch = originalFetch;
  });

  it("the same URL + params is requested once (in flight and after), other params are separate", async () => {
    setAppConfig({ appNameKey: "SHARED", http: { baseUrl: "https://api.test/api" } });
    globalThis.fetch = countingFetch as typeof fetch;
    const shellRequest = AppHttp.GetShared("/org-sor/load/LANG", { active: true });
    const mfeRequest = AppHttp.GetShared("/org-sor/load/LANG", { active: true });
    expect(mfeRequest).toBe(shellRequest);
    await shellRequest;
    await AppHttp.GetShared("/org-sor/load/LANG", { active: true });
    expect(requestedUrls.length).toBe(1);
    await AppHttp.GetShared("/org-sor/content-load", { query: "theme" });
    expect(requestedUrls.length).toBe(2);
  });

  it("a failed request is not kept: the next call tries again", async () => {
    setAppConfig({ appNameKey: "SHARED", http: { baseUrl: "https://api.test/api" } });
    globalThis.fetch = countingFetch as typeof fetch;
    isFailing = true;
    let hasFailed = false;
    try {
      await AppHttp.GetShared("/org-sor/company-details");
    } catch {
      hasFailed = true;
    }
    expect(hasFailed).toBe(true);
    isFailing = false;
    const reply = await AppHttp.GetShared("/org-sor/company-details");
    expect(Boolean(reply)).toBe(true);
    expect(requestedUrls.length).toBe(2);
  });
});

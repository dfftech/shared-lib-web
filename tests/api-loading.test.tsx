// api-loading.test.tsx — config loaders (loadSupportLanguages, loadBranches, loadMenuNavigation): the provider loads languages on start, branches + menu after sign in,
// and removes them on sign out. type "mfe" loads only the languages; type "shell" uses paths for pages.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { signal } from "@preact/signals-react";
import {
  AppHttp,
  SharedWebUiProvider,
  branchesSignal,
  endSession,
  languagesSignal,
  navigationLoadingSignal,
  navigationSignal,
  readCurrentPage,
  startSession,
  type UiConfig,
} from "../src/index.ts";
import { forgetApiSession } from "../src/state/api-loader.ts";

const requests: Array<{ url: string; branchId: string }> = [];

const REPLIES: Record<string, unknown> = {
  "/languages": { data: [{ code: "en-US", name: "English", isDefault: true }, { code: "fr-FR", name: "Français" }] },
  "/branches": { data: [{ id: "B1", name: "Main", isDefault: true }, { id: "B2", name: "North" }] },
  "/menu": { data: [{ id: "HOME", name: "Home", href: "/", read: true }, { id: "USERS", name: "Users", href: "/users", read: true }] },
};

async function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const headers = (init?.headers ?? {}) as Record<string, string>;
  requests.push({ url: url, branchId: headers["x-branch-id"] ?? "" });
  const withoutHost = url.replace("https://api.test", "");
  const pathParts = withoutHost.split("?");
  const path = pathParts[0] ?? "";
  const reply = REPLIES[path];
  const status = reply ? 200 : 404;
  const body = JSON.stringify(reply ?? { error: "missing" });
  return new Response(body, { status: status, headers: { "content-type": "application/json" } });
}

/** A loader written like loadThemes: a function that returns the reply. */
function loadMenu(): Promise<unknown> {
  return AppHttp.Get("/menu");
}

function buildConfig(): UiConfig {
  return {
    appNameKey: "APITEST",
    themes: ["light"],
    http: { baseUrl: "https://api.test", logoutUrl: "#signed-out" },
    loadSupportLanguages: "/languages",
    loadBranches: "/branches",
    loadMenuNavigation: loadMenu,
  };
}

function readRequestedUrls(): string {
  const urls: string[] = [];
  for (const request of requests) {
    const withoutHost = request.url.replace("https://api.test", "");
    const pathParts = withoutHost.split("?");
    urls.push(pathParts[0] ?? "");
  }
  return urls.join(",");
}

describe("config loaders", () => {
  afterEach(() => {
    cleanup();
    endSession([], false);
    forgetApiSession();
    sessionStorage.clear();
    localStorage.clear();
    requests.length = 0;
  });

  it("spa: languages on start; branches then menu after sign in (menu sends x-branch-id); removed on sign out", async () => {
    globalThis.fetch = fakeFetch as typeof fetch;
    render(<SharedWebUiProvider config={buildConfig()}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(languagesSignal.value.length).toBe(2));
    expect(readRequestedUrls()).toBe("/languages");
    expect(navigationLoadingSignal.value).toBe(true);
    await act(async () => {
      startSession("Bearer t1", { id: "u1", name: "Asha" });
    });
    await waitFor(() => expect(navigationSignal.value.length).toBe(2));
    expect(readRequestedUrls()).toBe("/languages,/branches,/menu");
    expect(requests[2]?.branchId).toBe("B1");
    expect(branchesSignal.value.length).toBe(2);
    await act(async () => {
      endSession([], false);
    });
    expect(branchesSignal.value.length).toBe(0);
    expect(navigationLoadingSignal.value).toBe(true);
  });

  it("a loader can be a function or a URL / path", async () => {
    globalThis.fetch = fakeFetch as typeof fetch;
    const config: UiConfig = {
      ...buildConfig(),
      loadSupportLanguages: () => Promise.resolve([{ code: "en-US", name: "English" }]),
      loadBranches: undefined,
      loadMenuNavigation: undefined,
    };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(languagesSignal.value.length).toBe(1));
    expect(requests.length).toBe(0);
  });

  it("mfe: only the languages are loaded; no menu skeleton, no branch or menu calls", async () => {
    globalThis.fetch = fakeFetch as typeof fetch;
    startSession("Bearer t2", { id: "u2", name: "Ravi" });
    render(<SharedWebUiProvider type="mfe" config={buildConfig()}><p>page</p></SharedWebUiProvider>);
    await waitFor(() => expect(languagesSignal.value.length).toBe(2));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(readRequestedUrls()).toBe("/languages");
    expect(navigationLoadingSignal.value).toBe(false);
    expect(navigationSignal.value.length).toBe(0);
  });

  it("shell: pages are paths by default (/settings), spa: ?page=settings", async () => {
    globalThis.fetch = fakeFetch as typeof fetch;
    window.history.pushState({}, "", "/settings");
    const config: UiConfig = { appNameKey: "SHELLTEST", themes: ["light"] };
    const view = render(<SharedWebUiProvider type="shell" config={config}><p>page</p></SharedWebUiProvider>);
    expect(readCurrentPage()).toBe("/settings");
    view.unmount();
    window.history.pushState({}, "", "/?page=forms");
    render(<SharedWebUiProvider type="spa" config={config}><p>page</p></SharedWebUiProvider>);
    expect(readCurrentPage()).toBe("/forms");
    window.history.pushState({}, "", "/");
  });

  it("sources can be signals: null first, every new value is applied at once (no calls, no sign-in rule)", async () => {
    globalThis.fetch = fakeFetch as typeof fetch;
    const langSignal = signal<unknown>(null);
    const branchSignal = signal<unknown>(null);
    const navSignal = signal<unknown>(null);
    const config: UiConfig = {
      appNameKey: "SIGNALS",
      themes: ["light"],
      loadSupportLanguages: langSignal,
      loadBranches: branchSignal,
      loadMenuNavigation: navSignal,
    };
    render(<SharedWebUiProvider config={config}><p>page</p></SharedWebUiProvider>);
    expect(navigationLoadingSignal.value).toBe(true);
    expect(branchesSignal.value.length).toBe(0);
    await act(async () => {
      langSignal.value = REPLIES["/languages"];
      branchSignal.value = REPLIES["/branches"];
      navSignal.value = REPLIES["/menu"];
    });
    expect(languagesSignal.value.length).toBe(2);
    expect(branchesSignal.value.length).toBe(2);
    expect(navigationLoadingSignal.value).toBe(false);
    expect(navigationSignal.value.length).toBe(2);
    await act(async () => {
      navSignal.value = { data: [{ id: "ONLY", name: "Only", href: "/only", read: true }] };
    });
    expect(navigationSignal.value.length).toBe(1);
    expect(requests.length).toBe(0);
  });
});

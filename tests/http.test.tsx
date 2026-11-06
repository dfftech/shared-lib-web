// Tests for AppHttp headers, service URLs, session restore and progress.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { cleanup, render, screen } from "@testing-library/react";
import { Http } from "dff-util";
import {
  AppHttp,
  AppStorage,
  BRANCH_ID,
  branchIdSignal,
  setBranch,
  LANG,
  SharedWebUiProvider,
  THEME,
  TOKEN,
  readEnvData,
  endSession,
  isAuthenticatedSignal,
  progressSignal,
  startSession,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";
import { testConfig } from "./test-config.ts";

const receivedRequests: Array<{ url: string; headers: Record<string, string> }> = [];

/** Fake backend: remembers each request and answers with one option row. */
async function fakeBackendFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  receivedRequests.push({ url: String(input), headers: headers });
  const body = JSON.stringify({ data: [{ key: "a", label: "A" }] });
  const responseOptions = { status: 200, headers: { "content-type": "application/json" } };
  return new Response(body, responseOptions);
}

const httpConfig: UiConfig = {
  ...testConfig,
  http: {
    baseUrl: "https://api.test/api",
    headers: { "x-app": "shared" },
    loadUrl: "https://api.test/api/app-sor/load",
  },
};

async function renderWithHttp(): Promise<void> {
  render(
    <SharedWebUiProvider config={httpConfig}>
      <span>http-ready</span>
    </SharedWebUiProvider>,
  );
  await screen.findByText("http-ready");
}

async function testServiceUrlsAndHeaders(): Promise<void> {
  await renderWithHttp();
  expect(AppHttp.BaseUrl()).toBe("https://api.test/api");
  startSession("Bearer abc.def", { id: "u1", name: "Asha" });
  expect(isAuthenticatedSignal.value).toBe(true);
  setBranch("B7");
  globalThis.fetch = fakeBackendFetch as typeof fetch;
  await AppHttp.Load("ROLES", { active: true });
  const request = receivedRequests[0];
  expect(request?.url).toContain("https://api.test/api/app-sor/load/ROLES?active=true");
  expect(request?.headers.Authorization).toBe("Bearer abc.def");
  expect(request?.headers["x-branch-id"]).toBe("B7");
  expect(request?.headers["x-app"]).toBe("shared");
  expect(request?.headers["x-session-id"]?.length).toBeGreaterThan(10);
  // The tab id is saved with the app prefix: <APPNAMEKEY>-ACTIVE_SESSION_ID (sessionStorage).
  const savedSessionId = window.sessionStorage.getItem("TEST-ACTIVE_SESSION_ID");
  expect(request?.headers["x-session-id"]).toBe(savedSessionId);
  expect(window.sessionStorage.getItem("active_session_id")).toBeNull();
  await AppHttp.Post("https://api.test/api/items", { name: "x" });
  await AppHttp.Put("https://api.test/api/items", "9", { name: "y" });
  await AppHttp.Delete("https://api.test/api/items", "9");
  for (const sentRequest of receivedRequests) {
    expect(sentRequest.headers["x-session-id"]).toBe(savedSessionId);
  }
  expect(progressSignal.value).toBe(false);
  endSession();
  expect(isAuthenticatedSignal.value).toBe(false);
  const newSessionId = window.sessionStorage.getItem("TEST-ACTIVE_SESSION_ID");
  expect(newSessionId === savedSessionId).toBe(false);
}

interface WindowWithEnv {
  env?: Record<string, string>;
}

async function testEnvBaseUrlAndBranchHeader(): Promise<void> {
  await renderWithHttp();
  const windowWithEnv = window as unknown as WindowWithEnv;
  windowWithEnv.env = { REACT_APP_TEST_API_BASE_URL: "https://env.test/api" };
  expect(AppStorage.envData("api_base_url")).toBe("https://env.test/api");
  expect(AppHttp.BaseUrl()).toBe("https://env.test/api");
  expect(readEnvData("TEST", "API_BASE_URL")).toBe("https://env.test/api");
  expect(readEnvData("OTHER", "API_BASE_URL")).toBeNull();
  windowWithEnv.env = {};
  expect(AppHttp.BaseUrl()).toBe("https://api.test/api");
  const headersWithoutBranch = AppHttp.Headers();
  expect(headersWithoutBranch["x-branch-id"]).toBe("");
  expect(headersWithoutBranch["x-session-id"]?.length).toBeGreaterThan(10);
  setBranch("BR-1", "Main store");
  expect(window.sessionStorage.getItem("TEST-BRANCH_ID")).toBe("BR-1");
  expect(branchIdSignal.value).toBe("BR-1");
  const headers = AppHttp.Headers();
  expect(headers["x-branch-id"]).toBe("BR-1");
  AppStorage.setData(BRANCH_ID, "BR-2");
  const changedHeaders = AppHttp.Headers();
  expect(changedHeaders["x-branch-id"]).toBe("BR-2");
  endSession();
  expect(branchIdSignal.value).toBe("");
  expect(AppStorage.getData(BRANCH_ID)).toBeNull();
}

async function testTokenFromStorage(): Promise<void> {
  await renderWithHttp();
  AppStorage.setData(TOKEN, "Bearer from.storage");
  const headers = AppHttp.Headers();
  expect(headers.Authorization).toBe("Bearer from.storage");
  AppStorage.removeData(TOKEN);
  const headersWithoutToken = AppHttp.Headers();
  expect(headersWithoutToken.Authorization).toBeUndefined();
}

async function testStorageKeysAndLogout(): Promise<void> {
  await renderWithHttp();
  AppStorage.setData(THEME, "dark");
  AppStorage.setData(LANG, "ar-SA");
  expect(window.localStorage.getItem("TEST-THEME")).toBe("dark");
  expect(window.localStorage.getItem("TEST-LANG")).toBe("ar-SA");
  startSession("abc", null);
  expect(window.sessionStorage.getItem("TEST-TOKEN")).toBe("abc");
  endSession();
  expect(AppStorage.getData(TOKEN)).toBeNull();
  expect(AppStorage.getText(THEME)).toBe("dark");
  expect(AppStorage.getText(LANG)).toBe("ar-SA");
}

const relativeHttpConfig: UiConfig = {
  ...testConfig,
  appNameKey: "RELATIVE",
  appName: undefined,
  http: { baseUrl: "/api/" },
};

async function testRelativeBaseUrlAndAppName(): Promise<void> {
  render(
    <SharedWebUiProvider config={relativeHttpConfig}>
      <AppLayout>
        <span>relative-ready</span>
      </AppLayout>
    </SharedWebUiProvider>,
  );
  await screen.findByText("relative-ready");
  expect(AppHttp.BaseUrl()).toBe("http://localhost/api");
  expect(Http.API_BASE_URL).toBe("http://localhost/api");
  expect(screen.getAllByText("RELATIVE").length).toBeGreaterThan(0);
  AppStorage.setData(TOKEN, "xyz");
  expect(window.sessionStorage.getItem("RELATIVE-TOKEN")).toBe("xyz");
}

const logoutConfig: UiConfig = {
  ...testConfig,
  http: { baseUrl: "https://api.test/api", logoutUrl: "#logged-out" },
};

async function testLogoutRedirect(): Promise<void> {
  render(
    <SharedWebUiProvider config={logoutConfig}>
      <span>logout-ready</span>
    </SharedWebUiProvider>,
  );
  await screen.findByText("logout-ready");
  startSession("abc", null);
  endSession([], false);
  expect(window.location.hash).toBe("");
  startSession("abc", null);
  endSession();
  expect(window.location.hash).toBe("#logged-out");
  expect(AppStorage.getData(TOKEN)).toBeNull();
}

describe("AppHttp", function describeHttp() {
  afterEach(cleanup);
  it("sends token, x-session-id, x-branch-id and extra headers", testServiceUrlsAndHeaders);
  it("uses window.env for the base URL and always sends x-branch-id and x-session-id", testEnvBaseUrlAndBranchHeader);
  it("reads the token from AppStorage (no signals)", testTokenFromStorage);
  it("goes to http.logoutUrl after endSession()", testLogoutRedirect);
  it("keeps LANG and THEME on log out and removes the token", testStorageKeysAndLogout);
  it("makes a relative base URL absolute and shows appNameKey when appName is missing", testRelativeBaseUrlAndAppName);
});

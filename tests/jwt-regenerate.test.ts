// jwt-regenerate.test.ts — AppHttp regenerates an invalid token once (readSharedGetCache), or logs out on an error.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { AppHttp, AppStorage, endSession, ensureFreshToken, readJwtToken, setAppConfig, TOKEN } from "../src/index.ts";

const originalFetch = globalThis.fetch;
const requestedUrls: string[] = [];
let regenerateBody: unknown = {};
let regenerateStatus = 200;

/** An unsigned JWT that expires in the given seconds (negative = already expired). */
function buildJwt(expiresInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = Buffer.from(JSON.stringify({ exp: exp })).toString("base64url");
  return `${header}.${payload}.sig`;
}

const NEW_TOKEN = buildJwt(3600);

async function regenerateFetch(input: string | URL | Request): Promise<Response> {
  const url = String(input);
  requestedUrls.push(url);
  const isRegenerate = url.includes("/jwt-regenerate");
  const body = isRegenerate ? regenerateBody : { data: [] };
  const status = isRegenerate ? regenerateStatus : 200;
  return new Response(JSON.stringify(body), { status: status, headers: { "content-type": "application/json" } });
}

function useRegenerateConfig(): void {
  setAppConfig({ appNameKey: "JWTTEST", http: { baseUrl: "https://api.test/api", regenerateUrl: "/org-util/jwt-regenerate" } });
  globalThis.fetch = regenerateFetch as typeof fetch;
}

function countRegenerates(): number {
  return requestedUrls.filter((url) => url.includes("/jwt-regenerate")).length;
}

describe("JWT regenerate", () => {
  afterEach(() => {
    endSession([], false);
    requestedUrls.length = 0;
    regenerateStatus = 200;
    globalThis.fetch = originalFetch;
  });

  it("a valid token is not regenerated", async () => {
    useRegenerateConfig();
    AppStorage.setData(TOKEN, NEW_TOKEN);
    await AppHttp.Get("/a");
    expect(countRegenerates()).toBe(0);
  });

  it("an expired token: one regenerate for parallel requests, data.token saved", async () => {
    useRegenerateConfig();
    regenerateBody = { data: { token: NEW_TOKEN } };
    AppStorage.setData(TOKEN, buildJwt(-10));
    await Promise.all([AppHttp.Get("/a"), AppHttp.Post("/b", {}), AppHttp.Get("/c")]);
    expect(countRegenerates()).toBe(1);
    expect(readJwtToken()).toBe(NEW_TOKEN);
  });

  it("a reply with { token } is saved too", async () => {
    useRegenerateConfig();
    regenerateBody = { token: NEW_TOKEN };
    AppStorage.setData(TOKEN, buildJwt(-10));
    await ensureFreshToken();
    expect(readJwtToken()).toBe(NEW_TOKEN);
  });

  it("an invalid token with an empty regenerateUrl throws at the call", async () => {
    setAppConfig({ appNameKey: "JWTTEST", http: { baseUrl: "https://api.test/api" } });
    globalThis.fetch = regenerateFetch as typeof fetch;
    AppStorage.setData(TOKEN, NEW_TOKEN);
    await AppHttp.Get("/a");
    AppStorage.setData(TOKEN, buildJwt(-10));
    let hasThrown = false;
    try {
      await AppHttp.Get("/a");
    } catch {
      hasThrown = true;
    }
    expect(hasThrown).toBe(true);
  });

  it("an error logs out (token removed)", async () => {
    useRegenerateConfig();
    regenerateStatus = 401;
    regenerateBody = { message: "expired" };
    AppStorage.setData(TOKEN, buildJwt(-10));
    await ensureFreshToken();
    expect(readJwtToken()).toBe("");
  });
});

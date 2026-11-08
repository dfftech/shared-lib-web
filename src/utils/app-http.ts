// app-http.ts
// The one HTTP client of an app. Wraps dff-util Http with the token, session id, branch, extra headers
// and the top progress bar. Reads the http* settings from the saved config (no signals).
//
//   // config.ts
//   http: { baseUrl: "https://api.example.com/api", logoutUrl: "/login", loadUrl: "https://api.example.com/api/app-sor/load" }
//
//   Every request sends: Content-Type, Authorization: Bearer <TOKEN>, x-session-id (per tab, AppStorage ACTIVE_SESSION_ID),
//   x-branch-id (AppStorage BRANCH_ID, set with setBranch(id); "" when no branch), http.headers, setHeader() values.
//
//   Base URL: window.env.REACT_APP_<APPNAMEKEY>_API_BASE_URL (AppStorage.envData("API_BASE_URL")) wins over
//   config.http.baseUrl, so one build can run against several backends.
//
//   Service URLs (MsUrl) are NOT part of AppHttp: each project keeps them in its own config.ts.
//
//   Every method takes a full URL or a path: a URL that starts with http:// or https:// is used as it is,
//   anything else is appended to the base URL ("/profile/search" -> "<baseUrl>/profile/search").
//
//   // hooks/service-http.ts
//   const listUrl = `${MsUrl.main}/profile/search`;
//   const response = await AppHttp.Get(listUrl, params);
//   const saved = await AppHttp.Post(saveUrl, body);
//   AppHttp.setHeader("x-custom", value);
//
//   // file upload to a signed URL
//   const signed = await AppHttp.Post(`${MsUrl.utils}/s3/upload-url`, { fileName: file.name });
//   const uploaded = await uploadToSignedUrl(file, signed.data.upload, signed.data.download);
//   // uploaded = { filename, mimetype, url }

import { Http, type FileType } from "dff-util";
import type { UiConfig } from "../interfaces/ui-config.ts";
import { ShowProgress } from "../state/progress-service.ts";
import { readAppConfig } from "./app-config.ts";
import { AppStorage } from "./app-storage.ts";
import { setLeaveGuard } from "./leave-guard.ts";
import { readSessionId } from "./session-id.ts";
import { BRANCH_ID, TOKEN } from "./storage-keys.ts";

export type HttpParams = Record<string, string | number | boolean | null | undefined>;
export type HttpHeaders = Record<string, string>;

const CONFIG_MISSING = "shared-lib-web: config is missing. Render <SharedWebUiProvider config={config}> or call setAppConfig(config) first.";
const BASE_URL_MISSING = "shared-lib-web: no API base URL. Set config.http.baseUrl or window.env.REACT_APP_<APPNAMEKEY>_API_BASE_URL.";

/** window.env name (without prefix) of the API base URL. */
export const API_BASE_URL_ENV = "API_BASE_URL";


const runtimeHeaders: HttpHeaders = {};

/** Returns the saved config or throws a clear error. */
function readSavedConfig(): UiConfig {
  const config = readAppConfig();
  if (!config) {
    throw new Error(CONFIG_MISSING);
  }
  return config;
}

/** true when the progress bar should show. */
function isProgressEnabled(): boolean {
  const config = readAppConfig();
  return config?.http?.showProgress ?? true;
}

/** JWT from AppStorage (config.http.tokenKey, default TOKEN, sessionStorage). "" when missing. */
/**
 * Requests shared by every copy of the library on the page (a shell and its microfrontends each bundle their own
 * copy): the key is global (Symbol.for), so the cache lives on window once for all copies.
 */
const SHARED_GET_KEY = Symbol.for("shared-lib-web:shared-get");

type SharedGetCache = Map<string, Promise<unknown>>;

/** The page-wide cache of GetShared (created by the first copy that needs it). */
function readSharedGetCache(): SharedGetCache {
  const holder = globalThis as unknown as Record<symbol, SharedGetCache | undefined>;
  let cache = holder[SHARED_GET_KEY];
  if (!cache) {
    cache = new Map();
    holder[SHARED_GET_KEY] = cache;
  }
  return cache;
}

/** Cache key of a request: the full URL + the params sorted by name. */
export function buildSharedGetKey(fullUrl: string, params: HttpParams): string {
  const names = Object.keys(params);
  names.sort();
  const parts: string[] = [];
  for (const name of names) {
    const value = params[name];
    parts.push(`${name}=${String(value)}`);
  }
  const paramText = parts.join("&");
  return `${fullUrl}?${paramText}`;
}

/** A failed shared request is removed, so the next call tries again. */
function forgetSharedGet(key: string): void {
  const cache = readSharedGetCache();
  cache.delete(key);
}

/** Empties the shared request cache (for example after the texts or themes changed on the server, or in tests). */
export function clearSharedGetCache(): void {
  const cache = readSharedGetCache();
  cache.clear();
}

export function readJwtToken(): string {
  const config = readAppConfig();
  const tokenKey = config?.http?.tokenKey ?? TOKEN;
  const storedToken = AppStorage.getText(tokenKey);
  const plainToken = storedToken.replace(/^Bearer\s+/i, "");
  const token = plainToken.trim();
  const isMissing = token.length === 0 || token === "null" || token === "undefined";
  return isMissing ? "" : token;
}

/** "/api" -> "https://this-site/api". Absolute URLs stay as they are. A trailing "/" is removed. */
export function toAbsoluteUrl(url: string): string {
  const hasWindow = typeof window !== "undefined";
  const isAbsolute = /^https?:\/\//i.test(url);
  const fullUrl = isAbsolute || !hasWindow ? url : `${window.location.origin}${url}`;
  return fullUrl.replace(/\/+$/, "");
}

/** true for "http://..." and "https://..." (any case). */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Joins a base URL and a path with exactly one "/" between them. */
export function joinUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return trimmedPath.length > 0 ? `${trimmedBase}/${trimmedPath}` : trimmedBase;
}

/** Turns a Response body into JSON or text. */
async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export class AppHttp {
  /**
   * API base URL: window.env REACT_APP_<APPNAMEKEY>_API_BASE_URL first, then config.http.baseUrl.
   * A relative base ("/api") becomes absolute ("https://this-site/api"). Also set as dff-util Http.API_BASE_URL,
   * so AppHttp.Get("/profile/search") works with a path only.
   */
  static BaseUrl(): string {
    const envBaseUrl = AppStorage.envData(API_BASE_URL_ENV);
    const savedConfig = readSavedConfig();
    const baseUrl = envBaseUrl ?? savedConfig.http?.baseUrl;
    if (!baseUrl) {
      throw new Error(BASE_URL_MISSING);
    }
    const absoluteBaseUrl = toAbsoluteUrl(baseUrl);
    Http.API_BASE_URL = absoluteBaseUrl;
    return absoluteBaseUrl;
  }

  /**
   * The URL a request goes to: a URL starting with http:// or https:// stays as it is,
   * anything else is appended to BaseUrl() ("/profile/search" or "profile/search" -> "<baseUrl>/profile/search").
   */
  static FullUrl(url: string): string {
    const isAbsolute = isHttpUrl(url);
    if (isAbsolute) {
      return url;
    }
    const baseUrl = AppHttp.BaseUrl();
    return joinUrl(baseUrl, url);
  }

  /** Adds (or with "" removes) a header sent with every request, for example the selected branch. */
  static setHeader(headerName: string, value: string): void {
    if (value.length === 0) {
      delete runtimeHeaders[headerName];
      return;
    }
    runtimeHeaders[headerName] = value;
  }

  /** JSON headers: content type, bearer token, session id, branch, config and runtime headers. */
  static Headers(): HttpHeaders {
    const rawHeaders = AppHttp.RawHeaders();
    return { "Content-Type": "application/json", ...rawHeaders };
  }

  /** Headers without Content-Type (for FormData uploads, the browser sets the boundary). */
  static RawHeaders(): HttpHeaders {
    const savedConfig = readSavedConfig();
    const configHeaders = savedConfig.http?.headers ?? {};
    const headers: HttpHeaders = { ...configHeaders, ...runtimeHeaders };
    const token = readJwtToken();
    if (token.length > 0) {
      headers.Authorization = `Bearer ${token}`;
    }
    headers["x-session-id"] = readSessionId();
    headers["x-branch-id"] = AppStorage.getText(BRANCH_ID);
    return headers;
  }

  /** GET with query params. */
  static async Get(url: string, params: HttpParams = {}, customHeaders: HttpHeaders = {}): Promise<unknown> {
    const baseHeaders = AppHttp.Headers();
    const headers = { ...baseHeaders, ...customHeaders };
    const fullUrl = AppHttp.FullUrl(url);
    const request = Http.Get(fullUrl, params, headers);
    return AppHttp.withProgress(request);
  }

  /**
   * GET once per page, shared by every copy of the library (shell + microfrontends): the same URL + params while a
   * request is running or after it answered gives the same promise — no second call. For data that is the same for
   * everyone on the page (languages, themes, texts, company details), not for user data. A failed request is not kept.
   *   const reply = await AppHttp.GetShared(`${MsUrl.sor}/load/LANG`, { active: true });
   */
  static GetShared(url: string, params: HttpParams = {}): Promise<unknown> {
    const fullUrl = AppHttp.FullUrl(url);
    const key = buildSharedGetKey(fullUrl, params);
    const cache = readSharedGetCache();
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    const request = AppHttp.Get(url, params);
    cache.set(key, request);
    const forget = forgetSharedGet.bind(null, key);
    request.catch(forget);
    return request;
  }

  /** POST a JSON body. */
  static async Post(url: string, body: unknown, customHeaders: HttpHeaders = {}): Promise<unknown> {
    const baseHeaders = AppHttp.Headers();
    const headers = { ...baseHeaders, ...customHeaders };
    const fullUrl = AppHttp.FullUrl(url);
    const request = Http.Post(fullUrl, body, headers);
    return AppHttp.withProgress(request);
  }

  /** PUT a JSON body to url/id. */
  static async Put(url: string, id: string, body: unknown): Promise<unknown> {
    const headers = AppHttp.Headers();
    const fullUrl = AppHttp.FullUrl(url);
    const itemUrl = `${fullUrl}/${id}`;
    const request = Http.Put(itemUrl, body, headers);
    return AppHttp.withProgress(request);
  }

  /** DELETE url/id. */
  static async Delete(url: string, id: string, params: HttpParams = {}): Promise<unknown> {
    const headers = AppHttp.Headers();
    const fullUrl = AppHttp.FullUrl(url);
    const itemUrl = `${fullUrl}/${id}`;
    const request = Http.Delete(itemUrl, params, headers);
    return AppHttp.withProgress(request);
  }

  /** PATCH a JSON body. */
  static async Patch(url: string, body: unknown): Promise<unknown> {
    const headers = AppHttp.Headers();
    const bodyText = JSON.stringify(body ?? {});
    const requestInit = { method: "PATCH", headers: headers, body: bodyText };
    const fullUrl = AppHttp.FullUrl(url);
    const request = fetch(fullUrl, requestInit);
    const response = await AppHttp.withProgress(request);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `PATCH ${response.status}`);
    }
    return readResponseBody(response);
  }

  /** Option lists from the backend loader: GET `${config.http.loadUrl}/${id}`. */
  static async Load(id: string, params: HttpParams = {}): Promise<unknown> {
    const savedConfig = readSavedConfig();
    const loadUrl = savedConfig.http?.loadUrl ?? "/load";
    const fullLoadUrl = AppHttp.FullUrl(loadUrl);
    const itemUrl = `${fullLoadUrl}/${id}`;
    return AppHttp.Get(itemUrl, params);
  }

  /** PUT a file to a signed upload URL (plain PUT, no extra headers, so bucket CORS accepts it). */
  static async CloudUpload(uploadUrl: string, file: File): Promise<Response> {
    const requestInit = { method: "PUT", body: file };
    const fullUrl = AppHttp.FullUrl(uploadUrl);
    const request = fetch(fullUrl, requestInit);
    const response = await AppHttp.withProgress(request);
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    return response;
  }

  /** Same as CloudUpload (the name the apps used). */
  static async uploadFile(uploadUrl: string, file: File): Promise<Response> {
    return AppHttp.CloudUpload(uploadUrl, file);
  }

  /**
   * GET that returns the raw body as a Blob (images, video, audio, any binary file).
   * The URL rule of every method applies (a path gets the base URL), and the same headers are sent (token,
   * x-session-id, x-branch-id, http.headers, setHeader values; no Content-Type). No progress bar: pages often load
   * many media files at once.
   *   const blob = await AppHttp.Media(`${MsUrl.utils}/files/${id}`);
   *   const objectUrl = URL.createObjectURL(blob);   // <img src={objectUrl}>; URL.revokeObjectURL(objectUrl) later
   */
  static async Media(url: string, params?: HttpParams): Promise<Blob> {
    const fullUrl = AppHttp.FullUrl(url);
    const headers = AppHttp.RawHeaders();
    return Http.FileDownload(fullUrl, params, headers);
  }

  /** Downloads a file and saves it in the browser. */
  static async DownloadFile(url: string, params: HttpParams = {}, fileName?: string): Promise<void> {
    const headers = AppHttp.RawHeaders();
    const fullUrl = AppHttp.FullUrl(url);
    const request = Http.FileDownload(fullUrl, params, headers);
    const blob = await AppHttp.withProgress(request);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const urlParts = url.split("/");
    const lastPart = urlParts[urlParts.length - 1];
    link.href = downloadUrl;
    link.download = fileName ?? lastPart ?? "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  /** Shows the progress bar while the request runs. */
  static async withProgress<TResult>(request: Promise<TResult>): Promise<TResult> {
    const showProgress = isProgressEnabled();
    if (showProgress) {
      ShowProgress(true);
    }
    try {
      const result = await request;
      return result;
    } finally {
      if (showProgress) {
        ShowProgress(false);
      }
    }
  }
}

/**
 * PUTs the file to a signed (pre-signed S3 / GCS) uploadUrl and returns a dff-util FileType with its download URL.
 * The browser warns before closing the page while the upload runs.
 */
export async function uploadToSignedUrl(file: File, uploadUrl: string, downloadUrl: string): Promise<FileType> {
  setLeaveGuard(true);
  try {
    await AppHttp.CloudUpload(uploadUrl, file);
  } finally {
    setLeaveGuard(false);
  }
  return { filename: file.name, mimetype: file.type, url: downloadUrl };
}

// company-service.ts
// Company / brand details from the backend (config.loadCompanyDetails, or setCompanyDetails by hand):
//
//   { "appName": "YourAppName", "companyName": "YourBrandName",
//     "faviconUrl": "https://www.w3.org/favicon.ico", "logoUrl": "https://www.w3.org/Icons/w3c_home.png",
//     "logoDarkUrl": "https://www.w3.org/Icons/w3c_home.png" }
//
//   appName      header / sidebar / login label and the browser tab title (wins over config.appName)
//   companyName  alt text of the logo; read companyDetailsSignal to show it anywhere (a footer, the login page)
//   faviconUrl   <link rel="icon" href="...">
//   logoUrl      the logo on light themes, and on dark themes without logoDarkUrl (wins over config.logoUrl / logoDarkUrl)
//   logoDarkUrl  the logo on dark themes (wins over config.logoDarkUrl)
// A reply may also be { data: {...} }. A missing field keeps the config value.

import type { CompanyDetails, CompanySource, UiConfig } from "../interfaces/ui-config.ts";
import { companyDetailsSignal } from "./signals.ts";

/** The fields of CompanyDetails (only text values are kept). */
const COMPANY_FIELDS: Array<keyof CompanyDetails> = ["appName", "companyName", "faviconUrl", "logoUrl", "logoDarkUrl"];

/** true for a plain object (not null, not a list). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

/** The details inside a reply: the object itself, or its "data" object. */
function unwrapCompanyReply(reply: unknown): Record<string, unknown> | null {
  if (!isPlainObject(reply)) {
    return null;
  }
  const data = reply.data;
  return isPlainObject(data) ? data : reply;
}

/** Reads the company details from a reply ({...} or { data: {...} }); empty or unknown values are left out. */
export function readCompanyDetails(reply: unknown): CompanyDetails | null {
  const source = unwrapCompanyReply(reply);
  if (!source) {
    return null;
  }
  const details: CompanyDetails = {};
  for (const field of COMPANY_FIELDS) {
    const value = source[field];
    const isText = typeof value === "string" && value !== "";
    if (isText) {
      details[field] = value;
    }
  }
  return details;
}

/** Points <link rel="icon"> at the favicon URL (created when the page has none). */
function writeFavicon(faviconUrl: string): void {
  let iconElement = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!iconElement) {
    iconElement = document.createElement("link");
    iconElement.rel = "icon";
    document.head.append(iconElement);
  }
  iconElement.href = faviconUrl;
}

/** Writes the favicon and the tab title of the company details (fields that are missing are left alone). */
function applyCompanyToDocument(details: CompanyDetails | null): void {
  const hasDocument = typeof document !== "undefined";
  if (!hasDocument || !details) {
    return;
  }
  if (details.faviconUrl) {
    writeFavicon(details.faviconUrl);
  }
  if (details.appName) {
    document.title = details.appName;
  }
}

/**
 * Sets the company details (the backend reply as it is: {...} or { data: {...} }); null = none (config values).
 * The brand (logo, app name) updates at once; faviconUrl and appName also go to the browser tab.
 */
export function setCompanyDetails(reply: CompanySource | unknown): void {
  const details = readCompanyDetails(reply);
  companyDetailsSignal.value = details;
  applyCompanyToDocument(details);
}

/** true while config.loadCompanyDetails has not answered yet (no reply, and no config.appName to show meanwhile). */
export function isCompanyPending(config: UiConfig, details: CompanyDetails | null): boolean {
  const hasCompanySource = Boolean(config.loadCompanyDetails);
  return hasCompanySource && !details && !config.appName;
}

/**
 * The app label: company appName, else config.appName, else config.appNameKey (shown with t()).
 * "" while the company details are still loading (so the app key does not flash before the real name).
 */
export function readAppNameLabel(config: UiConfig, details: CompanyDetails | null): string {
  if (details?.appName) {
    return details.appName;
  }
  const isPending = isCompanyPending(config, details);
  if (isPending) {
    return "";
  }
  return config.appName ?? config.appNameKey;
}

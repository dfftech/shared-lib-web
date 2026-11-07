// query-param.ts
// Reads and changes query parameters of the address bar WITHOUT a redirect or page reload (no router).
//
//   openPage("/profiles");                 // ?page=profiles   (pages are menu hrefs; the address bar has no leading slash)
//   setQueryParam("id", "42");             // ?page=profiles&id=42   (adds or replaces, keeps the other params)
//   readQueryParam("id");                  // "42"  (components re-render when it changes)
//   removeQueryParam("id");                // ?page=profiles
//
// Back / forward buttons update the values too.

import { ConstValue } from "dff-util";
import {
  DEFAULT_HOME_PAGE,
  DEFAULT_PAGE_PARAM,
  currentPageSignal,
  isSidebarOpenSignal,
  pathnameSignal,
  toPageFromPath,
  openMegaMenuIdSignal,
  queryParamsSignal,
  railFlyoutSignal,
  readIsPathPageMode,
  uiConfigSignal,
} from "../state/signals.ts";
import { toPagePath, toPageParamValue } from "./page-path.ts";

/** Values to set. undefined, null or "" removes the parameter. */
export type QueryParamValues = Record<string, string | number | boolean | null | undefined>;

export interface QueryParamOptions {
  /** true replaces the browser history entry (back does not return to the old value). Default false. */
  isReplace?: boolean;
}

export interface OpenPageOptions extends QueryParamOptions {
  /** true keeps the other query parameters of the old page (for example ?userId). Default false: they are removed. */
  isKeepingOtherParams?: boolean;
}

let isQueryParamSyncStarted = false;

/** "/" is allowed in a query string, so ?page=components/forms stays readable (not components%2Fforms). */
const ENCODED_SLASH = "%2F";

/** Reads the query parameters from the address bar into a plain object. */
export function readAddressBarParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    return params;
  }
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/** Copies the address bar parameters (and path) into queryParamsSignal / pathnameSignal. */
export function syncQueryParams(): void {
  queryParamsSignal.value = readAddressBarParams();
  pathnameSignal.value = window.location.pathname;
}

/** One query parameter, or undefined. Components that call it re-render when it changes. */
export function readQueryParam(key: string): string | undefined {
  const params = queryParamsSignal.value;
  return params[key];
}

/** All query parameters as an object. */
export function readQueryParams(): Record<string, string> {
  return queryParamsSignal.value;
}

/** true when the value should remove the parameter. */
function isEmptyValue(value: QueryParamValues[string]): boolean {
  return value === undefined || value === null || value === ConstValue.EMPTY;
}

/** Builds "?a=1&b=2" from the current parameters changed by values (the address bar is not changed). */
export function buildQueryString(values: QueryParamValues): string {
  const currentParams = readAddressBarParams();
  const searchParams = new URLSearchParams(currentParams);
  for (const [key, value] of Object.entries(values)) {
    const isEmpty = isEmptyValue(value);
    if (isEmpty) {
      searchParams.delete(key);
      continue;
    }
    const text = String(value);
    searchParams.set(key, text);
  }
  const encodedText = searchParams.toString();
  const queryText = encodedText.replaceAll(ENCODED_SLASH, ConstValue.SLASH);
  return queryText.length > 0 ? `?${queryText}` : ConstValue.EMPTY;
}

/** Builds the full href (path + query + hash) for changed values, for links. pathname: another path (path mode). */
export function buildQueryHref(values: QueryParamValues, pathname: string = window.location.pathname): string {
  const queryString = buildQueryString(values);
  const hash = window.location.hash;
  return `${pathname}${queryString}${hash}`;
}

/** Sets several query parameters at once (no redirect). undefined / null / "" removes one. */
export function setQueryParams(values: QueryParamValues, options: QueryParamOptions = {}): void {
  const href = buildQueryHref(values);
  applyHref(href, options);
}

/** Puts a new address in the bar (history entry, no reload) and updates the signals. */
function applyHref(href: string, options: QueryParamOptions): void {
  const currentHref = buildQueryHref({});
  if (href === currentHref) {
    syncQueryParams();
    return;
  }
  if (options.isReplace) {
    window.history.replaceState(window.history.state, ConstValue.EMPTY, href);
  } else {
    window.history.pushState(window.history.state, ConstValue.EMPTY, href);
  }
  syncQueryParams();
}

/** Adds or changes one query parameter (no redirect). undefined / null / "" removes it. */
export function setQueryParam(key: string, value: QueryParamValues[string], options: QueryParamOptions = {}): void {
  const values: QueryParamValues = { [key]: value };
  setQueryParams(values, options);
}

/** Removes one query parameter (no redirect). */
export function removeQueryParam(key: string, options: QueryParamOptions = {}): void {
  setQueryParam(key, undefined, options);
}

/** Name of the query parameter that holds the current page (config.layout.pageParam, default "page"). */
export function readPageParam(): string {
  const config = uiConfigSignal.peek();
  return config?.layout?.pageParam ?? DEFAULT_PAGE_PARAM;
}

/** The home page (config.homePath, default "/"). */
export function readHomePage(): string {
  const config = uiConfigSignal.peek();
  return config?.homePath ?? DEFAULT_HOME_PAGE;
}

/** The current page (?page or the path, else the home page). */
export function readCurrentPage(): string {
  return currentPageSignal.value;
}

/**
 * true when pages live in the path (/profiles) instead of ?page: config.layout.pageMode "path",
 * or no pageMode and the app type "shell".
 */
export function isPathPageMode(): boolean {
  const config = uiConfigSignal.peek();
  return readIsPathPageMode(config);
}

/**
 * The page of any address, for code outside React (for example a single-spa activeWhen(location)):
 *   pageMode "query": ?page=profiles -> "/profiles"     pageMode "path": /profiles -> "/profiles"
 * No page -> the home page.
 */
export function readPageFromLocation(location: Location | URL): string {
  const homePage = readHomePage();
  if (isPathPageMode()) {
    const pathPage = toPageFromPath(location.pathname);
    return pathPage || homePage;
  }
  const params = new URLSearchParams(location.search);
  const pageParam = readPageParam();
  const pageValue = params.get(pageParam) ?? ConstValue.EMPTY;
  const page = toPagePath(pageValue);
  return page || homePage;
}

/**
 * The query values that open a page. The home page removes ?page, so the address stays clean.
 * The value has no leading slash: "/profiles" -> ?page=profiles.
 */
export function buildPageValues(page: string): QueryParamValues {
  const pageParam = readPageParam();
  const homePage = readHomePage();
  const pagePath = toPagePath(page);
  const homePath = toPagePath(homePage);
  const isHomePage = pagePath === homePath;
  const paramValue = toPageParamValue(pagePath);
  const pageValue = isHomePage ? undefined : paramValue;
  return { [pageParam]: pageValue };
}

/** The path of a page in path mode: "/profiles"; the home page -> "/". */
export function buildPagePath(page: string): string {
  const pagePath = toPagePath(page);
  return pagePath || ConstValue.SLASH;
}

/** href of a page link: "/?page=profiles" (query mode) or "/profiles" (path mode). */
export function buildPageHref(page: string): string {
  if (isPathPageMode()) {
    const pagePath = buildPagePath(page);
    const clearValues = buildClearValues();
    return buildQueryHref(clearValues, pagePath);
  }
  const values = buildPageValues(page);
  return buildQueryHref(values);
}

/** Closes the drawer, mega menu and rail flyout. */
function closeOpenMenus(): void {
  isSidebarOpenSignal.value = false;
  openMegaMenuIdSignal.value = ConstValue.EMPTY;
  railFlyoutSignal.value = { groupId: ConstValue.EMPTY, top: 0 };
}

/** Values that remove every current query parameter (used when a new page opens). */
export function buildClearValues(): QueryParamValues {
  const currentParams = readAddressBarParams();
  const clearValues: QueryParamValues = {};
  for (const key of Object.keys(currentParams)) {
    clearValues[key] = undefined;
  }
  return clearValues;
}

/**
 * Shows a page: sets ?page=<page> (or the path /<page> in pageMode "path"; no redirect), closes open menus and
 * scrolls to the top.
 * The old page's parameters are removed unless options.isKeepingOtherParams is true.
 * Extra values are set in the same step, for example openPage("/profiles", { userId: "42" }).
 */
export function openPage(page: string, extraValues: QueryParamValues = {}, options: OpenPageOptions = {}): void {
  const clearValues = options.isKeepingOtherParams ? {} : buildClearValues();
  if (isPathPageMode()) {
    const pagePath = buildPagePath(page);
    const pathValues: QueryParamValues = { ...clearValues, ...extraValues };
    const pathHref = buildQueryHref(pathValues, pagePath);
    applyHref(pathHref, options);
  } else {
    const pageValues = buildPageValues(page);
    const values: QueryParamValues = { ...clearValues, ...extraValues, ...pageValues };
    setQueryParams(values, options);
  }
  closeOpenMenus();
  window.scrollTo(0, 0);
}

/** Back / forward: read the parameters again and close open menus. */
function handlePopState(): void {
  syncQueryParams();
  closeOpenMenus();
}

/** Reads the parameters and listens to back / forward (the listener is added only once). */
export function startQueryParamSync(): void {
  syncQueryParams();
  if (isQueryParamSyncStarted) {
    return;
  }
  isQueryParamSyncStarted = true;
  window.addEventListener("popstate", handlePopState);
}

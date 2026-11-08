// fake-api.ts — the fake backend of this example: a Vite plugin (dev server and preview) that answers the sor URLs
// from the JSON files in fake-api/. A real app has no such file: AppHttp calls the real services.
//
//   GET /api/org-sor/company-details                        -> fake-api/company-details.json
//   GET /api/org-sor/load/LANG?active=true                  -> fake-api/languages.json
//   GET /api/org-sor/load/BRANCHS?profile=<id>              -> fake-api/branches.json
//   GET /api/org-sor/content-load?query=theme               -> fake-api/themes.json
//   GET /api/org-sor/content-load?query=locales             -> every fake-api/locales/<code>.json: { "en-US": {...} }
//   GET /api/org-sor/content-load?query=locales.<code>      -> fake-api/locales/<code>.json
//   GET /api/org-sor/authorization/<persona>?roles=<roles>  -> fake-api/menu-access.json
// Replies are { data: ... }, like the real services (readContent() / setMenu() take "data" off).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const dataFolderUrl = new URL("./fake-api/", import.meta.url);
const DATA_FOLDER = fileURLToPath(dataFolderUrl);
const SOR_PREFIX = "/api/org-sor";
const LOCALES_QUERY = "locales";
const LOCALE_QUERY_PREFIX = "locales.";

/** Fixed paths -> data file. */
const FILE_ROUTES: Record<string, string> = {
  "/company-details": "company-details.json",
  "/load/LANG": "languages.json",
  "/load/BRANCHS": "branches.json",
};

/** A JSON file of fake-api/ (undefined when it is missing). */
function readDataFile(fileName: string): unknown {
  const filePath = `${DATA_FOLDER}${fileName}`;
  if (!existsSync(filePath)) {
    return undefined;
  }
  const text = readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

/** Every language of fake-api/locales: { "en-US": {...}, "te-IN": {...} }. */
function readAllLocales(): Record<string, unknown> {
  const locales: Record<string, unknown> = {};
  const fileNames = readdirSync(`${DATA_FOLDER}locales`);
  for (const fileName of fileNames) {
    const languageCode = fileName.replace(".json", "");
    locales[languageCode] = readDataFile(`locales/${fileName}`);
  }
  return locales;
}

/** content-load: theme, locales (all) or locales.<code>. */
function readContentLoad(query: string): unknown {
  if (query === "theme") {
    return readDataFile("themes.json");
  }
  if (query === LOCALES_QUERY) {
    return readAllLocales();
  }
  if (query.startsWith(LOCALE_QUERY_PREFIX)) {
    const languageCode = query.slice(LOCALE_QUERY_PREFIX.length);
    return readDataFile(`locales/${languageCode}.json`);
  }
  return undefined;
}

/** The reply of one sor path (undefined = not found). Data files that are { data } already stay as they are. */
function readSorReply(path: string, params: URLSearchParams): unknown {
  const routeFile = FILE_ROUTES[path];
  if (routeFile) {
    return readDataFile(routeFile);
  }
  if (path === "/content-load") {
    const query = params.get("query") ?? "";
    const content = readContentLoad(query);
    return content === undefined ? undefined : { data: content };
  }
  if (path.startsWith("/authorization/")) {
    return readDataFile("menu-access.json");
  }
  return undefined;
}

/** Middleware: answers /api/org-sor/... and passes everything else on. */
function answerSor(request: IncomingMessage, response: ServerResponse, next: () => void): void {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  if (!requestUrl.pathname.startsWith(SOR_PREFIX)) {
    next();
    return;
  }
  const sorPath = requestUrl.pathname.slice(SOR_PREFIX.length);
  const reply = readSorReply(sorPath, requestUrl.searchParams);
  if (reply === undefined) {
    response.statusCode = 404;
    response.end();
    return;
  }
  response.setHeader("Content-Type", "application/json");
  const body = JSON.stringify(reply);
  response.end(body);
}

/** Adds the fake backend to a Vite dev server or preview server. */
function useFakeApi(server: { middlewares: { use: (handler: typeof answerSor) => void } }): void {
  server.middlewares.use(answerSor);
}

/** The fake backend plugin: plugins: [fakeApi(), ...]. */
export function fakeApi(): Plugin {
  return { name: "fake-api", configureServer: useFakeApi, configurePreviewServer: useFakeApi };
}

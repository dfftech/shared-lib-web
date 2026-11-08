# shared-lib-web

A shared **React 19 component library** for DesignForFeature apps, shipped as one npm package.
Open source under the [MIT license](./LICENSE): free for anybody to use.

| Entry | Required? | What |
| --- | --- | --- |
| `shared-lib-web` | **yes** | Provider, all Type* controls, page blocks, menus, switchers, overlays, skeletons, states, i18n, themes, AppHttp / AppStorage |
| `shared-lib-web/layout` | optional | Ready-made app shell: one **single layout** (`AppLayout`, `AsideLayout`, `AuthLayout`) or its **individual parts** (`Header`, `Sidebar`, `SidebarNav`, `MegaMenuBar`, `MegaMenuPanel`, `RailFlyout`) |
| `shared-lib-web/markdown` | optional | `TypeMdx`, `TypeMdv`, `TypeLangMd` (needs `@uiw/react-md-editor`) |

The project decides the layout: use `AppLayout` as it is, turn off / replace its parts, build an own layout from the
single parts, or skip `shared-lib-web/layout` completely and write the whole layout itself.

An app keeps **only**:

1. `config.ts` – app name, logos, layout, http and the loaders: `loadLocale`, `loadThemes`, `loadSupportLanguages`,
   `loadBranches`, `loadMenuNavigation` (the provider calls them itself)
2. `<SharedWebUiProvider type="spa" | "shell" | "mfe" config={config}>
3. `locales/<code>/<group>.json` – its texts, one folder per language and one file per group (`en-US/nav.json` …)
4. its pages / modules

Everything else lives in the library: components and (optionally) layouts, header, sidebar (with icon rail),
full-width mega menu, pages by query parameter (no router), DaisyUI light/dark themes, lightweight i18n, RTL/LTR, permissions,
localStorage persistence, toasts, skeletons, overlays and `react-hook-form` controls.

Stack: React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · DaisyUI 5 · `@preact/signals-react` ·
`lucide-react` (through `TypeIcon`) · `react-hook-form` · `dff-util`.
**No router (no react-router-dom), no AG Grid.** Markdown fields are an optional extra entry (`shared-lib-web/markdown`).

The source follows strict readability rules (no nested functions, no `abcd(xyz())`, no chained calls,
lowercase file names) – see [CODING_RULES.md](./CODING_RULES.md). AI agents: read `.agent/skills/` in the repository.

---

## Install

```bash
npm install shared-lib-web dff-util react react-dom @preact/signals-react lucide-react react-hook-form
npm install -D tailwindcss daisyui        # + your bundler's Tailwind plugin, e.g. @tailwindcss/vite or @tailwindcss/postcss
# optional, only for shared-lib-web/markdown
npm install @uiw/react-md-editor
```

## CSS

```css
/* src/index.css */
@import "tailwindcss";
@import "shared-lib-web/styles.css"; /* lets Tailwind find the classes used inside the library */
@plugin "daisyui" {
  themes: all;   /* all 35 DaisyUI themes; or list the ones you need */
}
```

`config.themes` is optional: without it the theme switcher offers all 35 DaisyUI themes (enable them with
`themes: all`, or list the ones you need and pass the same names in `config.themes`). The dark ones (dark logo,
dark markdown editor) default to the DaisyUI dark themes; `config.darkThemes` replaces that list.

### Custom themes as JSON (no CSS file, no rebuild)

Your own themes are plain data: an **object keyed by theme name**, each with `isDark`, `name` and the DaisyUI theme
variables (`name` may be left out — the key is the name; a plain list `[{ name, ... }]` still works). Pass them with
`config.loadThemes` (or `config.customThemes`); they are listed first in the switcher, and `isDark: true` adds them to the dark themes.
The library writes one `<style>` with `[data-theme="org-dark"] { color-scheme: dark; --color-primary: …; }`, which
DaisyUI's components read like a built-in theme.

```json
// src/theme/org-themes.json
{
  "org-dark": {
    "isDark": true,
    "name": "org-dark",
    "variables": {
      "border": "1px",
      "color-accent": "oklch(70.4% 0.04 256.8)",
      "color-accent-content": "oklch(12.9% 0.042 264.7)",
      "color-base-100": "oklch(25.5% 0.04 264.5)",
      "color-base-200": "oklch(20.8% 0.042 265.8)",
      "color-base-300": "oklch(32% 0.04 262)",
      "color-base-content": "oklch(92.9% 0.013 255.5)",
      "color-error": "oklch(70.4% 0.191 22.2)",
      "color-error-content": "oklch(25.8% 0.092 26)",
      "color-info": "oklch(78.9% 0.154 211.5)",
      "color-info-content": "oklch(30.2% 0.056 229.7)",
      "color-neutral": "oklch(37.2% 0.044 257.3)",
      "color-neutral-content": "oklch(96.8% 0.007 247.9)",
      "color-primary": "oklch(74.6% 0.16 232.7)",
      "color-primary-content": "oklch(29.3% 0.066 243.2)",
      "color-secondary": "oklch(82.8% 0.189 84.4)",
      "color-secondary-content": "oklch(27.9% 0.077 45.6)",
      "color-success": "oklch(79.2% 0.209 151.7)",
      "color-success-content": "oklch(26.6% 0.065 152.9)",
      "color-warning": "oklch(75% 0.183 55.9)",
      "color-warning-content": "oklch(26.6% 0.079 36.3)",
      "depth": "1",
      "noise": "0",
      "radius-box": "0.75rem",
      "radius-field": "0.5rem",
      "radius-selector": "1rem",
      "size-field": "0.25rem",
      "size-selector": "0.25rem"
    }
  },
  "org-light": {
    "isDark": false,
    "name": "org-light",
    "variables": {
      "border": "1px",
      "color-accent": "oklch(55.4% 0.046 257.4)",
      "color-accent-content": "oklch(98.4% 0.003 247.9)",
      "color-base-100": "oklch(100% 0 0)",
      "color-base-200": "oklch(96.8% 0.007 247.9)",
      "color-base-300": "oklch(92.9% 0.013 255.5)",
      "color-base-content": "oklch(20.8% 0.042 265.8)",
      "color-error": "oklch(55% 0.23 27.3)",
      "color-error-content": "oklch(97.1% 0.013 17.4)",
      "color-info": "oklch(71.5% 0.143 215.2)",
      "color-info-content": "oklch(30.2% 0.056 229.7)",
      "color-neutral": "oklch(27.9% 0.041 260)",
      "color-neutral-content": "oklch(98.4% 0.003 247.9)",
      "color-primary": "oklch(55.8% 0.154 249.1)",
      "color-primary-content": "oklch(98.5% 0.01 240)",
      "color-secondary": "oklch(76.9% 0.188 70.1)",
      "color-secondary-content": "oklch(27.9% 0.077 45.6)",
      "color-success": "oklch(52.7% 0.154 150.1)",
      "color-success-content": "oklch(98.2% 0.018 155.8)",
      "color-warning": "oklch(75% 0.183 55.9)",
      "color-warning-content": "oklch(26.6% 0.079 36.3)",
      "depth": "1",
      "noise": "0",
      "radius-box": "0.75rem",
      "radius-field": "0.5rem",
      "radius-selector": "1rem",
      "size-field": "0.25rem",
      "size-selector": "0.25rem"
    }
  }
}
```

Load them lazily with `loadThemes`, the same way as `loadLocale` (its own chunk, loaded when the provider mounts):

```ts
// config.ts
import type { CustomThemesModule, UiConfig } from "shared-lib-web";

function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

export const config: UiConfig = {
  appNameKey: "ORG",
  loadThemes: loadThemes,   // + all 35 DaisyUI themes (themes is optional)
};
```

`loadThemes` can also read from your API or a file deployed next to the app (change the themes without a build):

```ts
async function loadThemes(): Promise<CustomThemesModule> {
  const response = await fetch("/themes.json");
  return response.json();
}
```

While they load, a saved custom theme stays on screen (no flash of the default theme); when the load fails or the
saved theme is not in the result, the default theme is used. Themes you already have in code can go straight into
`customThemes: orgThemes` (no loading; the object keyed by name, or a list); both together are merged, and a loaded theme replaces one with the same name.

The variable names are the DaisyUI ones, with or without `--`: `color-base-100/200/300`, `color-base-content`,
`color-primary`, `color-primary-content`, `color-secondary`, `color-accent`, `color-neutral`, `color-info`,
`color-success`, `color-warning`, `color-error` (each with `-content`), `radius-selector`, `radius-field`,
`radius-box`, `size-selector`, `size-field`, `border`, `depth`, `noise`. Theme names may use lowercase letters,
digits and `-`; values with `; { } < > " \` are skipped (safe for JSON from a server).

**Or a signal:** `loadThemes: themesSignal` (`signal<CustomThemesModule | null>(null)`). `null` = not here yet (a
saved custom theme stays on screen); every new value replaces the loaded themes:

```ts
const themeModule = await import("./theme/org-themes.json");
themesSignal.value = themeModule;
```

Any time later (for example after the user signs in) `setCustomThemes(themes)` replaces the custom themes (the object
keyed by name or a list). `toCustomThemeList(themes)` turns the object into a list (`CustomTheme[]`, key order).

The theme dropdown, the ⚙ settings dialog and the example Settings page show **Light themes** and **Dark themes**
as two groups (split by the dark themes). In your own UI: `const { lightThemes, darkThemes } = useUi();`
or `splitThemesByMode(themes)`, `isDarkThemeName(theme)`. Texts: `ui.lightThemes`, `ui.darkThemes`.

## App bundler (Vite example)

The library itself has no bundler. Your **app** uses its own (Vite, Next.js, webpack …).
`dff-util` uses packages that expect Node's `global`, so define it — with Vite:

```ts
export default defineConfig({
  plugins: [reactPlugin, tailwindPlugin],
  define: { global: "globalThis" },
});
```

---

## 1. config.ts

```ts
import { loadLocaleGroups, readEnvData, toAbsoluteUrl, type CustomThemesModule, type UiConfig } from "shared-lib-web";

const APP_NAME_KEY = "ORG";
const APP_API_KEY = APP_NAME_KEY.toLowerCase();   // "org" -> /org-api, /org-sor ...

// window.env.REACT_APP_ORG_API_BASE_URL (env.js), else the default
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "https://api.example.com/api");

// Service paths are PROJECT level (not part of AppHttp). AppHttp adds the base URL to a path:
// AppHttp.Get(`${MsUrl.main}/menu-access`) -> https://api.example.com/api/org-api/menu-access
export const MsUrl = {
  api: `/${APP_API_KEY}-api`,
  main: `/${APP_API_KEY}-api`,
  sor: `/${APP_API_KEY}-sor`,
  events: `/${APP_API_KEY}-events`,
  tms: `/${APP_API_KEY}-tms`,
  utils: `/${APP_API_KEY}-util`,
};

/** locales/<code>/<group>.json — lazy: only the files of the language in use are downloaded (see section 2) */
const localeFiles = import.meta.glob("./locales/*/*.json");

/** theme/org-themes.json, loaded lazily like the locale files (see "Custom themes as JSON") */
function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,                 // key: storage ORG-TOKEN, env REACT_APP_ORG_API_BASE_URL
  loadCompanyDetails: `${MsUrl.sor}/company-details`,   // app name, logos, favicon from the backend (see "Company details")
  // appName / logoUrl / logoDarkUrl: only for apps WITHOUT company details (static brand)
  // defaultLanguage: "en-US",             // optional: without it the browser / system language, else en-US
  loadLocale: loadLocaleGroups.bind(null, localeFiles),
  // defaultTheme: "light",              // optional: without it the browser preference picks "dark" or "light"
  loadThemes: loadThemes,                  // optional: your own themes as JSON (see "Custom themes as JSON")
  // themes: ["light", "dark"],            // optional: default all 35 DaisyUI themes
  layout: { menuMode: "sidebar", isSidebarCollapsible: true },
  http: { baseUrl: API_BASE_URL, logoutUrl: "/login" },
};
```

| Setting | What it does |
| --- | --- |
| `defaultLanguage` | Optional. Language of the first visit (nothing saved). Without it the **browser / system language** is used: `navigator.languages` matched to the language list (exact code, else the same base language: `fr-CA` → `fr-FR`); without a list each browser code is tried and a missing locale file is skipped. Nothing matches → `"en-US"`. Keys missing in a language are shown in `defaultLanguage` (else en-US). Without `defaultLanguage`, `languages`, `loadLocale` and `loadSupportLanguages` the app runs in en-US with the library's built-in English texts and no language switcher. |
| `loadLocale(code)` | Loads the texts of a language lazily (dynamic `import()` / `import.meta.glob`): `loadLocaleGroups.bind(null, localeFiles)` for `locales/<code>/<group>.json`, or your own function returning one JSON. |
| `languages` | Not needed: the list comes from `loadSupportLanguages` (below). Only for apps with a fixed list (`{ code, label, flag?, direction?, load? }`). |
| `themes`, `darkThemes` | Optional. The theme switcher list (default: all 35 DaisyUI themes) and the dark ones (default: the DaisyUI dark themes). Dark themes switch to `logoDarkUrl` and dark markdown. |
| `customThemes`, `loadThemes` | Optional. Your own themes as data / JSON — an object keyed by theme name (`{ "org-dark": { isDark, name, variables }, ... }`) or a list — listed first: `customThemes` directly, or `loadThemes()` lazily like `loadLocale` (JSON file or API). Later ones: `setCustomThemes(json)`. |
| `defaultTheme` | Optional. Theme of the first visit (nothing saved yet). Without it the browser preference decides: `"dark"` when it prefers a dark colour scheme, otherwise `"light"`. |
| `layout.headerSettings` | `"inline"` (language + theme switchers in the header) or `"menu"` (one ⚙ button opening a settings dialog with language, theme and navigation style). |
| `layout.toastPosition`, `layout.showScrollToTop` | Toast corner (`top-end` …) and the scroll-to-top button. |
| `layout.showMenu` | Menu shown at start (default `true`); switch at runtime with `setMenuVisible()` / `toggleMenuVisible()`. |
| `layout.menuMode` | `"sidebar"` (drawer + collapsible icon rail) or `"megamenu"` (top bar + full-width panels). Users can switch with `changeNavigationMode()`; the choice is saved. |
| `homePath`, `layout.pageParam` | The page shown when `?page` is missing (default `/`) and the name of the page parameter (default `page`). |
| `http.baseUrl` | API base URL of `AppHttp` (`window.env.REACT_APP_<APPNAMEKEY>_API_BASE_URL` wins when set; a relative `/api` becomes absolute). |
| `http.logoutUrl` | Where the browser goes after `endSession()` (log out), for example `/login` or an SSO logout URL. `endSession(keepKeys, false)` stays on the page. |
| `http.tokenKey`, `http.headers`, `http.loadUrl`, `http.showProgress` | Optional: AppStorage key of the token (default `TOKEN`), extra headers, `AppHttp.Load` URL or path (default `/load` on the base URL), progress bar (default `true`). |
| `appNameKey` | Key of the app (`ENV_BASE_NAME`): prefix of every AppStorage key (`ORG-TOKEN`, `ORG-LANG`) and of the `window.env` names (`REACT_APP_ORG_…`). The key names are fixed constants — no `storage` / `languageKey` / `themeKey` settings. |
| `appName`, `logoUrl`, `logoDarkUrl` | Optional static brand, for apps without `loadCompanyDetails`: label in header, sidebar and login (`t(config.appName)`, default `appNameKey`) and the logos. Not needed when the company details come from the backend. |
| `loadCompanyDetails` | Optional. Company / brand details from the backend (`{ appName, companyName, faviconUrl, logoUrl, logoDarkUrl }`), loaded once on start; they win over `appName`, `logoUrl`, `logoDarkUrl`. See "Company details" below. |
| `loadSupportLanguages`, `loadBranches`, `loadMenuNavigation` | Backend loaders the provider calls (like `loadThemes`): languages on start, branches then menu after sign in. See "Backend data" below. |
| `navigation` | Not needed: the menu comes from `loadMenuNavigation` (below). Only for apps with a fixed menu and no backend (`NavItem[]`). |
| `navOptions` | How the backend menu is converted: `rootMenuIds` (default: groups named "Root" or ids ending in `_ROOT`), `isRootFlattened` (default `true`). |

### Backend data: `loadSupportLanguages`, `loadBranches`, `loadMenuNavigation`

Like `loadThemes`, these are loaders in the config, and the provider calls them itself — no `nav` / `lang` /
`branch` props. A loader is your function returning the reply (or just a URL / path, sent with `AppHttp.Get`).
Replies may be `{ data: [...], meta }` or only the list.

```ts
// config.ts
function loadSupportLanguages(): Promise<unknown> {
  return AppHttp.Get(`${MsUrl.main}/languages`);           // { data: [{ code: "en-US", name: "English", isDefault: true }] }
}

function loadBranches(): Promise<unknown> {
  return AppHttp.Get(`${MsUrl.main}/branches`);
}

function loadMenuNavigation(): Promise<unknown> {
  return AppHttp.Get(`${MsUrl.main}/menu-access`, { persona: "admin" });
}

export const config: UiConfig = {
  appNameKey: "ORG",
  loadLocale: loadLocale,
  loadThemes: loadThemes,
  loadSupportLanguages: loadSupportLanguages,   // on start             -> language switchers
  loadBranches: loadBranches,                   // after sign in         -> branch switcher (before the menu)
  loadMenuNavigation: loadMenuNavigation,       // after sign in         -> menu (skeleton until it answers)
};
```

| When | What happens |
| --- | --- |
| Provider mounts | `loadSupportLanguages` runs once; on an error the default language stays. |
| Sign in (`startSession`) or a restored session on start | `loadBranches`, then `loadMenuNavigation` (so the menu request sends `x-branch-id`). A menu error shows an empty menu, a branch error no switcher. |
| Sign out (`endSession`) | Branches removed; the menu goes back to the skeleton for the next user. |

**Or pass signals.** Each of the three can also be a signal you fill yourself (`null` first, then the reply). The
provider follows it: every new value is shown at once, and nothing is called for it (no sign-in rule — your code
decides when it changes):

```ts
// nav.service.ts
export const navSignal = signal<MenuSource | null>(null);        // null = menu skeleton
export const branchSignal = signal<BranchSource | null>(null);   // null = no branch switcher
export const supportLangSignal = signal<LangSource | null>(null);       // null = no list yet

export async function loadNav(): Promise<void> {
  navSignal.value = await AppHttp.Get(`${MsUrl.main}/menu-access`) as MenuSource;
}

// config.ts
loadSupportLanguages: supportLangSignal,
loadBranches: branchSignal,
loadMenuNavigation: navSignal,
```

Functions, URLs and signals can be mixed (for example languages as a function, the menu as a signal).

Without `loadMenuNavigation` the menu is `config.navigation` (static). By hand, without loaders: `setLanguages(reply)`,
`setBranches(reply)`, `setMenuLoading()` → `setMenu(reply)`, `clearMenu()`.

### Company details: `loadCompanyDetails`

The app name, company name, favicon and logos can come from the backend:

```json
// GET /org-api/company-details  (or { "data": { ... } })
{
  "appName": "YourAppName",
  "companyName": "YourBrandName",
  "faviconUrl": "https://www.w3.org/favicon.ico",
  "logoUrl": "https://www.w3.org/Icons/w3c_home.png",
  "logoDarkUrl": "https://www.w3.org/Icons/w3c_home.png"
}
```

```ts
// config.ts — a function, a URL / path (AppHttp.Get) or a signal, like the other loaders
loadCompanyDetails: `${MsUrl.sor}/company-details`,
// or: loadCompanyDetails: companySignal,   // signal<CompanySource | null>(null); null = config values for now
```

| Field | Used for |
| --- | --- |
| `appName` | Label in the header, sidebar and login (wins over `config.appName`) and the browser tab title |
| `companyName` | Alt text of the logo; read `companyDetailsSignal.value?.companyName` to show it anywhere (footer, login) |
| `faviconUrl` | `<link rel="icon">` (created when the page has none) |
| `logoUrl` | Logo on light themes, and on dark themes without `logoDarkUrl` (wins over `config.logoUrl` / `logoDarkUrl`) |
| `logoDarkUrl` | Logo on dark themes (wins over `config.logoDarkUrl`) |

**No `appName`, `logoUrl` or `logoDarkUrl` in the config is needed** — the brand comes from this reply (the example
apps have none in their config). Until it arrives no app name and no logo are shown (the app key does not flash);
on an error the app key is shown. Every field is optional: a missing one keeps the config value, when the config
has one. Loaded once when the provider mounts; on an error the
config values stay. Not called for type `"mfe"` (the shell owns the brand). By hand: `setCompanyDetails(reply)`.
Helpers: `readLogoUrl(config, isDarkTheme, details)`, `readAppNameLabel(config, details)`, `readCompanyDetails(reply)`.
The example apps load sor `/company-details` into `companySignal` on start.

### Layout choice (shell with microfrontends)

`layoutChoiceSignal` (`"app"` | `"aside"`) and `changeLayoutChoice(choice)` keep the picked app layout in
`LAYOUT_CHOICE` (localStorage). The provider reads it on start, and every copy of the library on the page (shell and
MFEs) follows a change at once, like the theme. The shell renders `AppLayout` or `AsideLayout` from it; an MFE uses
it to know whether the shell shows a header (`isAsideLayoutSignal`).

### App type: `<SharedWebUiProvider type="...">`

| `type` | For | Differences |
| --- | --- | --- |
| `"spa"` (default) | a normal app | layouts, menu, login; pages in `?page=...` |
| `"shell"` | the root app that hosts microfrontends | like `spa`, but pages are paths by default (`/settings`) |
| `"mfe"` | a microfrontend inside a shell | page layouts only: no menu (no skeleton), `loadMenuNavigation` / `loadBranches` / `loadCompanyDetails` not called (the shell owns them); `appName`, `logoUrl`, `logoDarkUrl`, `homePath`, `branchLabel` are not used. `loadSupportLanguages` still works. |

`layout.pageMode` set in the config always wins over the type.

What happens to the reply (`MenuAccessType`: `id`, `name`, `nameLang`, `href`, `icon`, `type`, `priority`,
`read/create/update/delete` or `permissions`, `active`, `children`):

- the children of the **Root** group (`ADMIN_ROOT`) move to the top level, in the place of the group;
- sorted by `priority`; the same priority keeps the backend order; `active: false` is removed;
- icons like `layout-dashboard`, `users`, `User-Round-Key` become lucide names (unknown → `Circle`);
- `nameLang` `{ "en-US": "..." }` is used for `en`, `en-US`, … (`trans()`), else `name`;
- `read: false` hides the item and blocks the page; `create/update/delete` feed `canAccess()`.

`toNavigation(menuResponse, options)` does the conversion if you need the `NavItem[]` yourself.

### Languages from the backend (`loadSupportLanguages`)

Called once on start (see above). Texts come from `locales/<code>/<group>.json` via `loadLocale`.

- Row fields: `code` (or `langCode` / `languageCode` / `id`), `name` or `label`, `flag`, `direction` or `dir`,
  `isDefault` (or `default`), `active` (false hides it), `priority`. RTL is automatic for `ar`, `he`, `fa`, `ur`.
- Until the reply arrives: the saved language, else `defaultLanguage`, else the browser language (when its file
  loads), else `en-US` is shown; the switchers have no list yet.
- When the list arrives: the user's saved language stays if it is listed; otherwise the row with `isDefault`,
  else `defaultLanguage`, else the browser / system language (matched to the list), else `en-US`,
  else the first is loaded. Only a language the user picks is saved to localStorage.
- `TypeLang` / `TypeLangMd` fields get one entry per listed language: `{ "en-US": "...", "ar-SA": "..." }`;
  backend `nameLang` with the same codes is shown by `trans()` and the menu.
- By hand: `setLanguages(reply)`. Conversion only: `toLanguageOptions(reply)`, `readDefaultLanguageCode(reply)`.

### AppStorage and AppHttp

The same helpers the apps had in `utils/services/app.storage.ts` and `app.http.ts`, now in the library:

```ts
import { AppHttp, AppStorage, BRANCH_ID, LANG, THEME, TOKEN } from "shared-lib-web";

AppStorage.setData(BRANCH_ID, branchId);          // sessionStorage "ORG-BRANCH_ID"
const token = AppStorage.getData(TOKEN);          // objects come back parsed
AppStorage.getText(THEME);                        // localStorage "ORG-THEME"
AppStorage.removeData(BRANCH_ID);                 // from both storages
AppStorage.clearData();                           // log out: keeps the localStorage preferences
AppStorage.envData("API_BASE_URL");               // window.env.REACT_APP_ORG_API_BASE_URL (env.js of the deployed app)

// MsUrl comes from the project's config.ts (see section 1)
const rows = await AppHttp.Get(`${MsUrl.main}/profile/search`, params);

// A path works too: it is appended to http.baseUrl (or window.env API_BASE_URL)
const same = await AppHttp.Get("/org-api/profile/search", params);   // -> https://api.example.com/api/org-api/profile/search
```

**URLs in every AppHttp method** (`Get`, `Post`, `Put`, `Delete`, `Patch`, `Load`, `Media`, `CloudUpload`, `DownloadFile`): a URL that
starts with `http://` or `https://` is used as it is; anything else is appended to the base URL with one `/` between
(`"/items"` and `"items"` both become `<baseUrl>/items`). `AppHttp.FullUrl(url)` returns the URL a request would use.

**Binary files:** `AppHttp.Media(url, params?)` is a GET that returns the body as a `Blob` (images, video, audio, any
file), with the same headers (token, `x-session-id`, `x-branch-id`, no `Content-Type`) and no progress bar:

```ts
const blob = await AppHttp.Media(`${MsUrl.utils}/files/${fileId}`);
const objectUrl = URL.createObjectURL(blob);   // <img src={objectUrl} />; URL.revokeObjectURL(objectUrl) when done
```

**Which storage:** decided only by the key (no argument).

| localStorage (preferences, kept on log out) | sessionStorage (everything else) |
| --- | --- |
| `LANG`, `THEME`, `LAYOUT_CHOICE`, `MENU_MODE`, `SIDEBAR_COLLAPSED`, `REMEMBER_ME` + `config.localStorageKeys` | `TOKEN`, `ACTIVE_SESSION_ID` (tab id, sent as `x-session-id`), `AUTH_USER`, `SESSION_INFO`, `SCREEN_ACCESS`, `SCREEN_ACTION`, `NAV`, `TRANS`, `DIR`, `OTP_ID`, `BRANCH_ID`, `BRANCH_NAME`, `REGEN_EXPIRES_AT`, project keys |

`startSession(token, user, isRemembered)` keeps the token in sessionStorage; `isRemembered` only saves `REMEMBER_ME`.
On start the provider removes old app values from localStorage that are not preferences (`AppStorage.cleanLocalStorage()`).
Saving a preference (`THEME`, `LANG` …) also fires the window event `PREFERENCE_EVENT`; every copy of the library on the
page (microfrontends) and every other tab applies the new theme / language at once.

Key constants (also as `StorageKeys.*`): `TOKEN`, `AUTH_USER`, `SESSION_INFO`, `SCREEN_ACCESS`, `SCREEN_ACTION`, `NAV`,
`REMEMBER_ME`, `TRANS`, `DIR`, `LANG`, `THEME`, `LAYOUT_CHOICE`, `MENU_MODE`, `SIDEBAR_COLLAPSED`, `OTP_ID`, `BRANCH_ID`, `BRANCH_NAME`,
`REGEN_EXPIRES_AT`. The library saves the chosen language in `LANG`, the theme in `THEME`, the navigation style in
`MENU_MODE` and the rail state in `SIDEBAR_COLLAPSED`.

AppHttp headers on every request: `Content-Type`, `Authorization: Bearer <TOKEN>`, `x-session-id` (per-tab id, saved as `ORG-ACTIVE_SESSION_ID`),
`x-branch-id` (AppStorage `BRANCH_ID`, `""` when no branch), `http.headers` and `AppHttp.setHeader(name, value)`.
Pick the branch with `setBranch(branch.id, branch.name)` (saved as `BRANCH_ID` / `BRANCH_NAME`, read back with
`readBranchId()` or `branchIdSignal`); `clearBranch()` removes it and `endSession()` clears it too.

**Branch switcher** – `config.loadBranches` (called after sign in, before the menu); the default and disabled
branches come with the rows:

```ts
loadBranches: loadBranches,    // () => AppHttp.Get(`${MsUrl.main}/branches`)
branchLabel: "branch.title",   // title of the switcher, shown with t() (default "ui.branch" = "Branch")
```

- Rows: `{ id | branchId | code, name | branchName | label, nameLang?, isDefault?, disabled?, active?, priority? }`, as `{ data: [...] }` or the list.
- `disabled: true` shows the branch greyed out; it can not be selected. `active: false` hides it.
- Selected when the list arrives: the saved `BRANCH_ID` (if listed and not disabled) → the row with `isDefault` → the first one that is not disabled.
- Shown as a dropdown in the `Header` and as the first section of the settings dialog. `null` or `[]` = no switcher.
- `setBranches(reply)` does the same by hand (call it before the menu request so it already
  sends `x-branch-id`). Own layouts: `<BranchSwitcher />`. Helpers: `toBranchOptions`, `pickBranch`, `branchesSignal`.
The token is read from AppStorage (`TOKEN`, sessionStorage then localStorage).

`AppHttp` and `AppStorage` use no signals: they read the config saved by `<SharedWebUiProvider>`.
Code that runs before the provider (for example at module load) calls `setAppConfig(config)` first, in `main.tsx`.

## 2. locales: one folder per language, one file per group

```
locales/
  en-US/
    app.json     { "name": "My App" }                                  -> t("app.name")
    nav.json     { "dashboard": "Dashboard", "users": "Users" }        -> t("nav.users")
    roles.json   { "admin": "Admin", "viewer": "Viewer" }              -> t("roles.admin")
    root.json    { "greeting": "Hello {{name}}", "REQUIRED": "..." }   -> t("greeting"), t("REQUIRED")  (top level)
  fr-FR/
    app.json …
```

```ts
// config.ts
import { loadLocaleGroups } from "shared-lib-web";

const localeFiles = import.meta.glob("./locales/*/*.json");    // lazy: nothing is downloaded yet

export const config: UiConfig = {
  loadLocale: loadLocaleGroups.bind(null, localeFiles),        // fr-FR used -> only locales/fr-FR/*.json load
};
```

- **Dynamic:** `import.meta.glob` (without `eager`) gives one lazy loader per file; `loadLocaleGroups` runs only
  the files of the language that is used, in parallel, and merges them (the file name is the group, `root.json`
  stays at the top level). The default language (en-US) is loaded too, for keys missing in the current one.
- **Several folders:** merge them, `{ ...sharedFiles, ...ownFiles }` (MFEs: shared groups + the MFE's own); the same
  group in two folders is merged, the later file wins per key.
- **Or a signal:** `loadLocale: localeSignal`, a `LocaleBundle` (`{ "en-US": {...}, "fr-FR": {...} }`) your app fills.
  The library adds the codes it needs to `requestedLocalesSignal` and waits; `fillLocaleBundle` loads them for you
  (a code set to `null` = no texts for that language, the next one is tried):

  ```ts
  export const localeSignal = signal<LocaleBundle | null>(null);
  const loadTexts = loadLocaleGroups.bind(null, import.meta.glob("./locales/*/*.json"));
  loadLocale: localeSignal,                                   // config.ts
  useEffect(() => fillLocaleBundle(localeSignal, loadTexts)); // start once (returns the stop function)
  ```

  This `localeSignal` is your app's own signal. The library also exports a `localeSignal` (the current language
  code); in a file that needs both, import the library one with an alias:
  `import { localeSignal as currentLanguageSignal } from "shared-lib-web"`.
- One JSON per language still works: `loadLocale: (code) => import(\`./locales/${code}.json\`)`.

**One sublevel only:** a key is `"key"` or `"group.key"` (`t("user.title")`, `t("branch.title")`). Deeper keys like
`user.role.admin` are not looked up, and the library warns in the console when a locale file has them — use
`role.admin` or `user.roleAdmin` instead.

Lookup order: current language → `defaultLanguage` (else en-US) → library defaults (`ui.*` and dff-util `ConstMessages`) → the key.
Shell texts to translate: `ui.language, theme, openMenu, expandMenu, collapseMenu, home, loading, close, noData,
selectOption, search, navigation, account, logout, confirm, cancel, translate, permissionDenied,
permissionDeniedText, pageNotFound, pageNotFoundText, backToHome, goBack, reloadPage, comingSoon, comingSoonText,
openPreview, playVideo, mediaError`.

## 3. main.tsx and app.tsx

```tsx
// root.tsx – one input: the config (menu, languages, branches come from its loaders)
export function Root() {
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <App />
    </SharedWebUiProvider>
  );
}

// main.tsx
const root = createRoot(rootElement);
root.render(<Root />);
```

```tsx
// app.tsx – ONE component holds all pages; ?page picks which one is shown
import { AppLayout, AuthLayout } from "shared-lib-web/layout";   // optional, see "Layout" below

const PAGE_ELEMENTS: Record<string, ReactElement> = {
  "/": <DashboardPage />,
  "/profiles": <UserPage />,          // keys = the menu hrefs
  "/app-settings": <SettingsPage />,
};

function readPageElement(page: string): ReactElement {
  return PAGE_ELEMENTS[page] ?? <PageNotFound />;
}

export function App() {
  const page = useCurrentPage();       // "/profiles" from ?page=profiles (re-renders on change)
  if (!isLoggedIn.value) {
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  }
  const pageElement = readPageElement(page);
  return (
    <AppLayout headerEnd={<UserMenu name={userName} email={email} onLogout={handleLogout} />}>
      <RequireAccess key={page}>{pageElement}</RequireAccess>
    </AppLayout>
  );
}
```

### Layout: single, parts or own (optional)

```tsx
import { AppLayout, AsideLayout, AuthLayout, Header, Sidebar, SidebarNav } from "shared-lib-web/layout";

// 1. Single layout – everything ready-made
<AppLayout headerEnd={<UserMenu ... />} sidebarFooter="v1.0">{page}</AppLayout>

// 2. Single layout with options
<AppLayout showSidebar={false}>{page}</AppLayout>                      // header + page only
<AppLayout showHeader={false}>{page}</AppLayout>                       // sidebar + page only
<AppLayout header={<MyHeader />} sidebar={<MySidebar />} footer={<MyFooter />}>{page}</AppLayout>

// 2b. AsideLayout – no top header, only the side menu and the page
<AsideLayout sidebarUser={<UserMenu isInSidebar ... />}>{page}</AsideLayout>
//   desktop: collapsible to an icon rail (button at the bottom, tooltips on the rail)
//   small screens: always the icon rail (no drawer, no menu button)
//   no mega menu: menuMode is ignored and hidden in the settings dialog
//   the user at the bottom of the sidebar; HeadLayout sticks at top-0
//   options: sidebarFooter, showSettings (settings button at the bottom, default false), showSidebar, sidebar, footer
//   signals: isAsideLayoutSignal, isSmallScreenSignal, isRailEverywhereSignal

// 3. MainLayout: the project's own layout from the individual parts (any markup around them)
<div className="flex min-h-screen flex-col">
  <Header endContent={<UserMenu ... />} isStandalone />     {/* brand always shown on desktop */}
  <div className="flex flex-1">
    <aside className="w-64"><SidebarNav isAlwaysExpanded /></aside>   {/* only the menu */}
    <main>{page}</main>
  </div>
</div>

// 4. No layout entry at all – the project writes everything with the main entry:
//    AppBrand, UserMenu, LanguageSwitcher, ThemeSwitcher, SettingsMenu, PageLink, toggleSidebar ...
```

**Menu on / off at runtime** (works with `AppLayout`, `Header`, `SidebarNav` and the mega menu):

```ts
setMenuVisible(false);       // hide the sidebar / rail / mega menu bar and the menu buttons, e.g. a full-screen page
setMenuVisible(true);        // show it again
toggleMenuVisible();         // switch
isMenuVisibleSignal.value    // current state (re-renders components)
// start value: config.layout.showMenu (default true)
```

| Part | Options |
| --- | --- |
| `AppLayout` | `headerEnd`, `sidebarFooter`, `showHeader`, `showSidebar` (default: `isMenuVisibleSignal`), `header`, `sidebar`, `footer` |
| `Header` | `endContent`, `startContent`, `showMenuButtons`, `showSwitchers`, `isStandalone` |
| `Sidebar` | `footer`, `showBrand` |
| `SidebarNav` | `className`, `isAlwaysExpanded`, `isAlwaysShown` (menu list only, follows permissions and the menu on/off switch, skeleton until `loadMenuNavigation` answers) |

The example app shows both: Settings → *App layout* switches between `AppLayout` and
`MainLayout` in `example/src/layout/main-layout.tsx`.

### No router: query parameters

There is no router and nothing redirects. A menu click only sets `?page=<menu href>` with the History API
(no reload); the app shows the component for that value. Back / forward work.

**Path mode:** `layout: { pageMode: "path" }` puts the page in the path instead — `http://host/profiles` rather than
`http://host/?page=profiles`. Menu links, `openPage`, `PageLink`, `useCurrentPage` and back / forward all follow it;
other query parameters still work (`/profiles?userId=7`). The server must answer every path with `index.html`
(Vite dev does). For code outside React (for example single-spa `activeWhen`) use `readPageFromLocation(location)`,
which reads the page in either mode.

| Function | What it does |
| --- | --- |
| `openPage("/profiles")` | Sets `?page=profiles` (no leading slash in the address bar; inside the app pages stay menu hrefs like `"/profiles"`; old `?page=/profiles` links still work; helpers `toPageParamValue` / `toPagePath`), removes the old page's parameters, closes menus, scrolls up. `openPage(page, { userId: "42" })` adds values; `{ isKeepingOtherParams: true }` keeps the old ones. |
| `setQueryParam("userId", "42")` | Adds or changes one parameter: `?page=profiles&userId=42`. `undefined` / `""` removes it. `{ isReplace: true }` replaces the history entry. |
| `setQueryParams({ userId: "42", mode: "edit" })` | Several at once. |
| `removeQueryParam("userId")` | Removes one. |
| `readQueryParam("userId")`, `readQueryParams()` | Read values (outside components or in handlers). |
| `useQueryParam("userId")`, `useCurrentPage()` | Read values in a component and re-render when they change. |
| `<PageLink page="/profiles">` | A link that calls `openPage` (Ctrl/Cmd-click opens a new tab). |

Example (users page): row click → `setQueryParams({ userId, mode: "view" })`; on load
`readQueryParams()` reopens the drawer, so a refresh or a shared link shows the same user.

## 4. Pages

```tsx
const { locale, theme, direction, t, changeLanguage, changeTheme } = useUi();
```

Permissions: wrap the page in `<RequireAccess>` (shows `PermissionDenied` when the menu item of the current `?page` has `read: false`) and use
`canAccess("update")` / `canAccess("delete")` for buttons.

## 5. Icons – TypeIcon

```tsx
<TypeIcon name="Users" />
<TypeIcon name="Pencil" size={16} title="Edit" onPress={handleEditClick} />
```

All icons (navigation, buttons, library) use lucide names from https://lucide.dev/icons.

## 6. Forms – react-hook-form

Every control takes `{ control, name, label, rules }` and translates its error message
(use dff-util `ConstKeys` as messages and `RegExp` as patterns).

| Control | Value |
| --- | --- |
| `TypeInput`, `TypeTextArea` | text |
| `TypeSelect` | option key (dff-util `OptionType`, `option.lang[locale]` shown) |
| `TypeSwitch`, `TypeCheckbox` | boolean |
| `TypeDate` (`isDateTime`) | `"2026-11-05"` / `"2026-11-05T14:30"` |
| `TypeTime` | `"14:30"` |
| `TypeOtp` (`length`) | `"123456"` |
| `TypeList` (`selectionMode`) | `string[]` or `string` |
| `TypeLang` (`type="text" | "textarea"`) | `TranslationType` `{ en: "...", fr: "..." }` for every config language, with translate buttons (dff-util `CallLangText`) |
| `TypeMdx` (from `shared-lib-web/markdown`) | markdown text (editor) |
| `TypeLangMd` (from `shared-lib-web/markdown`) | markdown per language `{ en: "...", fr: "..." }` with translate buttons |

`TypeMdv` (from `shared-lib-web/markdown`) shows markdown, or the current language of `textByLanguage`. All three follow light/dark themes.

```tsx
import { TypeLangMd, TypeMdv, TypeMdx } from "shared-lib-web/markdown";

<TypeLang control={control} name="title" label={t("page.title")} rules={pageValidation.title} />
<TypeLangMd control={control} name="body" label={t("page.body")} height={250} />
<TypeMdv textByLanguage={page.body} />
```

### File upload – TypeUpload

```tsx
<TypeUpload control={control} name="csvFile" label={t("product.csv")} fileType="csv" maxSize="10MB" rules={rules.csvFile} />
<TypeUpload control={control} name="photos" label={t("product.photos")} fileType={["png", "jpg"]} maxSize="5MB" isMultiple totalSize="20MB" />
<TypeUploadBox name="import" fileType="csv" maxSize={10} value={importFile.value} onChange={handleImportFileChange} />
```

Drag & drop or browse, type and size checks (per file and total), warning banner + toast, file list with remove.
Value: `File` (single) or `File[]` (`isMultiple`). Then upload with:

```ts
const signed = await AppHttp.Post(`${MsUrl.utils}/s3/upload-url`, { fileName: file.name });
const uploaded = await uploadToSignedUrl(file, signed.data.upload, signed.data.download);   // FileType
```

Helpers: `parseSizeToBytes`, `formatBytes`, `normalizeFileTypes`, `isFileTypeAllowed`, `readFileIconName`, `setLeaveGuard`.

Option lists from dff-util data: `readCountryOptions()`, `readTelCodeOptions()` (+ `readTelCode("IN")` → `"+91"`), `readLanguageOptions()`.

## 7. Other components

### Sticky page header (HeadLayout)

```tsx
const headActions = (
  <>
    <TypeButton action="ghost" icon="X" label={t("user.cancel")} onPress={handleUserCancel} />
    <TypeButton type="submit" form="user-form" icon="Save" label={t("user.save")} />
  </>
);

<HeadLayout title={t("user.editTitle")} actions={headActions} />
<form id="user-form" onSubmit={onSubmit}>...</form>
```

- Put it first in the page. It sticks at `top-16` (under the 4rem app `Header`); `isBelowHeader={false}` sticks at `top-0`.
- `isFullWidth` (default true) stretches it over the `<main>` padding (`p-4 lg:p-6`) to both edges; `false` gives a rounded card.
- The buttons sit outside the `<form>`, so give the form an `id` and pass it to `TypeButton form="..."`.
- Optional `children` add a row under the title (filters, tabs).

| Export | What it is |
| --- | --- |
| `AppLayout`, `AuthLayout` (from `shared-lib-web/layout`) | Optional single layouts (children = page) |
| `Header`, `Sidebar`, `SidebarNav`, `SidebarCollapseButton`, `MegaMenuBar`, `MegaMenuPanel`, `RailFlyout` (from `shared-lib-web/layout`) | Optional individual layout parts. The collapse / expand button sits fixed at the bottom of `Sidebar` (desktop, sidebar mode); `<Sidebar showCollapseButton={false} />` hides it, `SidebarCollapseButton` places it in an own layout. User at the bottom of the side menu: `<AppLayout sidebarUser={<UserMenu isInSidebar ... />}>` (avatar + name + email; avatar only on the collapsed rail, menu opens next to it). On the collapsed rail every icon (links, groups, user, expand button) shows a tooltip with its label (`RailTooltip`, rendered by AppLayout; own layouts render `<RailTooltip />` once; any element can opt in with `data-rail-tip="Label"`) |
| `AppBrand`, `PageLink` | Navigation pieces for any layout (main entry) |
| `HeadLayout` | Sticky page header (h-16, same height as the logo box): one-line title on the start side, actions (Cancel, Submit) on the end side; stays under the app header while the page scrolls |
| `ArticleLayout`, `ContentLayout`, `GridLayout`, `FloatLayout` | Page sections |
| `TypeButton`, `TypeTable` (+ `readRowKey`), `TypeDropdown` (+ `readDataValue`) | Actions and lists |
| `TypeSearch` (`onChange` live or `onSearch` on Enter + `readSearchText`), `TypeFilter` | List filters (not form fields) |
| `TypeImage`, `TypeVideo` | Media thumbnails: skeleton while loading, error icon if the file fails; a click opens one shared popup (`MediaViewer`, rendered by the provider) with the full image, or the video playing with controls. `<TypeImage src alt previewSrc? fit? className? width? height? isPreviewable? />`, `<TypeVideo src title poster? className? width? height? isPreviewable? />` (optional `width` / `height`: number = px, string = any CSS size such as `"12rem"` or `"100%"`; only a height keeps the 16:9 shape) (no poster = first frame; `isPreviewable={false}` plays inline). `openMediaPreview({ type, src, title, poster })` / `closeMediaPreview()` open it from code |
| `TypeModal`, `TypeDrawer`, `TypeConfirm` | Overlays (Escape, backdrop and ✕ close them) |
| `UserMenu`, `LanguageSwitcher`, `ThemeSwitcher`, `SettingsMenu` | Header menus |
| `ShowProgress(true/false)`, `TopProgress`, `ScrollToTop` | Request progress bar and scroll-to-top button |
| `EmptyState`, `PermissionDenied`, `RequireAccess`, `PageNotFound`, `ComingSoon`, `PageLoader` | States and pages |
| `SkeletonArticle`, `SkeletonTable`, `SkeletonForm`, `SkeletonCards`, `SkeletonDashboard`, `SkeletonChat`, `SkeletonMenu`, `SkeletonAuthForm`, `SkeletonPage`, `SkeletonFloat` | Loading placeholders |
| `ShowToast(message, type)` | Toasts |
| `trans(textByLanguage, defaultText)` | Pick a backend translation for the current language |
| `AppStorage.getData / getText / setData / removeData / clearData / envData`, `TOKEN`, `LANG`, `THEME`, `BRANCH_ID` … `StorageKeys` | Prefixed session/local storage, shared key constants, `window.env` settings |
| `openPage`, `setQueryParam(s)`, `removeQueryParam`, `readQueryParam(s)`, `useQueryParam`, `useCurrentPage`, `PageLink`, `currentPageSignal`, `queryParamsSignal` | Pages and query parameters (no router) |
| `setLanguages(reply)`, `toLanguageOptions(reply)`, `languagesSignal`, `LangSource`, `LanguageRowType`, `setMenu(reply)`, `setMenuLoading()`, `clearMenu()`, `toNavigation(reply)`, `toNavItems(menus)`, `unwrapRootMenu(menus, "ADMIN_ROOT")`, `MenuAccessType`, `MenuResponseType`, `MenuSource`, `MenuOptions`, `ScreenAccessType`, `TranslationType`, `AuthUser` | Backend menus and shared app types (menu icons are fixed with `resolveLucideIcon`) |
| `AppHttp.Get / Post / Put / Patch / Delete / Load / Media / CloudUpload (uploadFile) / DownloadFile`, `AppHttp.BaseUrl()`, `AppHttp.FullUrl(url)`, `AppHttp.setHeader`, `readEnvData(appNameKey, key)`, `uploadToSignedUrl`, `setAppConfig` / `readAppConfig` | HTTP client on dff-util `Http`: bearer token, session id, branch, extra headers, progress bar |
| `setCompanyDetails(reply)`, `companyDetailsSignal`, `readCompanyDetails(reply)`, `readAppNameLabel(config, details)`, `readLogoUrl(config, isDark, details)`, `CompanyDetails`, `CompanySource` | Company / brand details (app name, company name, favicon, logos) |
| `setCustomThemes(themes)`, `toCustomThemeList(themes)`, `customThemesSignal`, `CustomThemeMap`, `CustomThemes` | Custom themes as data (object keyed by theme name, or a list) |
| `setBranch(id, name)`, `readBranchId()`, `clearBranch()`, `branchIdSignal`, `branchNameSignal` | Selected branch, sent as `x-branch-id` |
| `startSession(token, user, isRemembered)`, `restoreSession()`, `endSession(keepKeys)`, `authUserSignal`, `isAuthenticatedSignal` | Login state (restored on reload) |
| `toOptionTypes(rows)`, `readResponseRows(response)` | Backend option rows → `OptionType[]` |
| `resolveLucideIcon("user-round-key")` | Backend icon names → lucide names |
| `encryptPayload`, `decryptResponse` | AES-GCM payload encryption (key passed in) |
| `SharedRegExp` | dff-util `RegExp` + `MOBILE_10`, `PERSON_NAME`, `ADDRESS_TEXT`, `UPPER_ALPHA_NUMERIC` |
| `canAccessPath(action, path)` | Permission check for any path |
| Signals | `localeSignal`, `themeSignal`, `directionSignal`, `translationSignal`, `isDarkThemeSignal`, `navigationSignal`, `navigationModeSignal`, `pathnameSignal`, `screenAccessSignal` … |

Every component uses DaisyUI theme colours (`base-*`, `primary` …), so all themes – light and dark – work.

---

## Example apps

There are two examples, each its own small Vite app that uses the library source directly:

| Folder | Port | Shows |
| --- | --- | --- |
| `example-basic/` | 5174 | **One language** (en-US, `defaultLanguage` + `loadLocale`, no `loadSupportLanguages`) and **no branches** (no `loadBranches`): login, dashboard, users CRUD, settings (theme, menu mode, menu on/off). The smallest real setup to copy. |
| `example-mfe/` | 9000 | **Microfrontends**: 4 separate Vite projects — `shell` (the only `AppLayout`, login, single-spa routing from `env.mfe.js`, menu as a signal (`loadMenuNavigation: navSignal`), `type="shell"`) and 3 MFEs `settings`, `forms`, `profile` (`type="mfe"`, page layouts only; theme and language from localStorage, kept in sync between bundles). No shared folder: each project has its own config, texts and theme. See `example-mfe/README.md`. |
| `example/` | 5173 | **10 languages** (`loadSupportLanguages`, 3 RTL) and **stores** (`loadBranches`, `isDefault` / `disabled`), plus every component, 3 layouts and all themes. |

```bash
npm run example-basic:install
npm run example-basic:dev   # http://localhost:5174
```

### Full example

`example/` is its own small app package (Vite is used only there — an app needs a bundler; the library does not).
It shows login, dashboard, users CRUD (drawer + confirm + permissions), a **Components** section with every control,
upload, overlay, skeleton and state, and settings for language (10, including 3 RTL and Telugu, Kannada, Tamil), theme (all 35 DaisyUI themes + custom `org-light` / `org-dark`) and navigation style.
All pages live in one `App` component (`example/src/app.tsx`) and are picked by `?page`; the languages, branches and
menu are signals in the config (`example/src/app-init/app-init-signals.ts`), filled from fake backend replies by
`app-init/app-init.service.ts`. It uses the library source directly, so changes show up without a build.

Everything the example loads comes from the **sor** service (`MsUrl.sor` → `/api/org-sor`):

| Data | Request | Signal |
| --- | --- | --- |
| Company details | `GET /company-details` | `companySignal` (on start) |
| Languages | `GET /load/LANG?active=true` | `supportLangSignal` (on start) |
| Themes | `GET /content-load?query=theme` | `themesSignal` (on start) |
| Texts of a language | `GET /content-load?query=locales.<code>` (all languages: `?query=locales`) | `localeSignal` (languages the library asks for) |
| Menu | `GET /authorization/<persona>?roles=<roles joined with ",">` (from the signed-in user) | `navSignal` (after sign in) |
| Branches | `GET /load/BRANCHS?profile=<user id>` | `branchSignal` (after sign in, before the menu) |

`readContent(reply, query)` takes the content out of a `content-load` reply (`{ data }` and the query path are
optional: `readContent(reply, "locales.en-US")`). The fake backend is `example/fake-api.ts`, a Vite plugin (dev
server and preview) that answers these URLs from `example/fake-api/*.json`; a real app has no such file.
example-basic and the MFE shell work the same way (no branches); each MFE has its own fake backend for running alone.

```bash
npm run example:install
npm run example:dev     # http://localhost:5173  – log in with any email and a 6+ character password
```

## Development

The library has **no bundler and no Vite**: `tsc` compiles `src/` file by file into `dist/` (readable ES modules + `.d.ts`),
and the tests run on Node's built-in test runner (`node:test` + `jsdom`, setup in `scripts/test-setup.mjs`).

```bash
npm install
npm run verify        # typecheck + code style + tests + build
npm run build         # tsc -> dist/, fix .d.ts import paths, copy styles.css
npm run check:style   # readability rules only
npm test              # tsc -> build-test/, then Node's built-in test runner (node --test) with jsdom
```

Inside `src/`, relative imports use the real file extension (`./type.icon.ts`); `tsc` rewrites them to `.js` in `dist/`.

## Publishing

```bash
npm login
npm version minor
npm publish
```

Or use `github-workflows/publish.yml` (move it to `.github/workflows/` and add the `NPM_TOKEN` secret).

## License

[MIT](./LICENSE) © 2026 DesignForFeature.

Anybody can use this library for free, in personal or commercial projects: use it, copy it, change it, merge it,
publish it, share it and sell software built with it. The only condition is to keep the copyright and license notice
(the `LICENSE` file) with copies of the library. It comes "as is", without warranty.

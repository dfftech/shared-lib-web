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

1. `config.ts` – app name, default language + locale loader, themes, logos, layout and http
   (no menu, no language list)
2. two backend inputs passed to the provider, `null` first and the reply later:
   `nav` (the menu) and `lang` (the languages)
3. `locales/{code}.json` – its texts (`en-US.json`, `ar-SA.json` …)
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
  themes: light --default, dark --prefersdark, corporate, dracula;
}
```

Every theme in `config.themes` must also be enabled in `@plugin "daisyui"` (or defined as a custom theme), and the
dark ones listed in `config.darkThemes` (dark logo, dark markdown editor). Use `themes: all` or list the ones you need.

Custom themes use DaisyUI's theme plugin, one file per theme in a `theme/` folder (the example has
`example/src/theme/org-light.css` and `org-dark.css`, and the theme names in `example/src/theme/themes.ts`):

```css
/* src/index.css */
@import "tailwindcss";
@import "./theme/org-light.css";
@import "./theme/org-dark.css";
```

```css
/* src/theme/org-dark.css */
@plugin "daisyui/theme" {
  name: "org-dark";
  default: false;
  color-scheme: dark;
  --color-base-100: oklch(22% 0.03 264);
  --color-base-content: oklch(92% 0.015 264);
  --color-primary: oklch(70% 0.16 277);
  /* ... all --color-*, --radius-*, --size-*, --border, --depth, --noise variables */
}
```

```ts
// src/theme/themes.ts → config.ts: themes: THEMES, darkThemes: DARK_THEMES
export const THEMES: Theme[] = ["org-light", "org-dark", "light", "dark", /* ... */];
export const DARK_THEMES: Theme[] = ["org-dark", "dark", /* ... */];
```

The theme dropdown, the ⚙ settings dialog and the example Settings page show **Light themes** and **Dark themes**
as two groups (split by `config.darkThemes`). In your own UI: `const { lightThemes, darkThemes } = useUi();`
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
import { readEnvData, toAbsoluteUrl, type LocaleModule, type UiConfig } from "shared-lib-web";

const APP_NAME_KEY = "ORG";

// window.env.REACT_APP_ORG_API_BASE_URL (env.js), else the default
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "https://api.example.com/api");

// Service URLs are PROJECT level (not part of AppHttp)
export const MsUrl = {
  api: `${API_BASE_URL}/xxx-api`,
  main: `${API_BASE_URL}/xxx-api`,
  sor: `${API_BASE_URL}/xxx-sor`,
  events: `${API_BASE_URL}/xxx-events`,
  tms: `${API_BASE_URL}/xxx-tms`,
  utils: `${API_BASE_URL}/xxx-util`,
};

/** locales/{code}.json, loaded only when that language is used: "en-US" -> locales/en-US.json */
function loadLocale(languageCode: string): Promise<LocaleModule> {
  return import(`./locales/${languageCode}.json`);
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,                 // key: storage ORG-TOKEN, env REACT_APP_ORG_API_BASE_URL
  appName: "app.name",                      // label: t("app.name") (default: appNameKey)
  logoUrl: "/logo-light.svg",
  logoDarkUrl: "/logo-dark.svg",
  defaultLanguage: "en-US",                 // shown before the backend list arrives
  loadLocale: loadLocale,
  defaultTheme: "light",
  themes: ["light", "dark", "corporate", "dracula"],
  darkThemes: ["dark", "dracula"],
  layout: { menuMode: "sidebar", isSidebarCollapsible: true },
  http: { baseUrl: API_BASE_URL, logoutUrl: "/login" },
};
```

| Setting | What it does |
| --- | --- |
| `defaultLanguage`, `fallbackLanguage` | Optional language codes like `en-US` (default `"en-US"`). The default is shown before the `lang` list arrives (and when a file is missing). Without `defaultLanguage`, `languages`, `loadLocale` and `lang` the app runs in en-US with the library's built-in English texts and no language switcher. |
| `loadLocale(code)` | Loads `locales/{code}.json` lazily for any language code. |
| `languages` | Not needed: the list comes from `lang` (below). Only for apps with a fixed list (`{ code, label, flag?, direction?, load? }`). |
| `themes`, `darkThemes` | Listed by the theme switcher. Dark themes switch to `logoDarkUrl` and dark markdown. |
| `layout.headerSettings` | `"inline"` (language + theme switchers in the header) or `"menu"` (one ⚙ button opening a settings dialog with language, theme and navigation style). |
| `layout.toastPosition`, `layout.showScrollToTop` | Toast corner (`top-end` …) and the scroll-to-top button. |
| `layout.showMenu` | Menu shown at start (default `true`); switch at runtime with `setMenuVisible()` / `toggleMenuVisible()`. |
| `layout.menuMode` | `"sidebar"` (drawer + collapsible icon rail) or `"megamenu"` (top bar + full-width panels). Users can switch with `changeNavigationMode()`; the choice is saved. |
| `homePath`, `layout.pageParam` | The page shown when `?page` is missing (default `/`) and the name of the page parameter (default `page`). |
| `http.baseUrl` | API base URL of `AppHttp` (`window.env.REACT_APP_<APPNAMEKEY>_API_BASE_URL` wins when set; a relative `/api` becomes absolute). |
| `http.logoutUrl` | Where the browser goes after `endSession()` (log out), for example `/login` or an SSO logout URL. `endSession(keepKeys, false)` stays on the page. |
| `http.tokenKey`, `http.headers`, `http.loadUrl`, `http.showProgress` | Optional: AppStorage key of the token (default `TOKEN`), extra headers, `AppHttp.Load` URL (default base + `/load`), progress bar (default `true`). |
| `appNameKey` | Key of the app (`ENV_BASE_NAME`): prefix of every AppStorage key (`ORG-TOKEN`, `ORG-LANG`) and of the `window.env` names (`REACT_APP_ORG_…`). The key names are fixed constants — no `storage` / `languageKey` / `themeKey` settings. |
| `appName` | Label shown in header, sidebar and login: `t(config.appName)` (plain text or a translation key). Default: `appNameKey`. |

| `navigation` | Not needed: the menu comes from `nav` (below). Only for apps with a fixed menu and no backend (`NavItem[]`). |
| `navOptions` | How the backend menu is converted: `rootMenuIds` (default: groups named "Root" or ids ending in `_ROOT`), `isRootFlattened` (default `true`). |

### Second config: `nav` (menu from the backend)

The menu is passed separately from `config` and can change at any time (login, persona switch, refresh).
Pass the backend reply as it is — `{ data: [...], meta }` or only the list:

```tsx
const menuResponse = await AppHttp.Get(menuUrl);            // { data: [...], meta: {...} }

<SharedWebUiProvider config={config} nav={menuResponse}>   // null = skeleton, then the reply
  <App />
</SharedWebUiProvider>
```

Typical flow — the value starts as `null` and the reply arrives later:

```tsx
// nav.service.ts
export const navSignal = signal<MenuSource | null>(null);      // null = menu skeleton

export async function loadNav(): Promise<void> {
  navSignal.value = null;
  const reply = await AppHttp.Get(menuUrl);
  navSignal.value = reply;                                     // menu appears; a new reply replaces it
}

// root.tsx
export function Root() {
  useSignals();
  const nav = navSignal.value;
  return (
    <SharedWebUiProvider config={config} nav={nav}>
      <App />
    </SharedWebUiProvider>
  );
}
```

On an API error set `[]` (empty menu), otherwise the skeleton stays. On logout set `null` again.
Without the prop: `setMenuLoading()` → `setMenu(menuResponse)`; `clearMenu()` on logout.

What happens to the reply (`MenuAccessType`: `id`, `name`, `nameLang`, `href`, `icon`, `type`, `priority`,
`read/create/update/delete` or `permissions`, `active`, `children`):

- the children of the **Root** group (`ADMIN_ROOT`) move to the top level, in the place of the group;
- sorted by `priority`; the same priority keeps the backend order; `active: false` is removed;
- icons like `layout-dashboard`, `users`, `User-Round-Key` become lucide names (unknown → `Circle`);
- `nameLang` `{ "en-US": "..." }` is used for `en`, `en-US`, … (`trans()`), else `name`;
- `read: false` hides the item and blocks the page; `create/update/delete` feed `canAccess()`.

`toNavigation(menuResponse, options)` does the conversion if you need the `NavItem[]` yourself.

### Third input: `lang` (languages from the backend)

Passed the same way as `nav`: `null` first, the reply later. Texts come from `locales/{code}.json` via `loadLocale`.

```tsx
// lang.service.ts
export const langSignal = signal<LangSource | null>(null);

export async function loadLanguages(): Promise<void> {
  const reply = await AppHttp.Get(languagesUrl);   // { data: [{ code: "en-US", name: "English", isDefault: true }, ...] }
  langSignal.value = reply;
}

// root.tsx
<SharedWebUiProvider config={config} nav={navSignal.value} lang={langSignal.value}>
```

- Row fields: `code` (or `langCode` / `languageCode` / `id`), `name` or `label`, `flag`, `direction` or `dir`,
  `isDefault` (or `default`), `active` (false hides it), `priority`. RTL is automatic for `ar`, `he`, `fa`, `ur`.
- While `lang` is `null`: `defaultLanguage` (or the language the user saved) is shown; the switchers have no list yet.
- When the list arrives: the user's saved language stays if it is listed; otherwise the row with `isDefault`
  (else `defaultLanguage`, else the first) is loaded. Only a language the user picks is saved to localStorage.
- `TypeLang` / `TypeLangMd` fields get one entry per listed language: `{ "en-US": "...", "ar-SA": "..." }`;
  backend `nameLang` with the same codes is shown by `trans()` and the menu.
- Without the prop: `setLanguages(reply)`. Conversion only: `toLanguageOptions(reply)`, `readDefaultLanguageCode(reply)`.

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
```

**Which storage:** decided only by the key (no argument).

| localStorage (preferences, kept on log out) | sessionStorage (everything else) |
| --- | --- |
| `LANG`, `THEME`, `LAYOUT_CHOICE`, `MENU_MODE`, `SIDEBAR_COLLAPSED`, `REMEMBER_ME` + `config.localStorageKeys` | `TOKEN`, `ACTIVE_SESSION_ID` (tab id, sent as `x-session-id`), `AUTH_USER`, `SESSION_INFO`, `SCREEN_ACCESS`, `SCREEN_ACTION`, `NAV`, `TRANS`, `DIR`, `OTP_ID`, `BRANCH_ID`, `BRANCH_NAME`, `REGEN_EXPIRES_AT`, project keys |

`startSession(token, user, isRemembered)` keeps the token in sessionStorage; `isRemembered` only saves `REMEMBER_ME`.
On start the provider removes old app values from localStorage that are not preferences (`AppStorage.cleanLocalStorage()`).

Key constants (also as `StorageKeys.*`): `TOKEN`, `AUTH_USER`, `SESSION_INFO`, `SCREEN_ACCESS`, `SCREEN_ACTION`, `NAV`,
`REMEMBER_ME`, `TRANS`, `DIR`, `LANG`, `THEME`, `LAYOUT_CHOICE`, `MENU_MODE`, `SIDEBAR_COLLAPSED`, `OTP_ID`, `BRANCH_ID`, `BRANCH_NAME`,
`REGEN_EXPIRES_AT`. The library saves the chosen language in `LANG`, the theme in `THEME`, the navigation style in
`MENU_MODE` and the rail state in `SIDEBAR_COLLAPSED`.

AppHttp headers on every request: `Content-Type`, `Authorization: Bearer <TOKEN>`, `x-session-id` (per-tab id, saved as `ORG-ACTIVE_SESSION_ID`),
`x-branch-id` (AppStorage `BRANCH_ID`, `""` when no branch), `http.headers` and `AppHttp.setHeader(name, value)`.
Pick the branch with `setBranch(branch.id, branch.name)` (saved as `BRANCH_ID` / `BRANCH_NAME`, read back with
`readBranchId()` or `branchIdSignal`); `clearBranch()` removes it and `endSession()` clears it too.

**Branch switcher** – pass the user's branches like `lang` (null first, the reply later); the default and disabled
branches come with the rows:

```tsx
<SharedWebUiProvider config={config} nav={nav} lang={lang} branch={branchReply}>
// config.branchLabel = "branch.title"   -> title of the switcher, shown with t() (default "ui.branch" = "Branch")
```

- Rows: `{ id | branchId | code, name | branchName | label, nameLang?, isDefault?, disabled?, active?, priority? }`, as `{ data: [...] }` or the list.
- `disabled: true` shows the branch greyed out; it can not be selected. `active: false` hides it.
- Selected when the list arrives: the saved `BRANCH_ID` (if listed and not disabled) → the row with `isDefault` → the first one that is not disabled.
- Shown as a dropdown in the `Header` and as the first section of the settings dialog. `null` or `[]` = no switcher.
- `setBranches(reply)` does the same without the provider (call it before the menu request so it already
  sends `x-branch-id`). Own layouts: `<BranchSwitcher />`. Helpers: `toBranchOptions`, `pickBranch`, `branchesSignal`.
The token is read from AppStorage (`TOKEN`, sessionStorage then localStorage).

`AppHttp` and `AppStorage` use no signals: they read the config saved by `<SharedWebUiProvider>`.
Code that runs before the provider (for example at module load) calls `setAppConfig(config)` first, in `main.tsx`.

## 2. locales/en-US.json

```json
{
  "app": { "name": "My App" },
  "nav": { "dashboard": "Dashboard", "users": "Users", "usersText": "Everyone who uses the app" },
  "greeting": "Hello {{name}}",
  "REQUIRED": "This field is required"
}
```

Lookup order: current language → `fallbackLanguage` → library defaults (`ui.*` and dff-util `ConstMessages`) → the key.
Shell texts to translate: `ui.language, theme, openMenu, expandMenu, collapseMenu, home, loading, close, noData,
selectOption, search, navigation, account, logout, confirm, cancel, translate, permissionDenied,
permissionDeniedText, pageNotFound, pageNotFoundText, backToHome, goBack, reloadPage, comingSoon, comingSoonText,
openPreview, playVideo, mediaError`.

## 3. main.tsx and app.tsx

```tsx
// root.tsx – the three inputs: static config + two backend replies (null first)
export function Root() {
  useSignals();
  const nav = navSignal.value;
  const lang = langSignal.value;
  return (
    <SharedWebUiProvider config={config} nav={nav} lang={lang}>
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
| `SidebarNav` | `className`, `isAlwaysExpanded`, `isAlwaysShown` (menu list only, follows permissions and the menu on/off switch, skeleton while `nav` is `null`) |

The example app shows both: Settings → *App layout* switches between `AppLayout` and
`MainLayout` in `example/src/layout/main-layout.tsx`.

### No router: query parameters

There is no router and nothing redirects. A menu click only sets `?page=<menu href>` with the History API
(no reload); the app shows the component for that value. Back / forward work.

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
| `AppHttp.Get / Post / Put / Patch / Delete / Load / CloudUpload (uploadFile) / DownloadFile`, `AppHttp.BaseUrl()`, `AppHttp.setHeader`, `readEnvData(appNameKey, key)`, `uploadToSignedUrl`, `setAppConfig` / `readAppConfig` | HTTP client on dff-util `Http`: bearer token, session id, branch, extra headers, progress bar |
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
| `example-basic/` | 5174 | **One language** (en-US, `defaultLanguage` + `loadLocale`, no `lang`) and **no branches** (no `branch`): login, dashboard, users CRUD, settings (theme, menu mode, menu on/off). The smallest real setup to copy. |
| `example/` | 5173 | **11 languages** (`lang` from the backend, 4 RTL) and **stores** (`branch` from the backend, `isDefault` / `disabled`), plus every component, 3 layouts and all themes. |

```bash
npm run example-basic:install
npm run example-basic:dev   # http://localhost:5174
```

### Full example

`example/` is its own small app package (Vite is used only there — an app needs a bundler; the library does not).
It shows login, dashboard, users CRUD (drawer + confirm + permissions), a **Components** section with every control,
upload, overlay, skeleton and state, and settings for language (11, including 4 RTL and Telugu, Kannada, Tamil), theme (all 35 DaisyUI themes + custom `org-light` / `org-dark`) and navigation style.
All pages live in one `App` component (`example/src/app.tsx`) and are picked by `?page`; the menu (`nav`) and the
languages (`lang`) come from fake backend replies. It uses the library source directly, so changes show up without a build.

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

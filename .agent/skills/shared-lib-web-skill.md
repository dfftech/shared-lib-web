---
name: shared-lib-web
description: >
  How to build an app on the shared-lib-web UI shell library: SharedWebUiProvider +
  config.ts + lazy locale JSON files + pages. Layouts, sidebar/icon rail, full-width
  mega menu, pages by ?page query parameter (NO router), DaisyUI light/dark
  themes, i18n, RTL/LTR, permissions, Type* react-hook-form controls, overlays,
  skeletons and markdown fields come from the library. Use with react-web-skill.md
  for module structure.
---

# shared-lib-web (UI shell library) — app guide

The app owns ONLY: `src/config.ts`, `src/nav/nav.service.ts`, `src/lang/lang.service.ts`, `src/locales/*.json`, `src/app.tsx`, `src/modules/*`.
Components come from `shared-lib-web` (required). The app shell is OPTIONAL: `shared-lib-web/layout` gives a single
`AppLayout` or its parts; a project may also write its own layout. Never re-implement in an app: header, sidebar, mega menu (when a library one fits), theme or language switcher,
translation engine, RTL handling, query parameter helpers, toasts, modal/drawer/confirm, skeletons, empty/404/permission pages,
storage helpers. Import them from `shared-lib-web`. Never add a router (react-router-dom) or AG Grid.

## Files an app has

```
src/
├── main.tsx            createRoot(...).render(<Root />)
├── root.tsx            <SharedWebUiProvider config={config} nav={navSignal.value} lang={langSignal.value}><App /></SharedWebUiProvider>
├── nav/nav.service.ts  navSignal (null) + loadNav() after login: navSignal.value = await AppHttp.Get(menuUrl)
├── lang/lang.service.ts langSignal (null) + loadLanguages() at start: langSignal.value = await AppHttp.Get(languagesUrl)
├── app.tsx             ONE component: AuthLayout when signed out; signed in: AppLayout (or the project's own layout) + the component for useCurrentPage()
│                       from a PAGE_ELEMENTS map (keys = menu hrefs), wrapped in Suspense + <RequireAccess key={page}>
├── config.ts           UiConfig: appNameKey (key / ENV_BASE_NAME), appName (label), defaultLanguage (optional, default "en-US"), loadLocale, themes, darkThemes, logos, layout, http (NO menu, NO language list, NO router, NO storage)
├── index.css           @import "tailwindcss"; @import "shared-lib-web/styles.css"; @plugin "daisyui" {...}
├── locales/{code}.json one JSON per language code: en-US.json, ar-SA.json (loaded by config.loadLocale)
└── modules/...         see react-web-skill.md
```

## config.ts

- No `languages` in config.ts: the list comes from the backend as `lang` (same pattern as `nav`): `null` first
  (`defaultLanguage` is shown), then the reply `{ data: [{ code: "en-US", name, flag?, direction?, isDefault? }] }`.
  Texts: `loadLocale(code)` = TOP-LEVEL function returning ``import(`./locales/${code}.json`)``. RTL is automatic for ar, he, fa, ur.
  Codes are always full: "en-US", files `en-US.json`, `nameLang`/TypeLang keys "en-US". Without the prop: `setLanguages(reply)`.
- `themes` + `darkThemes`: DaisyUI theme names; enable each in `@plugin "daisyui"`.
- `logoUrl` / `logoDarkUrl`: picked by theme.
- `layout`: `{ menuMode: "sidebar" | "megamenu", isSidebarCollapsible, showMenu }`.
- No `navigation` in config.ts: the menu comes from the backend through `nav` (below). (`navigation: NavItem[]` exists only for apps with a fixed menu.)
  `icon` is a lucide name string. `permissions: { read, create, update, delete }`; `read: false` hides the item.
  Adding a page = menu entry in the backend + one entry in PAGE_ELEMENTS in app.tsx (key = menu href).
- Menus from the backend are a SECOND config, `nav`, separate from config.ts:
  `<SharedWebUiProvider config={config} nav={menuResponse}>` with the reply as it is (`{ data, meta }` or the list).
  `nav` undefined = `config.navigation`; `null` = menu skeleton (usual first value; set the reply when the API answers, `[]` on error). Without the prop: `setMenuLoading()` → `setMenu(reply)`; `clearMenu()` on logout.
  The Root group (`ADMIN_ROOT`) is flattened, items sorted by `priority`, icons like `layout-dashboard` fixed, flat
  `read/create/update/delete` become permissions. Options in `config.navOptions` (`rootMenuIds`, `isRootFlattened`).
- `layout.headerSettings`: `"inline"` switchers or `"menu"` (⚙ settings dialog). `layout.toastPosition`, `layout.showScrollToTop`.
- No router. The current page is `?page=<menu href>` (`layout.pageParam`, default "page"; `homePath` when missing). Menu clicks only change the query parameter (History API, no redirect, no reload).

## Locale JSON

- Nested keys read with dots: `t("user.name")`. Placeholders: `"Hello {{name}}"` → `t("welcome", { name })`.
- Translate the shell keys `ui.*` and every dff-util `ConstKeys` used by validation (flat top-level keys).
- Same keys in every language file.

## useUi() and services

```ts
const { locale, theme, direction, t, changeLanguage, changeTheme, languages, themes, config } = useUi();
```

- Call `useUi()` in the `.ts` hook of a component. Do not also call `useSignals()` in that component.
- Outside components: `translate(key)`, `changeLanguage(code)`, `changeTheme(theme)`, `openPage(path)`, `ShowToast(msg, type)`.
- Pages: `openPage("/profiles")` (removes the old page's params), `<PageLink page="/profiles">`, `useCurrentPage()`.
- Query params (no redirect): `setQueryParam("userId", id)`, `setQueryParams({ userId, mode })`, `removeQueryParam("userId")`,
  `readQueryParam("userId")` in handlers, `useQueryParam("userId")` in components (re-renders; do not add useSignals/useUi on top).
  Keep drawer/popup state in the URL this way (refresh and shared links reopen it) instead of localStorage.
- Permissions: `<RequireAccess>` around pages, `canAccess("update")` for buttons.
- Backend translations: `trans(record.nameLang, record.name)`.
- Storage: only `AppStorage` + the key constants from shared-lib-web (never an own app.storage.ts):
  `AppStorage.setData(BRANCH_ID, id)`, `AppStorage.getData(TOKEN)`, `AppStorage.getText(THEME)`, `AppStorage.removeData(BRANCH_ID)`,
  `AppStorage.clearData()` (keeps the preferences), `AppStorage.envData("API_BASE_URL")`.
  Storage is picked by the key only: localStorage = LANG, THEME, LAYOUT_CHOICE, MENU_MODE, SIDEBAR_COLLAPSED, REMEMBER_ME
  (+ `config.localStorageKeys`); everything else (TOKEN, AUTH_USER, NAV, TRANS, BRANCH_ID …) is sessionStorage.
  `config.appNameKey` ("ORG") is the key prefix (ORG-TOKEN, ORG-LANG …) and the window.env base
  (REACT_APP_ORG_API_BASE_URL); `config.appName` is only the label, shown with t(config.appName). No storage / languageKey / themeKey config.
  Read storage inside functions, not at module load (the prefix comes from the config registered by the provider).
- HTTP: only `AppHttp` from shared-lib-web (config `http: { baseUrl, logoutUrl, tokenKey?, headers?, loadUrl?, showProgress? }`; never an own app.http.ts); every request gets
  `Authorization: Bearer <TOKEN>`, `x-session-id`, `x-branch-id` (AppStorage BRANCH_ID, "" when none) and the progress bar.
  Branch: `setBranch(branch.id, branch.name)`, `readBranchId()`, `branchIdSignal`, `clearBranch()` (endSession clears it). Base URL: window.env REACT_APP_<APPNAMEKEY>_API_BASE_URL, else http.baseUrl (relative "/api" is made absolute).
  `AppHttp.Get(url, params)`, `Post`, `Put(url, id, body)`, `Patch`, `Delete(url, id)`, `Load(id, params)`, `CloudUpload` / `uploadFile`, `DownloadFile`, `uploadToSignedUrl(file, uploadUrl, downloadUrl)`.
  Service URLs are PROJECT level, NOT in AppHttp: the app's config.ts exports
  `MsUrl = { api: `${API_BASE_URL}/xxx-api`, main, sor, events, tms, utils }` with
  `API_BASE_URL = toAbsoluteUrl(readEnvData(APP_NAME_KEY, "API_BASE_URL") ?? default)`; call `AppHttp.Get(`${MsUrl.main}/...`)`.
  AppHttp / AppStorage read the plain config (no signals); before the provider call `setAppConfig(config)`.
- Login state: `startSession(token, user, isRemembered)`, `endSession(keepKeys)` (goes to `http.logoutUrl`), `authUserSignal`, `isAuthenticatedSignal`.
- Backend option rows: `const rows = readResponseRows(response); options.value = toOptionTypes(rows);`.
- Option lists: `readCountryOptions()`, `readTelCodeOptions()`, `readLanguageOptions()` (from dff-util data) in `hooks/service-load.ts`.
- Shared types: `TranslationType`, `ScreenAccessType`, `MenuAccessType` from shared-lib-web; request/response types from dff-util.

## Layouts and components

| Use | Import |
| --- | --- |
| Signed-in shell (optional, `shared-lib-web/layout`) | `<AppLayout headerEnd={<UserMenu ... />} sidebarFooter={...}>{pageElement}</AppLayout>`; options `showHeader`, `showSidebar`, `header`, `sidebar`, `footer`, `sidebarUser={<UserMenu isInSidebar ... />}` (user at the bottom of the side menu) |
| Branch switcher | `<SharedWebUiProvider branch={reply} />` (rows: `isDefault` = first selection, `disabled` = not selectable) + `config.branchLabel` (title, t()); hidden when null / []; `setBranches(reply)` before the menu request |
| Menu on / off at runtime | `setMenuVisible(false/true)`, `toggleMenuVisible()`, `isMenuVisibleSignal`; start value `config.layout.showMenu` |
| Own shell from parts (`shared-lib-web/layout`) | `<Header isStandalone endContent={...} />`, `<SidebarNav isAlwaysExpanded />`, `Sidebar` (collapse button fixed at its bottom), `SidebarCollapseButton`, `MegaMenuBar`/`MegaMenuPanel`, `RailFlyout` |
| No top header, side menu only (`shared-lib-web/layout`) | `<AsideLayout sidebarUser={<UserMenu isInSidebar ... />}>{page}</AsideLayout>` — rail always on small screens, no mega menu, user at the sidebar bottom (`showSettings` adds a settings button, default off) |
| Login / register (`shared-lib-web/layout`) | `<AuthLayout>{page}</AuthLayout>` |
| Sticky page header with actions | `<HeadLayout title={...} actions={<>Cancel + <TypeButton type="submit" form="x-form" /></>} />` + `<form id="x-form">` |
| Page header / filters (not sticky) | `ArticleLayout` |
| Form or details card | `ContentLayout` |
| Table | `GridLayout` + `TypeTable` (+ `readRowKey(event)`) |
| Floating add button | `FloatLayout` + `TypeButton isIconOnly` |
| Edit/view panel | `TypeDrawer` |
| Dialog | `TypeModal`; destructive confirm: `TypeConfirm tone="error"` |
| Image / video with preview popup | `<TypeImage src={full} previewSrc={small} alt={t(...)} />`, `<TypeVideo src={url} poster={img} title={t(...)} />`, optional `width` / `height` (px number or CSS size) (skeleton while loading, click opens the popup; video plays there) |
| Row/menu actions | `TypeDropdown` + `readDataValue(event)` |
| List filters | `TypeSearch` (`onChange` or `onSearch` + `readSearchText`), `TypeFilter` |
| File upload | `TypeUpload` (form) / `TypeUploadBox` (controlled): `fileType`, `maxSize`, `isMultiple` + `totalSize`; then `uploadToSignedUrl(file, uploadUrl, downloadUrl)` |
| Loading | `SkeletonPage`, `SkeletonForm`, `SkeletonTable`, `SkeletonCards`, `SkeletonDashboard`, `SkeletonChat`, `SkeletonAuthForm`, `SkeletonArticle`, `SkeletonMenu`, `SkeletonFloat` |
| Empty / errors | `EmptyState`, `PermissionDenied`, `PageNotFound`, `ComingSoon` |

## Icons — TypeIcon only

- `<TypeIcon name="Users" />`, `<TypeIcon name="Pencil" size={16} title={t("user.edit")} onPress={handleEditClick} />`.
- `TypeButton icon="Save"`, `NavItem icon: "Users"`, `UserMenuItem icon`, `OptionType.icon` in TypeDropdown use the same names.
- Never import icon components directly and never use react-icons.

## Forms (react-hook-form)

- `useForm<T>({ defaultValues })` in `{module}.form.ts`; rules in `hooks/validation.ts` with `ConstKeys.*` messages and `RegExp.*` patterns.
- Controls (props `{ control, name, label, rules }`): `TypeInput`, `TypeTextArea`, `TypeSelect`, `TypeSwitch`, `TypeCheckbox`,
  `TypeDate` (`isDateTime`), `TypeTime`, `TypeOtp` (`length`), `TypeList` (`selectionMode`), `TypeLang` (`type`: text/textarea).
- Markdown (needs @uiw/react-md-editor): `import { TypeMdx, TypeMdv, TypeLangMd } from "shared-lib-web/markdown"`.
  `TypeMdx` editor, `TypeLangMd` editor per language, `TypeMdv` viewer (`text` or `textByLanguage`).
- Multi-language values (`TypeLang`, `TypeLangMd`) are `TranslationType` objects `{ "en-US": "...", "fr-FR": "..." }`; show them with `trans(value, fallback)` or `TypeMdv textByLanguage`.
- Build each props object with a TOP-LEVEL builder function, not `useMemo(() => ...)`:

```ts
function buildEmailProps(control: Control<UserType>, t: TranslateFunction): TypeInputProps<UserType> {
  return { control: control, name: "email", type: "email", label: t("user.email"), rules: userValidation.email };
}
```

- Submit: `const onSubmit = form.handleSubmit(handleUserSave);` with `handleUserSave` at top level.

## Click handlers that need a value

- `TypeButton dataValue={user.id} onPress={handleX}` → `readDataValue(event)`.
- `TypeTable onRowClick={handleRowClick}` → `readRowKey(event)`.
- `TypeDropdown onSelect={handleSelect}` → `readDataValue(event)`.

## Theme rules

- Use DaisyUI colours only (`bg-base-100/200/300`, `text-base-content`, `primary`, `error` …). Never `bg-white`, `text-gray-*`, `dark:` classes.

## Rules

1. File names lowercase with `-` (`app-layout.tsx`, `user.form.ts`). No nested functions, no `abcd(xyz())`, no chained calls — run `npm run check:style` (see dff-code-style-skill.md).
2. Named exports only. `.ts` = logic, `.tsx` = markup, same base name, import with extension.
3. Use dff-util before writing any constant, regex, message key, helper or type.
4. Full DaisyUI class names only (no `"btn-" + x`).
5. Icons only through `TypeIcon` / icon name strings.
6. Vite apps add `define: { global: "globalThis" }` (needed by dff-util).

## Reference

`example/` in the shared-lib-web repository follows this skill
(login, dashboard, users CRUD, components showcase, settings, 11 languages, all 35 DaisyUI themes + custom org-light/org-dark, both navigation modes).

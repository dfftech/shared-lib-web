# shared-lib-web

React 19 component library for DesignForFeature apps: provider, Type* form controls, layouts, i18n (RTL/LTR),
DaisyUI themes, Signals state, AppHttp / AppStorage. Built on `dff-util`. MIT license.

| Entry | What |
| --- | --- |
| `shared-lib-web` | provider, controls, components, signals, services, AppHttp, AppStorage |
| `shared-lib-web/layout` | optional app shell: `AppLayout`, `AsideLayout`, `AuthLayout` and parts |
| `shared-lib-web/markdown` | optional markdown controls (needs `@uiw/react-md-editor`) |
| `shared-lib-web/styles.css` | Tailwind source hint for the library classes |

## Install

```bash
npm install shared-lib-web dff-util react react-dom @preact/signals-react lucide-react react-hook-form
npm install -D tailwindcss daisyui @tailwindcss/vite
npm install @uiw/react-md-editor          # only for shared-lib-web/markdown
```

```css
/* src/index.css */
@import "tailwindcss";
@import "shared-lib-web/styles.css";
@plugin "daisyui" { themes: all; }
```

```ts
// vite.config.ts — dff-util needs Node's global
export default defineConfig({ plugins: [react(), tailwindcss()], define: { global: "globalThis" } });
```

## config.ts

```ts
import { loadLocaleGroups, type UiConfig } from "shared-lib-web";

export const MsUrl = { main: "/org-api", sor: "/org-sor", utils: "/org-util" };
const localeFiles = import.meta.glob("./locales/*/*.json");

export const config: UiConfig = {
  appNameKey: "ORG",                                   // storage ORG-TOKEN, env REACT_APP_ORG_API_BASE_URL
  loadLocale: loadLocaleGroups.bind(null, localeFiles),
  loadSupportLanguages: `${MsUrl.sor}/load/LANG`,
  loadCompanyDetails: `${MsUrl.sor}/company-details`,
  loadBranches: `${MsUrl.main}/branches`,
  loadMenuNavigation: `${MsUrl.utils}/menu-access`,
  layout: { menuMode: "sidebar", isSidebarCollapsible: true },
  http: {
    baseUrl: "https://api.example.com/api",
    logoutUrl: "/login",
    regenerateUrl: `${MsUrl.utils}/jwt-regenerate`,   // optional: auto JWT regenerate
  },
};
```

## App types

### spa — single app (pages in `?page=...`)

```tsx
import { SharedWebUiProvider, useCurrentPage, PageNotFound } from "shared-lib-web";
import { AppLayout, AuthLayout } from "shared-lib-web/layout";

export function Root() {
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <App />
    </SharedWebUiProvider>
  );
}

export function App() {
  const page = useCurrentPage();
  if (!isAuthenticatedSignal.value) {   // import { isAuthenticatedSignal, RequireAccess } from "shared-lib-web"
    return <AuthLayout><LoginPage /></AuthLayout>;
  }
  const pageElement = PAGES[page] ?? <PageNotFound />;
  return <AppLayout><RequireAccess key={page}>{pageElement}</RequireAccess></AppLayout>;
}
```

### shell — hosts microfrontends (pages are paths: `/settings`)

```tsx
<SharedWebUiProvider type="shell" config={shellConfig}>
  <ShellLayout />          {/* AppLayout or AsideLayout (layoutChoiceSignal) + the MFE mount point */}
</SharedWebUiProvider>
```

The shell owns login, menu, branches and brand. `startSession` / `endSession` and the token regenerate are shared
with every MFE on the page.

### mfe — microfrontend inside a shell (page layouts only)

```tsx
<SharedWebUiProvider type="mfe" config={mfeConfig}>
  <RequireAccess><FormsPage /></RequireAccess>
</SharedWebUiProvider>
```

No menu, no `loadBranches` / `loadMenuNavigation`. Theme, language, session and token come from the shell.
See `example-mfe/`.

## HTTP — `AppHttp`

```ts
const rows = await AppHttp.Get(`${MsUrl.main}/profile/search`, { page: 1 });
const saved = await AppHttp.Post(`${MsUrl.main}/profile`, body);
await AppHttp.Put(`${MsUrl.main}/profile`, id, body);
await AppHttp.Delete(`${MsUrl.main}/profile`, id);
await AppHttp.Patch(`${MsUrl.main}/profile`, body);
const langs = await AppHttp.GetShared(`${MsUrl.sor}/load/LANG`);   // once per page (shell + MFEs)
const options = await AppHttp.Load("COUNTRY");                     // GET `${http.loadUrl}/COUNTRY`
const blob = await AppHttp.Media(`${MsUrl.utils}/files/${id}`);
await AppHttp.DownloadFile(`${MsUrl.utils}/report`, {}, "report.pdf");
await AppHttp.CloudUpload(signedUrl, file);
const file = await uploadToSignedUrl(file, uploadUrl, downloadUrl);
AppHttp.setHeader("x-custom", "value");
```

| Member | Use |
| --- | --- |
| `Get / Post / Put / Delete / Patch` | JSON requests with token, `x-session-id`, `x-branch-id` |
| `GetShared(url, params)` | GET once per page (shell + MFEs) |
| `Load(id, params)` | option lists |
| `Media / DownloadFile / CloudUpload / uploadFile` | files |
| `BaseUrl() / FullUrl(url)` | base URL / resolved URL |
| `Headers() / RawHeaders() / setHeader(name, value)` | headers |
| `withProgress(promise)` | shows the top progress bar |

### JWT regenerate

With `http.regenerateUrl` set, before every request: `JwtValid(token)` (dff-util) is false → one GET to
`regenerateUrl` (kept in the shared page cache, so all waiting requests and MFEs share it) → the new token
(`token` or `data.token`) is saved in sessionStorage. An error → `endSession()` (log out, goes to `http.logoutUrl`).
An invalid token with an empty `regenerateUrl` throws an error at the time of the call.

```ts
await ensureFreshToken();                    // what every AppHttp request does first
const token = await jwtRegenerateCall();     // the regenerate call itself (throws when no token)
readRegenerateUrl(); readJwtToken();
```

HTTP helpers: `API_BASE_URL_ENV`, `toAbsoluteUrl`, `isHttpUrl`, `joinUrl`, `clearSharedGetCache`, `setAppConfig`, `readAppConfig`.
Types: `HttpParams`, `HttpHeaders`, `HttpConfig`.

## Session

```ts
startSession(token, user, isRemembered);   // after login
endSession(keepKeys?, isRedirect?);        // logout
refreshSessionToken(token);                // new token, user stays
isAuthenticatedSignal.value; authUserSignal.value; readAccessToken();
```

Also: `restoreSession`, `startSessionSync`, `handleSessionEvent`, `redirectToLogoutUrl`, `readTokenKey`,
`sessionTokenSignal`, `AUTH_USER_KEY`.

## Storage — `AppStorage`

```ts
AppStorage.setData(BRANCH_ID, id);   AppStorage.getData(TOKEN);   AppStorage.getText(THEME);
AppStorage.removeData(KEY);          AppStorage.clearData(keepKeys);   AppStorage.envData("API_BASE_URL");
```

Helpers: `readAppStoragePrefix`, `readPrefixedKey`, `readEnvData`, `readEnvPrefix`, `buildEnvPrefix`,
`isLocalStorageKey`, `readLocalStorageKeys`. Type: `StoredValue`.
Keys: `TOKEN`, `AUTH_USER`, `SESSION_INFO`, `SCREEN_ACCESS`, `SCREEN_ACTION`, `NAV`, `TRANS`, `DIR`, `LANG`, `THEME`,
`LAYOUT_CHOICE`, `MENU_MODE`, `SIDEBAR_COLLAPSED`, `REMEMBER_ME`, `OTP_ID`, `BRANCH_ID`, `BRANCH_NAME`,
`REGEN_EXPIRES_AT`, `ACTIVE_SESSION_ID`, `SESSION_EVENT`, `PREFERENCE_EVENT`, `StorageKeys`, `LOCAL_STORAGE_KEYS`.

## Provider and hooks

| Export | Use |
| --- | --- |
| `SharedWebUiProvider` | `<SharedWebUiProvider type config>` root of every app |
| `useUi()` | `{ locale, theme, direction, t, changeLanguage, changeTheme }` |
| `useCurrentPage()`, `useQueryParam(name)` | current page / query param (re-render on change) |
| `ThemeProvider`, `TranslationProvider`, `UiContext` | lower-level providers |

## Signals

`uiConfigSignal`, `appTypeSignal`, `localeSignal`, `languagesSignal`, `directionSignal`, `translationSignal`,
`fallbackTranslationSignal`, `isTranslationReadySignal`, `themeSignal`, `isDarkThemeSignal`, `customThemesSignal`,
`companyDetailsSignal`, `navigationSignal`, `navigationLoadingSignal`, `navigationModeSignal`, `isMenuVisibleSignal`,
`isSidebarOpenSignal`, `isSidebarCollapsedSignal`, `isDesktopSidebarSignal`, `isRailEverywhereSignal`,
`isAsideLayoutSignal`, `isSmallScreenSignal`, `isSettingsOpenSignal`, `pathnameSignal`, `currentPageSignal`,
`queryParamsSignal`, `progressSignal`, `toastsSignal`, `branchesSignal`, `branchIdSignal`, `branchNameSignal`,
`layoutChoiceSignal`, `screenAccessSignal`, `mediaPreviewSignal`, `requestedLocalesSignal`.

## Services

| Area | Exports |
| --- | --- |
| Pages (no router) | `openPage`, `PageLink`, `isPageActive`, `buildPageHref`, `buildPagePath`, `buildQueryHref`, `buildQueryString`, `readCurrentPage`, `readPageParam`, `readQueryParam`, `readQueryParams`, `setQueryParam`, `setQueryParams`, `removeQueryParam`, `readPageFromLocation`, `isPathPageMode`, `toPagePath`, `toPageParamValue` |
| Language / i18n | `changeLanguage`, `translate`, `interpolate`, `lookupMessage`, `trans`, `readNavLabel`, `loadLocaleMessages`, `loadLocaleGroups`, `readLocaleFilePath`, `fillLocaleBundle`, `setLanguages`, `toLanguageOptions`, `toLanguageOption`, `readLanguageRows`, `readDefaultLanguageCode`, `resolveDirection`, `findLanguageOption`, `matchLanguageCode`, `readBrowserLanguage`, `readBrowserLanguageCodes`, `readDefaultLanguage`, `readFallbackLanguage`, `readStartLanguageCandidates`, `unwrapLocaleModule`, `findDeepLocaleKeys`, `DEFAULT_LANGUAGE`, `DEFAULT_UI_MESSAGES`, `RTL_LANGUAGE_CODES`, `ROOT_LOCALE_GROUP`, `LOCALE_WAIT_MS`, `MAX_KEY_PARTS` |
| Theme | `changeTheme`, `isDarkThemeName`, `readThemeNames`, `readDarkThemeNames`, `splitThemesByMode`, `setCustomThemes`, `mergeCustomThemes`, `loadConfigThemes`, `followConfigThemes`, `buildCustomThemeCss`, `isValidCustomTheme`, `toCustomThemeList`, `unwrapThemesModule`, `readLogoUrl`, `DAISYUI_THEMES`, `DEFAULT_DARK_THEMES` |
| Menu / navigation | `setMenu`, `setMenuLoading`, `clearMenu`, `setNavigation`, `setNavigationLoading`, `changeNavigationMode`, `setMenuVisible`, `toggleMenuVisible`, `toggleSidebar`, `closeSidebar`, `toggleSidebarCollapsed`, `closeAllMenus`, `filterVisibleNavigation`, `toNavigation`, `toNavItem`, `toNavItems`, `flattenRootMenus`, `sortActiveMenus`, `compareMenuPriority`, `isRootMenu`, `unwrapRootMenu`, `readMenuRows`, `readMenuPermissions`, `findNavTrail`, `isNavItemActive`, `isPathMatch` |
| Access | `canAccess`, `canAccessPath`, `findNavItemByPath`, `FULL_ACCESS` |
| Branch | `setBranch`, `setBranches`, `clearBranch`, `readBranchId`, `findBranch`, `pickBranch`, `toBranchOptions`, `handleBranchSelect`, `readBranchName`, `DEFAULT_BRANCH_LABEL` |
| Company | `setCompanyDetails`, `readCompanyDetails`, `isCompanyPending`, `readAppNameLabel` |
| Layout choice / prefs | `changeLayoutChoice`, `applySavedLayoutChoice`, `toLayoutChoice`, `applySavedPreference`, `startPreferenceSync` |
| Backend loaders | `callApiSource`, `loadSessionData`, `clearSessionData`, `loadConfigLanguages`, `loadConfigCompany`, `isSignalSource` |
| Feedback | `ShowToast`, `removeToast`, `clearToasts`, `ShowProgress`, `openSettings`, `closeSettings`, `openMediaPreview`, `closeMediaPreview`, `scrollToTop` |
| Utils | `readErrorMessage`, `readContent`, `readResponseRows`, `toOptionTypes`, `readCountryOptions`, `readLanguageOptions`, `readTelCode`, `readTelCodeOptions`, `formatBytes`, `parseSizeToBytes`, `sumFileSizes`, `isFileTypeAllowed`, `normalizeFileTypes`, `readFileExtension`, `readFileIconName`, `readUploadFiles`, `resolveLucideIcon`, `isLucideIcon`, `toLucideName`, `FALLBACK_ICON`, `readSessionId`, `resetSessionId`, `setLeaveGuard`, `encryptPayload`, `decryptResponse`, `isEncryptedEnvelope`, `SharedRegExp`, `readDataValue`, `readRowKey`, `readSearchText`, `readOptionLabel`, `formatDateInputValue`, `buildMediaStyle`, `readInitials`, `goBackInHistory`, `handleDocumentEscape`, `reloadPage`, `joinClassNames` |

## Components

| Group | Exports |
| --- | --- |
| Form controls (react-hook-form) | `TypeInput`, `TypeTextArea`, `TypeSelect`, `TypeSwitch`, `TypeCheckbox`, `TypeDate`, `TypeTime`, `TypeOtp`, `TypeList`, `TypeLang`, `TypeSearch`, `TypeFilter`, `TypeUpload`, `TypeUploadBox` |
| Actions / overlays | `TypeButton`, `TypeDropdown`, `TypeModal`, `TypeDrawer`, `TypeConfirm`, `TypeTable`, `TypeIcon`, `TypeImage`, `TypeVideo`, `MediaViewer` |
| App parts | `AppBrand`, `UserMenu`, `LanguageSwitcher`, `ThemeSwitcher`, `BranchSwitcher`, `SettingsMenu`, `ToastContainer`, `TopProgress`, `ScrollToTop`, `PageLoader` |
| Pages / states | `RequireAccess`, `PermissionDenied`, `PageNotFound`, `ComingSoon`, `EmptyState` |
| Page blocks | `HeadLayout`, `ArticleLayout`, `ContentLayout`, `GridLayout`, `FloatLayout` |
| Skeletons | `SkeletonPage`, `SkeletonArticle`, `SkeletonTable`, `SkeletonForm`, `SkeletonCards`, `SkeletonDashboard`, `SkeletonChat`, `SkeletonMenu`, `SkeletonFloat`, `SkeletonAuthForm` |
| `shared-lib-web/layout` | `AppLayout`, `AsideLayout`, `AuthLayout`, `Header`, `Sidebar`, `SidebarNav`, `SidebarCollapseButton`, `MegaMenuBar`, `MegaMenuPanel`, `RailFlyout`, `RailTooltip`, `DRAWER_ID` |
| `shared-lib-web/markdown` | `TypeMdx` (editor), `TypeMdv` (viewer), `TypeLangMd` (editor per language) |

```tsx
<TypeInput control={control} name="email" label={t("user.email")} type="email" rules={rules.email} />
<TypeButton action="primary" label={t("save")} icon="Save" type="submit" />
<TypeIcon name="users" />
```

Every component exports its `*Props` type (`TypeInputProps`, `AppLayoutProps` …).

## Types

`UiConfig`, `HttpConfig`, `AppType` (`"spa" | "shell" | "mfe"`), `PageMode`, `LayoutConfig`, `NavItem`,
`NavigationMode`, `ScreenPermissions`, `ScreenAction`, `ApiSource`, `ValueSignal`, `Direction`, `LanguageOption`,
`LocaleLoader`, `LocaleCodeLoader`, `LocaleMessages`, `LocaleModule`, `LocaleBundle`, `LocaleFileLoader`,
`LocaleGroupFiles`, `Theme`, `ThemesLoader`, `ThemeGroups`, `CustomTheme`, `CustomThemeEntry`, `CustomThemeMap`,
`CustomThemes`, `CustomThemesModule`, `CompanyDetails`, `CompanySource`, `ToastPosition`, `ToastItem`, `ToastType`,
`AuthUser`, `BranchOption`, `BranchRowType`, `BranchResponseType`, `BranchSource`, `LangResponseType`, `LangSource`,
`LanguageRowType`, `MenuAccessType`, `MenuOptions`, `MenuResponseType`, `MenuSource`, `ScreenAccessType`,
`TranslationType`, `TranslationRecord`, `TranslateFunction`, `TranslateParams`, `UiContextState`, `UiContextValue`,
`OpenPageOptions`, `QueryParamOptions`, `QueryParamValues`, `LayoutChoice`, `FileTypeRules`, `UploadValue`,
`UploadOptions`, `MediaPreview`, `MediaType`, `MediaFit`, `MediaSize`, `IconName`, `TableColumn`, `ModalSize`,
`DrawerSide`, `DrawerSize`, `ListSelectionMode`, `LangInputType`, `TimeGranularity`, `ButtonAction`, `ControlSize`,
`TypeFieldProps`, `EncryptedEnvelope`, `WritableLocaleBundleSignal`, `StoredValue`, `HttpParams`, `HttpHeaders`.


## Development

```bash
npm install
npm run verify      # typecheck + code style + tests + build
```

Code rules: [CODING_RULES.md](./CODING_RULES.md). Examples: `example-basic/`, `example/`, `example-mfe/`.

## License

[MIT](./LICENSE)

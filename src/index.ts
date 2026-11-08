// shared-lib-web
// Shared components library (the required part): provider, Type* controls, page blocks, menus, switchers,
// skeletons, states, services, AppHttp / AppStorage.
//
//   <SharedWebUiProvider config={config}><App /></SharedWebUiProvider>
//   const { locale, theme, direction, t, changeLanguage, changeTheme } = useUi();
//
// Optional entries:
//   "shared-lib-web/layout"    ready-made app shell (AppLayout, AuthLayout) or its parts (Header, Sidebar, SidebarNav ...)
//   "shared-lib-web/markdown"  markdown controls (TypeMdx, TypeMdv, TypeLangMd)

// ---- Interfaces ----
export type {
  Direction,
  LanguageOption,
  LayoutConfig,
  LocaleCodeLoader,
  LocaleLoader,
  LocaleMessages,
  LocaleModule,
  NavItem,
  NavigationMode,
  ScreenPermissions,
  ApiSource,
  AppType,
  ValueSignal,
  CompanyDetails,
  CompanySource,
  CustomTheme,
  CustomThemeEntry,
  CustomThemeMap,
  CustomThemes,
  CustomThemesModule,
  LocaleBundle,
  ThemesLoader,
  Theme,
  PageMode,
  ToastPosition,
  UiConfig,
} from "./interfaces/ui-config.ts";
export type { HttpConfig } from "./interfaces/ui-config.ts";
export type {
  AuthUser,
  BranchOption,
  BranchResponseType,
  BranchRowType,
  BranchSource,
  LangResponseType,
  LangSource,
  LanguageRowType,
  MenuAccessType,
  MenuOptions,
  MenuResponseType,
  MenuSource,
  ScreenAccessType,
  TranslationType,
} from "./interfaces/app-types.ts";
export type { TranslateFunction, TranslateParams, UiContextState, UiContextValue } from "./interfaces/ui-context.ts";
export type { ToastItem, ToastType } from "./interfaces/toast.ts";

// ---- Provider and hook ----
export { SharedWebUiProvider, type SharedWebUiProviderProps } from "./providers/shared-web-ui-provider.tsx";
export { ThemeProvider, type ThemeProviderProps } from "./providers/theme-provider.tsx";
export { TranslationProvider, type TranslationProviderProps } from "./providers/translation-provider.tsx";
export { UiContext } from "./context/ui-context.ts";
export { useUi } from "./context/use-ui.ts";

// ---- Signals ----
export {
  directionSignal,
  fallbackTranslationSignal,
  isDarkThemeSignal,
  isSidebarCollapsedSignal,
  isSidebarOpenSignal,
  isAsideLayoutSignal,
  isDesktopSidebarSignal,
  isRailEverywhereSignal,
  isSmallScreenSignal,
  isMenuVisibleSignal,
  isSettingsOpenSignal,
  isTranslationReadySignal,
  languagesSignal,
  localeSignal,
  navigationLoadingSignal,
  navigationModeSignal,
  navigationSignal,
  pathnameSignal,
  currentPageSignal,
  queryParamsSignal,
  progressSignal,
  themeSignal,
  appTypeSignal,
  customThemesSignal,
  companyDetailsSignal,
  toastsSignal,
  translationSignal,
  uiConfigSignal,
} from "./state/signals.ts";

// ---- Pages by query parameter (no router, no redirect) ----
export { PageLink, isPageActive, type PageLinkProps } from "./query/page-link.tsx";
export {
  buildPageHref,
  buildPagePath,
  buildQueryHref,
  isPathPageMode,
  readPageFromLocation,
  buildQueryString,
  openPage,
  readCurrentPage,
  readPageParam,
  readQueryParam,
  readQueryParams,
  removeQueryParam,
  setQueryParam,
  setQueryParams,
  type OpenPageOptions,
  type QueryParamOptions,
  type QueryParamValues,
} from "./query/query-param.ts";
export { toPagePath, toPageParamValue } from "./query/page-path.ts";
export { applySavedPreference, startPreferenceSync } from "./state/preference-sync.ts";
export { useCurrentPage, useQueryParam } from "./query/use-query-param.ts";

// ---- Services ----
export {
  DEFAULT_LANGUAGE,
  changeLanguage,
  loadLocaleMessages,
  readDefaultLanguage,
  readFallbackLanguage,
  readBrowserLanguage,
  readStartLanguageCandidates,
  unwrapLocaleModule,
} from "./i18n/locale-service.ts";
export { MAX_KEY_PARTS, findDeepLocaleKeys, interpolate, lookupMessage, translate } from "./i18n/translator.ts";
export { RTL_LANGUAGE_CODES, findLanguageOption, resolveDirection } from "./i18n/direction.ts";
export { matchLanguageCode, readBrowserLanguageCodes } from "./i18n/browser-language.ts";
export { isSignalSource } from "./utils/signal-source.ts";
export {
  LOCALE_WAIT_MS,
  fillLocaleBundle,
  requestedLocalesSignal,
  type WritableLocaleBundleSignal,
} from "./i18n/locale-signal.ts";
export {
  ROOT_LOCALE_GROUP,
  loadLocaleGroups,
  readLocaleFilePath,
  type LocaleFileLoader,
  type LocaleGroupFiles,
} from "./i18n/locale-groups.ts";
export { DEFAULT_UI_MESSAGES } from "./i18n/default-messages.ts";
export {
  changeTheme,
  isDarkThemeName,
  readDarkThemeNames,
  readThemeNames,
  splitThemesByMode,
  type ThemeGroups,
} from "./theme/theme-service.ts";
export { DAISYUI_THEMES, DEFAULT_DARK_THEMES } from "./theme/dark-themes.ts";
export {
  buildCustomThemeCss,
  isValidCustomTheme,
  followConfigThemes,
  loadConfigThemes,
  mergeCustomThemes,
  setCustomThemes,
  toCustomThemeList,
  unwrapThemesModule,
} from "./theme/custom-themes.ts";
export { isCompanyPending, readAppNameLabel, readCompanyDetails, setCompanyDetails } from "./state/company-service.ts";
export { readLogoUrl } from "./theme/logo.ts";
export { readContent } from "./utils/content-util.ts";
export { readErrorMessage } from "./utils/error-util.ts";
export { ShowToast, clearToasts, removeToast } from "./state/toast-service.ts";
export { ShowProgress } from "./state/progress-service.ts";
export { closeSidebar, toggleSidebar } from "./state/sidebar-service.ts";
export {
  changeNavigationMode,
  closeAllMenus,
  filterVisibleNavigation,
  setMenuVisible,
  setNavigation,
  setNavigationLoading,
  toggleMenuVisible,
  toggleSidebarCollapsed,
} from "./state/navigation-service.ts";
export { FULL_ACCESS, canAccess, canAccessPath, findNavItemByPath, screenAccessSignal, type ScreenAction } from "./state/screen-access.ts";
export {
  AUTH_USER_KEY,
  authUserSignal,
  endSession,
  handleSessionEvent,
  startSessionSync,
  redirectToLogoutUrl,
  isAuthenticatedSignal,
  readAccessToken,
  restoreSession,
  sessionTokenSignal,
  startSession,
} from "./state/auth-service.ts";

// ---- HTTP ----
export {
  API_BASE_URL_ENV,
  AppHttp,
  isHttpUrl,
  joinUrl,
  readJwtToken,
  toAbsoluteUrl,
  uploadToSignedUrl,
  type HttpHeaders,
  type HttpParams,
} from "./utils/app-http.ts";
export { readAppConfig, setAppConfig } from "./utils/app-config.ts";
export {
  branchIdSignal,
  branchNameSignal,
  branchesSignal,
  clearBranch,
  findBranch,
  handleBranchSelect,
  pickBranch,
  readBranchId,
  setBranch,
  setBranches,
  toBranchOptions,
} from "./state/branch-service.ts";
export { BranchSwitcher, DEFAULT_BRANCH_LABEL, readBranchName } from "./components/branch-switcher.tsx";

// ---- Utils ----
export { trans, readNavLabel, type TranslationRecord } from "./utils/lang-util.ts";
export {
  AppStorage,
  isLocalStorageKey,
  readLocalStorageKeys,
  readAppStoragePrefix,
  buildEnvPrefix,
  readEnvData,
  readEnvPrefix,
  readPrefixedKey,
  type StoredValue,
} from "./utils/app-storage.ts";
export {
  AUTH_USER,
  BRANCH_ID,
  BRANCH_NAME,
  DEFAULT_APP_STORAGE_PREFIX,
  ENV_NAME_START,
  DIR,
  LANG,
  LOCAL_STORAGE_KEYS,
  NAV,
  MENU_MODE,
  OTP_ID,
  REGEN_EXPIRES_AT,
  REMEMBER_ME,
  PREFERENCE_EVENT,
  SESSION_EVENT,
  ACTIVE_SESSION_ID,
  LAYOUT_CHOICE,
  SCREEN_ACCESS,
  SCREEN_ACTION,
  SESSION_INFO,
  SIDEBAR_COLLAPSED,
  StorageKeys,
  THEME,
  TOKEN,
  TRANS,
} from "./utils/storage-keys.ts";
export {
  compareMenuPriority,
  flattenRootMenus,
  isRootMenu,
  readMenuPermissions,
  readMenuRows,
  sortActiveMenus,
  toNavigation,
  toNavItem,
  toNavItems,
  unwrapRootMenu,
} from "./utils/menu-util.ts";
export { clearMenu, setMenu, setMenuLoading } from "./state/menu-service.ts";
export { setLanguages } from "./state/language-service.ts";
export {
  applySavedLayoutChoice,
  changeLayoutChoice,
  layoutChoiceSignal,
  toLayoutChoice,
  type LayoutChoice,
} from "./state/layout-choice-service.ts";
export {
  callApiSource,
  clearSessionData,
  loadConfigCompany,
  loadConfigLanguages,
  loadSessionData,
} from "./state/api-loader.ts";
export {
  readDefaultLanguageCode,
  readLanguageRows,
  toLanguageOption,
  toLanguageOptions,
} from "./utils/language-util.ts";
export {
  readCountryOptions,
  readLanguageOptions,
  readResponseRows,
  readTelCode,
  readTelCodeOptions,
  toOptionTypes,
} from "./utils/option-util.ts";
export {
  formatBytes,
  isFileTypeAllowed,
  normalizeFileTypes,
  parseSizeToBytes,
  readFileExtension,
  readFileIconName,
  sumFileSizes,
  type FileTypeRules,
} from "./utils/file-util.ts";
export { FALLBACK_ICON, isLucideIcon, resolveLucideIcon, toLucideName } from "./utils/lucide-icon.ts";
export { readSessionId, resetSessionId } from "./utils/session-id.ts";
export { setLeaveGuard } from "./utils/leave-guard.ts";
export { decryptResponse, encryptPayload, isEncryptedEnvelope, type EncryptedEnvelope } from "./utils/crypto-util.ts";
export { SharedRegExp } from "./utils/shared-regexp.ts";
export { goBackInHistory, handleDocumentEscape, readDataValue, reloadPage } from "./utils/event-util.ts";

// ---- Page blocks (the app shell is in "shared-lib-web/layout") ----
export { ArticleLayout, type SectionLayoutProps } from "./layouts/article-layout.tsx";
export { HeadLayout, type HeadLayoutProps } from "./layouts/head-layout.tsx";
export { ContentLayout } from "./layouts/content-layout.tsx";
export { GridLayout } from "./layouts/grid-layout.tsx";
export { FloatLayout } from "./layouts/float-layout.tsx";
export { findNavTrail, isNavItemActive, isPathMatch } from "./layouts/navigation.ts";

// ---- Components ----
export { AppBrand, type AppBrandProps } from "./components/app-brand.tsx";
export { LanguageSwitcher, type LanguageSwitcherProps } from "./components/language-switcher.tsx";
export { ThemeSwitcher } from "./components/theme-switcher.tsx";
export { ToastContainer } from "./components/toast-container.tsx";
export { UserMenu, readInitials, type UserMenuItem, type UserMenuProps } from "./components/user-menu.tsx";
export { EmptyState, type EmptyStateProps } from "./components/empty-state.tsx";
export { PermissionDenied } from "./components/permission-denied.tsx";
export { RequireAccess, type RequireAccessProps } from "./components/require-access.tsx";
export { PageNotFound } from "./components/page-not-found.tsx";
export { ComingSoon, type ComingSoonProps } from "./components/coming-soon.tsx";
export { PageLoader } from "./components/page-loader.tsx";
export { TopProgress } from "./components/top-progress.tsx";
export { ScrollToTop, scrollToTop, type ScrollToTopProps } from "./components/scroll-to-top.tsx";
export { SettingsMenu, closeSettings, openSettings, type SettingsMenuProps } from "./components/settings-menu.tsx";

// ---- Skeletons ----
export { SkeletonArticle } from "./skeleton/skeleton-article.tsx";
export { SkeletonTable } from "./skeleton/skeleton-table.tsx";
export { SkeletonFloat } from "./skeleton/skeleton-float.tsx";
export { SkeletonMenu } from "./skeleton/skeleton-menu.tsx";
export { SkeletonPage } from "./skeleton/skeleton-page.tsx";
export { SkeletonForm, type SkeletonFormProps } from "./skeleton/skeleton-form.tsx";
export { SkeletonCards, type SkeletonCardsProps } from "./skeleton/skeleton-cards.tsx";
export { SkeletonDashboard } from "./skeleton/skeleton-dashboard.tsx";
export { SkeletonChat } from "./skeleton/skeleton-chat.tsx";
export { SkeletonAuthForm, type SkeletonAuthFormProps } from "./skeleton/skeleton-auth-form.tsx";

// ---- Type* controls ----
export { TypeIcon, type IconName, type TypeIconProps } from "./types/type.icon.ts";
export { TypeInput, type TypeInputProps } from "./types/type.input.tsx";
export { TypeTextArea, type TypeTextAreaProps } from "./types/type.text-area.tsx";
export { TypeSelect, readOptionLabel, type TypeSelectProps } from "./types/type.select.tsx";
export { TypeSwitch, type TypeSwitchProps } from "./types/type.switch.tsx";
export { TypeCheckbox, type TypeCheckboxProps } from "./types/type.checkbox.tsx";
export { TypeDate, formatDateInputValue, type TypeDateProps } from "./types/type.date.tsx";
export { TypeTime, type TimeGranularity, type TypeTimeProps } from "./types/type.time.tsx";
export { TypeOtp, type TypeOtpProps } from "./types/type.otp.tsx";
export { TypeList, type ListSelectionMode, type TypeListProps } from "./types/type.list.tsx";
export { TypeLang, type LangInputType, type TypeLangProps } from "./types/type.lang.tsx";
export { TypeSearch, readSearchText, type TypeSearchProps } from "./types/type.search.tsx";
export { TypeFilter, type TypeFilterProps } from "./types/type.filter.tsx";
export {
  TypeUpload,
  TypeUploadBox,
  type TypeUploadBoxProps,
  type TypeUploadProps,
  type UploadOptions,
} from "./types/type.upload.tsx";
export { readUploadFiles, type UploadValue } from "./types/upload-service.ts";
export { TypeImage, buildMediaStyle, type MediaFit, type MediaSize, type TypeImageProps } from "./types/type.image.tsx";
export { TypeVideo, type TypeVideoProps } from "./types/type.video.tsx";
export { MediaViewer } from "./types/media-viewer.tsx";
export {
  closeMediaPreview,
  mediaPreviewSignal,
  openMediaPreview,
  type MediaPreview,
  type MediaType,
} from "./types/media-service.ts";
export { TypeButton, type TypeButtonProps } from "./types/type.button.tsx";
export { TypeDropdown, type TypeDropdownProps } from "./types/type.dropdown.tsx";
export { TypeModal, type ModalSize, type TypeModalProps } from "./types/type.modal.tsx";
export { TypeDrawer, type DrawerSide, type DrawerSize, type TypeDrawerProps } from "./types/type.drawer.tsx";
export { TypeConfirm, type TypeConfirmProps } from "./types/type.confirm.tsx";
export { TypeTable, readRowKey, type TableColumn, type TypeTableProps } from "./types/type.table.tsx";
export type { TypeFieldProps } from "./types/field-props.ts";
export type { ButtonAction, ControlSize } from "./types/class-names.ts";
export { joinClassNames } from "./types/class-names.ts";

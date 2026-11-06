// default-messages.ts
// English texts the package always knows. They are the LAST fallback,
// so the shell never shows raw keys even when an app forgets a text.
//
// - "ui.*" keys: texts of the shell (header, sidebar, switchers, tables ...)
// - dff-util ConstKeys (REQUIRED, INVALID_EMAIL, ...): English texts from dff-util ConstMessages
//
// Apps translate these keys in their own locale JSON files.

import { ConstMessages } from "dff-util";
import type { LocaleMessages } from "../interfaces/ui-config.ts";

export const DEFAULT_UI_MESSAGES: LocaleMessages = {
  ui: {
    language: "Language",
    theme: "Theme",
    lightThemes: "Light themes",
    darkThemes: "Dark themes",
    openMenu: "Open menu",
    home: "Home",
    loading: "Loading...",
    close: "Close",
    noData: "No data found",
    selectOption: "Select an option",
    search: "Search",
    navigation: "Main navigation",
    permissionDenied: "Permission denied",
    permissionDeniedText: "You do not have access to this page. If you believe this is a mistake, contact your administrator.",
    expandMenu: "Expand menu",
    collapseMenu: "Collapse menu",
    account: "Account",
    logout: "Log out",
    confirm: "Confirm",
    cancel: "Cancel",
    translate: "Translate",
    pageNotFound: "Page not found",
    pageNotFoundText: "The page you are looking for does not exist, was removed or was renamed.",
    backToHome: "Back to home",
    goBack: "Go back",
    reloadPage: "Reload page",
    comingSoon: "Coming soon",
    comingSoonText: "We are working on this page. Please check back later.",
    all: "All",
    settings: "Settings",
    sidebar: "Sidebar",
    megaMenu: "Mega menu",
    navigationMode: "Navigation",
    scrollToTop: "Scroll to top",
    branch: "Branch",
    openPreview: "Open preview",
    playVideo: "Play video",
    mediaError: "Could not load the file",
    uploadTitle: "Drag & drop your files here",
    uploadSubtitle: "Supports {{types}} files.",
    uploadLimit: "Max file size: {{max}}",
    uploadLimitTotal: "Max {{max}} per file · up to {{total}} total",
    browseFiles: "Browse files",
    selectedFiles: "Selected files: {{count}}",
    removeFile: "Remove file",
    uploadTypeError: "\"{{name}}\" is not an allowed file type. Please upload {{types}}.",
    uploadSizeError: "\"{{name}}\" ({{size}}) is larger than the allowed {{max}}.",
    uploadTotalError: "Total size {{size}} is larger than the allowed {{max}}.",
  },
};

/** dff-util validation and status messages, for example REQUIRED -> "this filed is required". */
export const DEFAULT_CONST_MESSAGES: LocaleMessages = ConstMessages;

// page-path.ts
// Page values in the address bar have no leading slash; inside the app a page is a menu href with one.
//
//   address bar  ?page=app-settings        ?page=components/forms
//   in the app   "/app-settings"           "/components/forms"   (menu hrefs, currentPageSignal, openPage)
//
// Old links with a slash (?page=/app-settings) still open the same page.

import { ConstValue } from "dff-util";

/** "/app-settings" -> "app-settings" (only the leading slashes go; inner ones stay: "components/forms"). */
export function toPageParamValue(page: string): string {
  let start = 0;
  while (start < page.length && page.charAt(start) === ConstValue.SLASH) {
    start = start + 1;
  }
  return page.slice(start);
}

/** "app-settings" -> "/app-settings"; a value that already starts with "/" stays as it is. "" stays "". */
export function toPagePath(value: string): string {
  if (!value || value.startsWith(ConstValue.SLASH)) {
    return value;
  }
  return `${ConstValue.SLASH}${value}`;
}

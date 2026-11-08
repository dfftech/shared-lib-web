// logo.ts
// Picks the logo for the current theme. Company details (loadCompanyDetails / setCompanyDetails) win over the config.

import type { CompanyDetails, UiConfig } from "../interfaces/ui-config.ts";

/** The company logo for the theme: logoDarkUrl on dark themes (when set), else logoUrl. */
function readCompanyLogoUrl(details: CompanyDetails | null | undefined, isDarkTheme: boolean): string | undefined {
  if (isDarkTheme && details?.logoDarkUrl) {
    return details.logoDarkUrl;
  }
  return details?.logoUrl;
}

/**
 * The logo URL. Dark themes: company logoDarkUrl, company logoUrl, config.logoDarkUrl, config.logoUrl.
 * Light themes: company logoUrl, config.logoUrl.
 */
export function readLogoUrl(config: UiConfig, isDarkTheme: boolean, details?: CompanyDetails | null): string | undefined {
  const companyLogoUrl = readCompanyLogoUrl(details, isDarkTheme);
  if (companyLogoUrl) {
    return companyLogoUrl;
  }
  if (isDarkTheme && config.logoDarkUrl) {
    return config.logoDarkUrl;
  }
  return config.logoUrl;
}

// app-brand.tsx
// Logo (light or dark version) and app name. Used by the header, sidebar and auth layout.
// Company details (config.loadCompanyDetails / setCompanyDetails) win: their logoUrl, appName and companyName (alt).

import { useUi } from "../context/use-ui.ts";
import { PageLink } from "../query/page-link.tsx";
import { readAppNameLabel } from "../state/company-service.ts";
import { companyDetailsSignal, isDarkThemeSignal } from "../state/signals.ts";
import { readLogoUrl } from "../theme/logo.ts";
import { joinClassNames } from "../types/class-names.ts";

export interface AppBrandProps {
  /** Hide the app name text (logo only). */
  isNameHidden?: boolean;
  /** Extra classes for the app name, for example "lg:hidden". */
  nameClassName?: string;
  className?: string;
}

export function AppBrand(props: AppBrandProps) {
  const { isNameHidden = false, nameClassName, className } = props;
  const { config, t } = useUi();
  const isDarkTheme = isDarkThemeSignal.value;
  const companyDetails = companyDetailsSignal.value;
  const logoUrl = readLogoUrl(config, isDarkTheme, companyDetails);
  const logoAlt = companyDetails?.companyName ?? "";
  const appNameLabel = readAppNameLabel(config, companyDetails);
  const appName = appNameLabel ? t(appNameLabel) : "";
  const homePath = config.homePath ?? "/";
  const linkClassList = ["flex min-w-0 items-center gap-2", className];
  const linkClassName = joinClassNames(linkClassList);
  const nameClassList = ["truncate text-lg font-bold", nameClassName];
  const nameClass = joinClassNames(nameClassList);

  return (
    <PageLink page={homePath} className={linkClassName} label={appName}>
      {logoUrl ? <img src={logoUrl} alt={logoAlt} className="h-8 w-auto shrink-0" /> : null}
      {isNameHidden ? null : <span className={nameClass}>{appName}</span>}
    </PageLink>
  );
}

// coming-soon.tsx
// Placeholder page for screens that are not built yet. Shows the app logo for the current theme.
//
//   { path: "/reports", element: <ComingSoon /> }

import { useUi } from "../context/use-ui.ts";
import { companyDetailsSignal, isDarkThemeSignal } from "../state/signals.ts";
import { readLogoUrl } from "../theme/logo.ts";
import { TypeIcon } from "../types/type.icon.ts";

export interface ComingSoonProps {
  /** Translation key (or text) of the title. Default "ui.comingSoon". */
  titleKey?: string;
}

export function ComingSoon(props: ComingSoonProps) {
  const { titleKey = "ui.comingSoon" } = props;
  const { config, t } = useUi();
  const isDarkTheme = isDarkThemeSignal.value;
  const companyDetails = companyDetailsSignal.value;
  const logoUrl = readLogoUrl(config, isDarkTheme, companyDetails);
  const titleText = t(titleKey);
  const bodyText = t("ui.comingSoonText");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-16 w-auto" />
      ) : (
        <TypeIcon name="Hourglass" size={48} className="text-primary" />
      )}
      <h1 className="text-3xl font-bold">{titleText}</h1>
      <p className="max-w-md text-base-content/60">{bodyText}</p>
    </div>
  );
}

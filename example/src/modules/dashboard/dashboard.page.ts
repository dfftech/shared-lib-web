// dashboard.page.ts — TypeScript only: values shown on the dashboard.
import { useUi } from "shared-lib-web";
import { sessionEmail } from "../auth/login/hooks/service.ts";

export interface DashboardStat {
  id: string;
  title: string;
  value: string;
}

export interface DashboardModel {
  titleText: string;
  welcomeText: string;
  stats: DashboardStat[];
}

export function useDashboard(): DashboardModel {
  const { t, locale, theme, direction, languages } = useUi();
  const email = sessionEmail.value;
  const welcomeParams = { name: email };
  const languageCount = String(languages.length);
  return {
    titleText: t("dashboard.title"),
    welcomeText: t("dashboard.welcome", welcomeParams),
    stats: [
      { id: "locale", title: t("dashboard.language"), value: locale.toUpperCase() },
      { id: "theme", title: t("dashboard.theme"), value: theme },
      { id: "direction", title: t("dashboard.direction"), value: direction.toUpperCase() },
      { id: "languages", title: t("dashboard.languages"), value: languageCount },
    ],
  };
}

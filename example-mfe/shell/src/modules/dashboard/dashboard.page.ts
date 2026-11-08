// dashboard.page.ts — TypeScript only: the shell's Home page (/dashboard fallback) lists the page MFEs of env.mfe.js.
import { useUi } from "shared-lib-web";
import { readMfeRoutes } from "../../mfe.ts";

/** One card: an MFE with a path (the auth MFE is left out). */
export interface MfeCardType {
  id: string;
  path: string;
  url: string;
}

export interface DashboardModel {
  titleText: string;
  introText: string;
  cards: MfeCardType[];
}

function buildCards(): MfeCardType[] {
  const cards: MfeCardType[] = [];
  const routes = readMfeRoutes();
  for (const route of routes) {
    if (route.path && !route.isAuth) {
      cards.push({ id: route.id, path: route.path, url: route.url });
    }
  }
  return cards;
}

export function useDashboardPage(): DashboardModel {
  const { t } = useUi();
  return { titleText: t("home.title"), introText: t("home.text"), cards: buildCards() };
}

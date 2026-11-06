// dashboard.page.tsx — view only.
import { ArticleLayout, ContentLayout } from "shared-lib-web";
import type { ReactElement } from "react";
import { useDashboard, type DashboardStat } from "./dashboard.page.ts";

function buildStatElements(stats: DashboardStat[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const stat of stats) {
    const element = (
      <div key={stat.id} className="stat">
        <div className="stat-title">{stat.title}</div>
        <div className="stat-value text-primary capitalize">{stat.value}</div>
      </div>
    );
    elements.push(element);
  }
  return elements;
}

export function DashboardPage() {
  const { titleText, welcomeText, stats } = useDashboard();
  const statElements = buildStatElements(stats);
  return (
    <>
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">{titleText}</h2>
        <p className="mt-1 opacity-70">{welcomeText}</p>
      </ArticleLayout>
      <ContentLayout className="mt-4">
        <div className="stats stats-vertical w-full lg:stats-horizontal">{statElements}</div>
      </ContentLayout>
    </>
  );
}

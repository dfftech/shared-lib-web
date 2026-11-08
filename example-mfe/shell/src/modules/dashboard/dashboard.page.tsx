// dashboard.page.tsx — view only: the shell's Home page, with a link card per page MFE.
import { ContentLayout, HeadLayout, PageLink } from "shared-lib-web";
import type { ReactElement } from "react";
import { useDashboardPage, type MfeCardType } from "./dashboard.page.ts";

function buildCardElements(cards: MfeCardType[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const card of cards) {
    elements.push(
      <PageLink key={card.id} page={card.path} className="rounded-box border border-base-300 p-4 hover:bg-base-200">
        <span className="font-semibold">{card.id}</span>
        <span className="block truncate text-xs opacity-60" dir="ltr">{card.url}</span>
      </PageLink>,
    );
  }
  return elements;
}

export function DashboardPage() {
  const model = useDashboardPage();
  const cardElements = buildCardElements(model.cards);
  return (
    <>
      <HeadLayout title={model.titleText} />
      <ContentLayout>
        <p className="mb-4 opacity-70">{model.introText}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{cardElements}</div>
      </ContentLayout>
    </>
  );
}

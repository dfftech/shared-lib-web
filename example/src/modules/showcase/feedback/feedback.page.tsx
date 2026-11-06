// feedback.page.tsx — skeletons, empty state, permission denied and coming soon.
import {
  ArticleLayout,
  ComingSoon,
  ContentLayout,
  EmptyState,
  PermissionDenied,
  SkeletonArticle,
  SkeletonAuthForm,
  SkeletonCards,
  SkeletonChat,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonMenu,
  SkeletonTable,
  TypeButton,
  useUi,
} from "shared-lib-web";
import { feedbackTab, handleFeedbackTabClick } from "./feedback.page.ts";

function SkeletonsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ContentLayout>
        <SkeletonArticle />
      </ContentLayout>
      <ContentLayout>
        <SkeletonMenu />
      </ContentLayout>
      <ContentLayout>
        <SkeletonTable />
      </ContentLayout>
      <ContentLayout>
        <SkeletonForm fields={4} />
      </ContentLayout>
      <ContentLayout>
        <SkeletonChat />
      </ContentLayout>
      <ContentLayout>
        <SkeletonAuthForm />
      </ContentLayout>
      <div className="xl:col-span-2">
        <SkeletonDashboard />
      </div>
      <div className="xl:col-span-2">
        <SkeletonCards count={3} />
      </div>
    </div>
  );
}

function StatesTab() {
  const { t } = useUi();
  const emptyAction = <TypeButton size="sm" icon="Plus" label={t("user.add")} />;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ContentLayout>
        <EmptyState />
      </ContentLayout>
      <ContentLayout>
        <EmptyState icon="SearchX" titleKey="demo.noResults" descriptionKey="demo.noResultsText" action={emptyAction} />
      </ContentLayout>
      <ContentLayout>
        <PermissionDenied />
      </ContentLayout>
      <ContentLayout>
        <ComingSoon />
      </ContentLayout>
    </div>
  );
}

export function FeedbackPage() {
  const { t } = useUi();
  const tab = feedbackTab.value;

  return (
    <div className="flex flex-col gap-4">
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">{t("nav.feedback")}</h2>
        <p className="opacity-70">{t("nav.feedbackText")}</p>
        <div role="tablist" className="tabs tabs-box mt-3 w-fit">
          <button type="button" role="tab" className={tab === "skeletons" ? "tab tab-active" : "tab"} data-value="skeletons" onClick={handleFeedbackTabClick}>
            {t("demo.skeletons")}
          </button>
          <button type="button" role="tab" className={tab === "states" ? "tab tab-active" : "tab"} data-value="states" onClick={handleFeedbackTabClick}>
            {t("demo.states")}
          </button>
        </div>
      </ArticleLayout>
      {tab === "skeletons" ? <SkeletonsTab /> : <StatesTab />}
    </div>
  );
}

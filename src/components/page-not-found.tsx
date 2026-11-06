// page-not-found.tsx
// 404 page. Use it as the last route:  { path: "*", element: <PageNotFound /> }

import { useUi } from "../context/use-ui.ts";
import { PageLink } from "../query/page-link.tsx";
import { TypeIcon } from "../types/type.icon.ts";
import { goBackInHistory, reloadPage } from "../utils/event-util.ts";

export function PageNotFound() {
  const { config, t } = useUi();
  const homePath = config.homePath ?? "/";
  const titleText = t("ui.pageNotFound");
  const bodyText = t("ui.pageNotFoundText");
  const homeText = t("ui.backToHome");
  const backText = t("ui.goBack");
  const reloadText = t("ui.reloadPage");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="relative flex size-24 items-center justify-center rounded-3xl border border-base-300 bg-base-200 shadow-lg">
        <TypeIcon name="FileQuestion" size={48} className="text-primary" />
        <span className="badge badge-error badge-sm absolute -end-2 -top-2">404</span>
      </div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">{titleText}</h1>
      <p className="max-w-md text-base-content/60">{bodyText}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <PageLink page={homePath} className="btn btn-primary">
          <TypeIcon name="House" size={18} />
          {homeText}
        </PageLink>
        <button type="button" className="btn btn-outline" onClick={goBackInHistory}>
          <TypeIcon name="ArrowLeft" size={18} className="rtl:-scale-x-100" />
          {backText}
        </button>
      </div>
      <button type="button" className="btn btn-ghost btn-xs" onClick={reloadPage}>
        <TypeIcon name="RefreshCw" size={12} />
        {reloadText}
      </button>
    </div>
  );
}

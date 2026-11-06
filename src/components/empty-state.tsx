// empty-state.tsx
// Friendly "nothing here" block for empty lists, search results and tables.
//
//   <EmptyState />                                            // "No data found"
//   <EmptyState icon="SearchX" titleKey="user.noResults" descriptionKey="user.noResultsHint" action={<TypeButton ... />} />

import type { ReactNode } from "react";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "../types/class-names.ts";
import { TypeIcon, type IconName } from "../types/type.icon.ts";

export interface EmptyStateProps {
  /** lucide icon name. Default "Inbox". */
  icon?: IconName;
  /** Translation key (or text). Default "ui.noData". */
  titleKey?: string;
  /** Translation key (or text) of a second line. */
  descriptionKey?: string;
  /** Optional button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState(props: EmptyStateProps) {
  const { icon = "Inbox", titleKey = "ui.noData", descriptionKey, action, className } = props;
  const { t } = useUi();
  const titleText = t(titleKey);
  const descriptionText = descriptionKey ? t(descriptionKey) : undefined;
  const classList = ["flex flex-col items-center justify-center gap-2 py-12 text-center", className];
  const wrapperClassName = joinClassNames(classList);

  return (
    <div className={wrapperClassName}>
      <span className="flex size-14 items-center justify-center rounded-full bg-base-200 text-base-content/40">
        <TypeIcon name={icon} size={28} />
      </span>
      <p className="font-medium text-base-content/70">{titleText}</p>
      {descriptionText ? <p className="max-w-sm text-sm text-base-content/50">{descriptionText}</p> : null}
      {action}
    </div>
  );
}

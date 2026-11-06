// head-layout.tsx
// Sticky page header: one-line title on the start side, action buttons (Submit, Cancel, ...) on the end side.
// It stays fixed at the top of the page while the page scrolls, just under the app header.
// Its bar is h-16 (4rem), the same height as the logo box of the Sidebar and the app Header, so the borders line up.
//
//   <HeadLayout
//     title={t("user.editTitle")}
//     actions={<>
//       <TypeButton action="ghost" icon="X" label={t("user.cancel")} onPress={handleUserCancel} />
//       <TypeButton type="submit" form="user-form" icon="Save" label={t("user.save")} />
//     </>}
//   />
//   <form id="user-form" onSubmit={onSubmit}>...</form>
//
// A submit button in the header sits outside the <form>, so give the form an id and pass it as `form` to TypeButton.

import { useSignals } from "@preact/signals-react/runtime";
import type { ReactNode } from "react";
import { isAsideLayoutSignal } from "../state/signals.ts";
import { joinClassNames } from "../types/class-names.ts";

export interface HeadLayoutProps {
  /** Page title (already translated), shown on the start side. */
  title: ReactNode;
  /** Buttons on the end side, for example Cancel and Submit. */
  actions?: ReactNode;
  /** Optional extra row under the title and actions (filters, tabs, ...). */
  children?: ReactNode;
  /** Sticks just under the 4rem app header (top-16). Set false when the page has no app header (top-0). Default true (false in an AsideLayout). */
  isBelowHeader?: boolean;
  /** Stretches over the page padding of <main> (p-4 lg:p-6) so the bar touches both edges. Default true. */
  isFullWidth?: boolean;
  className?: string;
}

const FULL_WIDTH_CLASS = "-mx-4 -mt-4 border-b border-base-300 px-4 lg:-mx-6 lg:-mt-6 lg:px-6";
const CARD_CLASS = "rounded-box px-4 shadow-sm";

export function HeadLayout(props: HeadLayoutProps) {
  useSignals();
  const { title, actions, children, isFullWidth = true, className } = props;
  const isAsideLayout = isAsideLayoutSignal.value;
  const isBelowHeader = props.isBelowHeader ?? !isAsideLayout;
  const topClass = isBelowHeader ? "top-16" : "top-0";
  const shapeClass = isFullWidth ? FULL_WIDTH_CLASS : CARD_CLASS;
  // min-h-16 on the box (border included) = the 4rem logo box, so both bottom borders sit on one line.
  const classList = ["sticky z-20 flex min-h-16 flex-col justify-center bg-base-100/95 backdrop-blur", topClass, shapeClass, className];
  const headerClassName = joinClassNames(classList);
  const actionsElement = actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null;
  const extraElement = children ? <div className="pb-3">{children}</div> : null;

  return (
    <header className={headerClassName} data-head-layout>
      <div className="flex flex-wrap items-center justify-between gap-2 py-2">
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-primary">{title}</h1>
        {actionsElement}
      </div>
      {extraElement}
    </header>
  );
}

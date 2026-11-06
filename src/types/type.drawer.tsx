// type.drawer.tsx
// Side panel that slides over the page (for forms and details). Closes with ✕, backdrop click or Escape.
// "end" opens on the right in LTR and on the left in RTL.
//
//   <TypeDrawer isOpen={userIsPopupOpen.value} title={t("user.editTitle")} onClose={closeUserPopup}
//               actions={<TypeButton label={t("save")} type="submit" form="user-form" />}>
//     <UserForm />
//   </TypeDrawer>

import type { MouseEventHandler, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { TypeButton } from "./type.button.tsx";

export type DrawerSide = "start" | "end";
export type DrawerSize = "sm" | "md" | "lg" | "xl";

export interface TypeDrawerProps {
  isOpen: boolean;
  /** Heading (already translated). */
  title?: string;
  /** Small text under the heading. */
  subTitle?: string;
  /** Buttons next to ✕. */
  actions?: ReactNode;
  onClose: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
  /** Default "end". */
  side?: DrawerSide;
  /** Width. Default "lg". */
  size?: DrawerSize;
}

const DRAWER_SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function TypeDrawer(props: TypeDrawerProps) {
  const { isOpen, title, subTitle, actions, onClose, children, side = "end", size = "lg" } = props;
  const { t } = useUi();
  if (!isOpen) {
    return null;
  }
  const closeText = t("ui.close");
  const sizeClass = DRAWER_SIZE_CLASSES[size];
  const sideClass = side === "end" ? "end-0 border-s" : "start-0 border-e";
  const panelClassList = [
    "fixed inset-y-0 z-50 flex w-full flex-col border-base-300 bg-base-100 text-base-content shadow-2xl outline-none",
    sideClass,
    sizeClass,
  ];
  const panelClassName = joinClassNames(panelClassList);

  const overlay = (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={closeText} onClick={onClose} />
      <div className={panelClassName}>
        <div className="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-200/50 p-4">
          <div className="min-w-0 flex-1">
            {title ? <h3 className="truncate text-lg font-bold">{title}</h3> : null}
            {subTitle ? <p className="truncate text-xs opacity-60">{subTitle}</p> : null}
          </div>
          {actions}
          <TypeButton
            action="ghost"
            size="sm"
            icon="X"
            label={closeText}
            isIconOnly
            isOverlayClose
            autoFocus
            className="btn-circle"
            onPress={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
  // Rendered into <body> so a sticky or blurred parent (for example the header) can not clip it.
  return createPortal(overlay, document.body);
}

// type.modal.tsx
// DaisyUI modal. Closes with the ✕ button, a backdrop click or Escape.
//
//   <TypeModal isOpen={isSettingsOpen.value} title={t("settings.title")} onClose={closeSettings} size="md"
//              footer={<TypeButton label={t("save")} onPress={handleSave} />}>
//     ...content...
//   </TypeModal>

import type { MouseEventHandler, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { TypeButton } from "./type.button.tsx";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "full";

export interface TypeModalProps {
  isOpen: boolean;
  /** Heading (already translated). */
  title?: string;
  onClose: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
  /** Buttons at the bottom. */
  footer?: ReactNode;
  /** Width. Default "md". */
  size?: ModalSize;
  /** Hide the ✕ button. Escape and backdrop still close. */
  isCloseHidden?: boolean;
  className?: string;
}

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  "4xl": "max-w-7xl",
  full: "max-w-[calc(100vw-2rem)] w-full",
};

export function TypeModal(props: TypeModalProps) {
  const { isOpen, title, onClose, children, footer, size = "md", isCloseHidden = false, className } = props;
  const { t } = useUi();
  if (!isOpen) {
    return null;
  }
  const closeText = t("ui.close");
  const sizeClass = MODAL_SIZE_CLASSES[size];
  const boxClassList = ["modal-box outline-none", sizeClass, className];
  const boxClassName = joinClassNames(boxClassList);
  const closeButtonClassName = isCloseHidden ? "hidden" : "absolute end-2 top-2";

  const overlay = (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-label={title}>
      <div className={boxClassName}>
        <TypeButton
          action="ghost"
          size="sm"
          icon="X"
          label={closeText}
          isIconOnly
          isOverlayClose
          autoFocus={!isCloseHidden}
          className={`btn-circle ${closeButtonClassName}`}
          onPress={onClose}
        />
        {title ? <h3 className="pe-8 text-lg font-bold">{title}</h3> : null}
        <div className="py-4">{children}</div>
        {footer ? <div className="modal-action">{footer}</div> : null}
      </div>
      <button type="button" className="modal-backdrop" aria-label={closeText} onClick={onClose} />
    </div>
  );
  // Rendered into <body> so a sticky or blurred parent (for example the header) can not clip it.
  return createPortal(overlay, document.body);
}

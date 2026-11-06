// type.confirm.tsx
// In-app replacement for window.confirm. Cancel has the focus first, so Enter never confirms
// a destructive action by accident. Escape or a backdrop click cancels.
//
//   <TypeConfirm isOpen={isDeleteOpen.value} title={t("user.deleteTitle")} message={t("user.deleteText")}
//                tone="error" isLoading={userDeleteIsLoading.value}
//                onConfirm={handleDeleteConfirm} onCancel={closeDeleteConfirm} />

import type { MouseEventHandler } from "react";
import { useUi } from "../context/use-ui.ts";
import { TypeButton } from "./type.button.tsx";
import { TypeModal } from "./type.modal.tsx";

export interface TypeConfirmProps {
  isOpen: boolean;
  /** Heading (already translated). */
  title: string;
  /** Explanation (already translated). */
  message?: string;
  /** Default: translated "Confirm". */
  confirmLabel?: string;
  /** Default: translated "Cancel". */
  cancelLabel?: string;
  /** "error" for destructive actions. Default "primary". */
  tone?: "primary" | "error" | "warning";
  isLoading?: boolean;
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  onCancel: MouseEventHandler<HTMLElement>;
}

export function TypeConfirm(props: TypeConfirmProps) {
  const { isOpen, title, message, confirmLabel, cancelLabel, tone = "primary", isLoading = false, onConfirm, onCancel } = props;
  const { t } = useUi();
  const defaultConfirmText = t("ui.confirm");
  const defaultCancelText = t("ui.cancel");
  const confirmText = confirmLabel ?? defaultConfirmText;
  const cancelText = cancelLabel ?? defaultCancelText;
  const footer = (
    <>
      <TypeButton action="ghost" label={cancelText} onPress={onCancel} disabled={isLoading} autoFocus />
      <TypeButton action={tone} label={confirmText} onPress={onConfirm} isLoading={isLoading} />
    </>
  );

  return (
    <TypeModal isOpen={isOpen} title={title} onClose={onCancel} size="sm" footer={footer} isCloseHidden>
      {message ? <p className="opacity-80">{message}</p> : null}
    </TypeModal>
  );
}

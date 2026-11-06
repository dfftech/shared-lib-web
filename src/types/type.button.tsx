// type.button.tsx
// DaisyUI button with an action colour, optional lucide-react icon (TypeIcon) and loading state.
//
//   <TypeButton action="primary" label={t("save")} icon="Save" type="submit" isLoading={userSaveIsLoading.value} />
//   <TypeButton action="ghost" label={t("cancel")} icon="X" onPress={handleUserCancel} />
//   <TypeButton type="submit" form="user-form" label={t("save")} />   // outside the <form id="user-form">

import type { MouseEventHandler } from "react";
import { useUi } from "../context/use-ui.ts";
import {
  BUTTON_ACTION_CLASSES,
  BUTTON_SIZE_CLASSES,
  joinClassNames,
  type ButtonAction,
  type ControlSize,
} from "./class-names.ts";
import { TypeIcon, type IconName } from "./type.icon.ts";

export interface TypeButtonProps {
  /** Visible text (already translated). */
  label: string;
  /** Colour / style. Default "primary". */
  action?: ButtonAction;
  /** lucide-react icon name, for example "Save". */
  icon?: IconName;
  /** Click handler. Not needed for type="submit". */
  onPress?: MouseEventHandler<HTMLButtonElement>;
  /** Default "button". */
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Shows a spinner and disables the button. */
  isLoading?: boolean;
  /** Use the outline style. */
  isOutline?: boolean;
  /** Show only the icon (label becomes the aria-label). */
  isIconOnly?: boolean;
  size?: ControlSize;
  /** Full width. */
  isBlock?: boolean;
  className?: string;
  /** Extra data passed to the click handler through data-value (read with event.currentTarget.dataset.value). */
  dataValue?: string;
  /** Focus this button when it appears (for example Cancel in a confirm dialog). */
  autoFocus?: boolean;
  /** Marks the button that closes an overlay (Escape clicks it). */
  isOverlayClose?: boolean;
  /** id of the <form> this button belongs to, when it sits outside it (for example Submit in a HeadLayout). */
  form?: string;
}

export function TypeButton(props: TypeButtonProps) {
  const {
    label,
    action = "primary",
    icon,
    onPress,
    type = "button",
    disabled = false,
    isLoading = false,
    isOutline = false,
    isIconOnly = false,
    size = "md",
    isBlock = false,
    className,
    dataValue,
    autoFocus = false,
    isOverlayClose = false,
    form,
  } = props;
  const { t } = useUi();
  const loadingText = t("ui.loading");
  const actionClass = BUTTON_ACTION_CLASSES[action];
  const sizeClass = BUTTON_SIZE_CLASSES[size];
  const classList = [
    "btn",
    actionClass,
    sizeClass,
    isOutline ? "btn-outline" : "",
    isIconOnly ? "btn-square" : "",
    isBlock ? "btn-block" : "",
    className,
  ];
  const buttonClassName = joinClassNames(classList);
  const showIcon = Boolean(icon) && !isLoading;
  const iconElement = showIcon ? <TypeIcon name={icon} size={16} /> : null;
  const spinnerElement = isLoading ? <span className="loading loading-spinner loading-sm" aria-label={loadingText} /> : null;
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      form={form}
      className={buttonClassName}
      onClick={onPress}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-label={isIconOnly ? label : undefined}
      data-value={dataValue}
      data-overlay-close={isOverlayClose ? true : undefined}
      autoFocus={autoFocus}
      title={isIconOnly ? label : undefined}
    >
      {spinnerElement}
      {iconElement}
      {isIconOnly ? null : label}
    </button>
  );
}

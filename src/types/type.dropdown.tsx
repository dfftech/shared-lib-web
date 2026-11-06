// type.dropdown.tsx
// Action menu (not a form field): a button that opens a DaisyUI dropdown list.
// Each item's key is put in data-value; read it in your handler with readDataValue(event).
//
//   <TypeDropdown label={t("user.actions")} icon="EllipsisVertical" isIconOnly items={userActionItems} onSelect={handleUserActionSelect} />
//   function handleUserActionSelect(event: MouseEvent<HTMLButtonElement>) {
//     const actionKey = readDataValue(event);   // "edit" | "delete"
//   }

import type { OptionType } from "dff-util";
import type { MouseEventHandler, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { readOptionLabel } from "./type.select.tsx";
import { TypeIcon, type IconName } from "./type.icon.ts";

export interface TypeDropdownProps {
  /** Button text (already translated). Also the aria-label when isIconOnly. */
  label: string;
  /** Items. option.icon is a lucide icon name. */
  items: OptionType[];
  /** Called with the clicked item; its key is in data-value. */
  onSelect: MouseEventHandler<HTMLButtonElement>;
  /** Button icon. */
  icon?: IconName;
  isIconOnly?: boolean;
  /** Open to the start or end side. Default "end". */
  align?: "start" | "end";
  /** Open upwards. */
  isTop?: boolean;
  className?: string;
}

/** Closes the DaisyUI dropdown by removing focus from it. */
export function blurActiveElement(): void {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

/** Builds the menu entries. */
function buildDropdownItems(items: OptionType[], languageCode: string, onSelect: MouseEventHandler<HTMLButtonElement>): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const item of items) {
    const itemLabel = readOptionLabel(item, languageCode);
    const itemKey = String(item.key);
    const iconElement = item.icon ? <TypeIcon name={item.icon} size={16} /> : null;
    const element = (
      <li key={itemKey} className={item.disabled ? "menu-disabled" : undefined}>
        <button type="button" data-value={itemKey} disabled={item.disabled} onClick={onSelect} onMouseUp={blurActiveElement}>
          {iconElement}
          {itemLabel}
        </button>
      </li>
    );
    elements.push(element);
  }
  return elements;
}

export function TypeDropdown(props: TypeDropdownProps) {
  const { label, items, onSelect, icon = "ChevronDown", isIconOnly = false, align = "end", isTop = false, className } = props;
  const { locale } = useUi();
  const itemElements = buildDropdownItems(items, locale, onSelect);
  const classList = ["dropdown", align === "end" ? "dropdown-end" : "dropdown-start", isTop ? "dropdown-top" : "", className];
  const dropdownClassName = joinClassNames(classList);
  const buttonClassName = isIconOnly ? "btn btn-ghost btn-sm btn-square" : "btn btn-sm";

  return (
    <div className={dropdownClassName}>
      <div tabIndex={0} role="button" className={buttonClassName} aria-label={label} title={label}>
        {isIconOnly ? null : label}
        <TypeIcon name={icon} size={16} />
      </div>
      <ul tabIndex={0} className="dropdown-content menu z-40 mt-1 w-52 rounded-box bg-base-100 p-2 shadow-lg">
        {itemElements}
      </ul>
    </div>
  );
}

// type.filter.tsx
// Small select for list filters (NOT a react-hook-form field): status, role, sort order ...
// Controlled with value + onChange. Options use dff-util OptionType (option.lang[locale] is shown).
//
//   <TypeFilter label={t("user.role")} options={roleFilterOptions} value={userRoleFilter.value} onChange={handleRoleFilterChange} />
//   function handleRoleFilterChange(event: ChangeEvent<HTMLSelectElement>) { userRoleFilter.value = event.currentTarget.value; }

import type { OptionType } from "dff-util";
import { useId, type ChangeEventHandler, type ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import { SELECT_SIZE_CLASSES, joinClassNames, type ControlSize } from "./class-names.ts";
import { readOptionLabel } from "./type.select.tsx";

export interface TypeFilterProps {
  /** Hidden label for screen readers (already translated). */
  label: string;
  options: OptionType[];
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  /** First option meaning "no filter" (already translated). Default: translated "All". Set false to hide it. */
  allLabel?: string | false;
  /** Default "sm". */
  size?: ControlSize;
  className?: string;
}

/** Builds the <option> elements. */
function buildFilterOptions(options: OptionType[], languageCode: string): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const option of options) {
    const optionLabel = readOptionLabel(option, languageCode);
    const element = (
      <option key={option.key} value={option.key} disabled={option.disabled}>
        {optionLabel}
      </option>
    );
    elements.push(element);
  }
  return elements;
}

export function TypeFilter(props: TypeFilterProps) {
  const { label, options, value, onChange, allLabel, size = "sm", className } = props;
  const { t, locale } = useUi();
  const selectId = useId();
  const defaultAllLabel = t("ui.all");
  const allText = allLabel ?? defaultAllLabel;
  const optionElements = buildFilterOptions(options, locale);
  const sizeClass = SELECT_SIZE_CLASSES[size];
  const classList = ["select w-auto min-w-36", sizeClass, className];
  const selectClassName = joinClassNames(classList);

  return (
    <>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select id={selectId} className={selectClassName} value={value} onChange={onChange} title={label}>
        {allText === false ? null : <option value="">{allText}</option>}
        {optionElements}
      </select>
    </>
  );
}

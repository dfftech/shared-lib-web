// type.search.tsx
// Search box for list filters (not a form field).
//   onChange  runs on every key press (live filter)
//   onSearch  runs on Enter or the search button; read the text with readSearchText(event)
//
//   <TypeSearch name="search" label={t("ui.search")} value={userSearchText.value} onChange={handleUserSearchChange} />
//   <TypeSearch name="search" label={t("ui.search")} onSearch={handleUserSearchSubmit} />
//   function handleUserSearchSubmit(event: FormEvent<HTMLFormElement>) { const text = readSearchText(event); ... }

import { ConstValue } from "dff-util";
import type { ChangeEventHandler, FormEvent, FormEventHandler } from "react";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { TypeIcon } from "./type.icon.ts";

export interface TypeSearchProps {
  name: string;
  /** Hidden label for screen readers and the placeholder (already translated). */
  label: string;
  value?: string;
  /** Live search on every key press. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Search on Enter / button click. The page does not reload. */
  onSearch?: FormEventHandler<HTMLFormElement>;
  className?: string;
}

/** Returns the text typed in the search box of a submitted TypeSearch form. */
export function readSearchText(event: FormEvent<HTMLFormElement>): string {
  const form = event.currentTarget;
  const formData = new FormData(form);
  const searchValue = formData.get("search");
  return typeof searchValue === "string" ? searchValue : ConstValue.EMPTY;
}

/** Stops the page reload, then calls the app handler. */
function submitWithoutReload(event: FormEvent<HTMLFormElement>, onSearch: FormEventHandler<HTMLFormElement> | undefined): void {
  event.preventDefault();
  if (onSearch) {
    onSearch(event);
  }
}

/** Form submit handler; the app handler is read from the form's search-handler registry. */
function handleSearchFormSubmit(event: FormEvent<HTMLFormElement>): void {
  const form = event.currentTarget;
  const handlerId = form.dataset.searchId ?? ConstValue.EMPTY;
  const onSearch = searchHandlers.get(handlerId);
  submitWithoutReload(event, onSearch);
}

const searchHandlers = new Map<string, FormEventHandler<HTMLFormElement>>();

export function TypeSearch(props: TypeSearchProps) {
  const { name, label, value, onChange, onSearch, className } = props;
  const { t } = useUi();
  const searchText = t("ui.search");
  const classList = ["input input-sm", className];
  const wrapperClassName = joinClassNames(classList);

  if (!onSearch) {
    return (
      <label className={wrapperClassName}>
        <TypeIcon name="Search" size={16} className="opacity-60" />
        <input type="search" name={name} value={value} onChange={onChange} placeholder={label} aria-label={label} className="grow" />
      </label>
    );
  }

  searchHandlers.set(name, onSearch);
  return (
    <form role="search" className="join" data-search-id={name} onSubmit={handleSearchFormSubmit}>
      <input
        type="search"
        name="search"
        defaultValue={value}
        onChange={onChange}
        placeholder={label}
        aria-label={label}
        className="input input-sm join-item"
      />
      <button type="submit" className="btn btn-sm join-item" aria-label={searchText} title={searchText}>
        <TypeIcon name="Search" size={16} />
      </button>
    </form>
  );
}

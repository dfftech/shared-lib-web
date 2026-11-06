// branch-switcher.tsx
// Dropdown with the branches (stores) of the user. The selected branch is sent as x-branch-id by AppHttp.
// Hidden while there is no branch list (null or []). The title comes from config.branchLabel (default "ui.branch").
// Branches with disabled: true are shown greyed out and can not be selected.
// The Header shows it automatically; an own layout can place <BranchSwitcher /> anywhere.

import type { ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import type { BranchOption } from "../interfaces/app-types.ts";
import { branchesSignal, branchIdSignal, findBranch, handleBranchSelect } from "../state/branch-service.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { trans } from "../utils/lang-util.ts";

/** Default title of the switcher when config.branchLabel is missing. */
export const DEFAULT_BRANCH_LABEL = "ui.branch";

/** The name to show: the name in the current language (nameLang) or the plain name. */
export function readBranchName(branch: BranchOption): string {
  return trans(branch.nameLang, branch.name);
}

/** Builds one menu entry per branch. */
function buildBranchItems(branches: BranchOption[], activeId: string): ReactElement[] {
  const items: ReactElement[] = [];
  for (const branch of branches) {
    const isActive = branch.id === activeId;
    const name = readBranchName(branch);
    const item = (
      <li key={branch.id} className={branch.isDisabled ? "menu-disabled" : undefined}>
        <button
          type="button"
          className={isActive ? "menu-active" : undefined}
          aria-current={isActive}
          disabled={branch.isDisabled}
          data-value={branch.id}
          onClick={handleBranchSelect}
        >
          <TypeIcon name="Store" size={16} />
          <span className="truncate">{name}</span>
        </button>
      </li>
    );
    items.push(item);
  }
  return items;
}

export function BranchSwitcher() {
  const { config, t } = useUi();
  const branches = branchesSignal.value;
  const activeId = branchIdSignal.value;
  if (branches.length === 0) {
    return null;
  }
  const labelKey = config.branchLabel ?? DEFAULT_BRANCH_LABEL;
  const label = t(labelKey);
  const activeBranch = findBranch(branches, activeId);
  const activeName = activeBranch ? readBranchName(activeBranch) : label;
  const items = buildBranchItems(branches, activeId);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1.5" aria-label={`${label}: ${activeName}`} title={label}>
        <TypeIcon name="Store" size={16} />
        <span className="hidden max-w-40 truncate text-xs font-semibold sm:inline">{activeName}</span>
        <TypeIcon name="ChevronDown" size={14} className="opacity-60" />
      </div>
      <ul tabIndex={0} className="dropdown-content menu z-40 mt-2 max-h-80 w-60 flex-nowrap overflow-y-auto rounded-box bg-base-100 p-2 shadow-lg">
        <li className="menu-title">{label}</li>
        {items}
      </ul>
    </div>
  );
}

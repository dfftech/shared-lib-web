// branch-service.ts
// The selected branch (store). AppHttp sends its id as the "x-branch-id" header on every request.
//
//   setBranch(branch.id, branch.name);   // after the user picks a branch (saved in AppStorage BRANCH_ID / BRANCH_NAME)
//   branchIdSignal.value                 // current id, "" when none (re-renders components)
//   clearBranch();                       // no branch (endSession() clears it too)
//   <SharedWebUiProvider branch={reply}>  // list for the switcher (see below)

import { signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import type { MouseEvent } from "react";
import type { BranchOption, BranchRowType, BranchSource } from "../interfaces/app-types.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { readDataValue } from "../utils/event-util.ts";
import { BRANCH_ID, BRANCH_NAME } from "../utils/storage-keys.ts";

/** Selected branch id, or "". */
export const branchIdSignal = signal<string>(ConstValue.EMPTY);

/** Selected branch name, or "". */
export const branchNameSignal = signal<string>(ConstValue.EMPTY);

/** Selects a branch: saved in AppStorage and sent as x-branch-id from the next request on. */
export function setBranch(branchId: string, branchName: string = ConstValue.EMPTY): void {
  AppStorage.setData(BRANCH_ID, branchId);
  AppStorage.setData(BRANCH_NAME, branchName);
  branchIdSignal.value = branchId;
  branchNameSignal.value = branchName;
}

/** The selected branch id from AppStorage ("" when none). */
export function readBranchId(): string {
  return AppStorage.getText(BRANCH_ID);
}

/** Removes the selected branch. */
export function clearBranch(): void {
  AppStorage.removeData(BRANCH_ID);
  AppStorage.removeData(BRANCH_NAME);
  branchIdSignal.value = ConstValue.EMPTY;
  branchNameSignal.value = ConstValue.EMPTY;
}

/** Reads the saved branch into the signals (after a refresh). Called with restoreSession(). */
export function restoreBranch(): void {
  branchIdSignal.value = AppStorage.getText(BRANCH_ID);
  branchNameSignal.value = AppStorage.getText(BRANCH_NAME);
}

// ---- Branch list (the switcher) ----
//
//   <SharedWebUiProvider config={config} branch={branchReply}>
//   setBranches(branchReply);               // the same without the provider (for example before the menu request)
//
// Which branch is selected when the list arrives (disabled branches are never selected):
//   1. the saved branch (BRANCH_ID), if it is in the list
//   2. the row marked isDefault / default
//   3. the first branch
// Rows with disabled: true are shown greyed out and can not be picked. An empty list or null shows no switcher.

/** Branches offered by the switcher ([] = no switcher). */
export const branchesSignal = signal<BranchOption[]>([]);

let appliedBranchSource: BranchSource | null | undefined = undefined;

/** Reads the branch list from the backend reply ({ data: [...] }) or returns the list itself. */
export function readBranchRows(source: BranchSource | null | undefined): BranchRowType[] {
  if (!source) {
    return [];
  }
  const isList = Array.isArray(source);
  if (isList) {
    return source;
  }
  return source.data ?? [];
}

/** Sort compare: lower priority first. Same priority keeps the backend order. */
export function compareBranchPriority(first: BranchRowType, second: BranchRowType): number {
  const firstPriority = first.priority ?? Number.MAX_SAFE_INTEGER;
  const secondPriority = second.priority ?? Number.MAX_SAFE_INTEGER;
  return firstPriority - secondPriority;
}

/** One row as a switcher option, or null when it has no id. */
export function toBranchOption(row: BranchRowType): BranchOption | null {
  const id = row.id ?? row.branchId ?? row.code ?? ConstValue.EMPTY;
  if (!id) {
    return null;
  }
  const name = row.name ?? row.branchName ?? row.label ?? id;
  const isDefault = Boolean(row.isDefault ?? row.default);
  const isDisabled = Boolean(row.disabled ?? row.isDisabled);
  return { id: id, name: name, nameLang: row.nameLang, isDefault: isDefault, isDisabled: isDisabled };
}

/** Backend branches -> switcher options (active ones, sorted by priority). */
export function toBranchOptions(source: BranchSource | null | undefined): BranchOption[] {
  const rows = readBranchRows(source);
  const activeRows: BranchRowType[] = [];
  for (const row of rows) {
    if (row.active !== false) {
      activeRows.push(row);
    }
  }
  activeRows.sort(compareBranchPriority);
  const options: BranchOption[] = [];
  for (const row of activeRows) {
    const option = toBranchOption(row);
    if (option) {
      options.push(option);
    }
  }
  return options;
}

/** The branch with this id that can be selected (not disabled), or undefined. */
export function findSelectableBranch(branches: BranchOption[], branchId: string | undefined): BranchOption | undefined {
  const branch = findBranch(branches, branchId);
  return branch && !branch.isDisabled ? branch : undefined;
}

/** The branch with this id, or undefined. */
export function findBranch(branches: BranchOption[], branchId: string | undefined): BranchOption | undefined {
  if (!branchId) {
    return undefined;
  }
  for (const branch of branches) {
    if (branch.id === branchId) {
      return branch;
    }
  }
  return undefined;
}

/** The first selectable branch marked isDefault, or undefined. */
function findMarkedDefaultBranch(branches: BranchOption[]): BranchOption | undefined {
  for (const branch of branches) {
    if (branch.isDefault && !branch.isDisabled) {
      return branch;
    }
  }
  return undefined;
}

/** The first branch that is not disabled, or undefined. */
function findFirstSelectableBranch(branches: BranchOption[]): BranchOption | undefined {
  for (const branch of branches) {
    if (!branch.isDisabled) {
      return branch;
    }
  }
  return undefined;
}

/** Which branch to select for a new list: saved -> isDefault -> first (disabled branches are skipped). */
export function pickBranch(branches: BranchOption[], savedBranchId: string): BranchOption | undefined {
  const savedBranch = findSelectableBranch(branches, savedBranchId);
  if (savedBranch) {
    return savedBranch;
  }
  const markedDefault = findMarkedDefaultBranch(branches);
  if (markedDefault) {
    return markedDefault;
  }
  return findFirstSelectableBranch(branches);
}

/** Shows the branches in the switcher and selects one (see the order above). */
export function setBranches(source: BranchSource | null | undefined): void {
  appliedBranchSource = source;
  const branches = toBranchOptions(source);
  branchesSignal.value = branches;
  if (branches.length === 0) {
    return;
  }
  const savedBranchId = readBranchId();
  const branch = pickBranch(branches, savedBranchId);
  if (!branch) {
    return;
  }
  const savedBranchName = branchNameSignal.peek();
  const isAlreadySelected = branch.id === savedBranchId && branch.name === savedBranchName;
  if (!isAlreadySelected) {
    setBranch(branch.id, branch.name);
  }
}

/**
 * Used by <SharedWebUiProvider branch={...}>. Applies the value only when it changed.
 * undefined leaves the branches alone; null or [] hides the switcher.
 */
export function registerBranches(source: BranchSource | null | undefined): void {
  if (source === undefined || source === appliedBranchSource) {
    return;
  }
  setBranches(source);
}

/** Forgets the applied list so the next registerBranches() applies it again (after log out / config change). */
export function forgetAppliedBranches(): void {
  appliedBranchSource = undefined;
}

/** Switcher buttons carry the branch id in data-value. A disabled branch is ignored. */
export function handleBranchSelect(event: MouseEvent<HTMLElement>): void {
  const branchId = readDataValue(event);
  const branch = findSelectableBranch(branchesSignal.value, branchId);
  if (!branch) {
    return;
  }
  setBranch(branch.id, branch.name);
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

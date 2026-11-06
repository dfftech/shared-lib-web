// branch.service.ts
// The branches (stores) of the example. They come from the backend after login, through AppHttp.
//
//   branchSignal.value = null;     // signed out / not loaded: no branch switcher
//   branchSignal.value = reply;    // the API answered: the header and the settings dialog list the branches
//
// root.tsx passes it on: <SharedWebUiProvider branch={branchSignal.value}>
// Each row can bring isDefault (selected first time) and disabled (shown, not selectable).
// The "backend" of the example is a static file: public/api/app-api/branches.json.
import { signal } from "@preact/signals-react";
import { AppHttp, setBranches, type BranchSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";

/** null = no branches (no switcher); a reply = the branches to offer. */
export const branchSignal = signal<BranchSource | null>(null);

/** GET the branches of the signed-in user. */
async function fetchBranches(): Promise<BranchSource> {
  const branchesUrl = `${MsUrl.main}/branches.json`;
  const reply = await AppHttp.Get(branchesUrl);
  return reply as BranchSource;
}

/**
 * Loads the branches. setBranches() selects one right away (saved -> isDefault -> first, never a disabled one),
 * so the next request (the menu) already sends x-branch-id. On an error there is no switcher.
 */
export async function loadBranches(): Promise<void> {
  try {
    const reply = await fetchBranches();
    setBranches(reply);
    branchSignal.value = reply;
  } catch {
    branchSignal.value = null;
  }
}

/** Removes the branches (logout). */
export function clearBranches(): void {
  branchSignal.value = null;
}

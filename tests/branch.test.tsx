// Tests for the branch list: provider input branch, which branch is selected (saved -> isDefault -> first,
// never a disabled one), disabled branches can not be picked, the header switcher (title from config.branchLabel)
// and no switcher for null / [].
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  AppHttp,
  AppStorage,
  BRANCH_ID,
  SharedWebUiProvider,
  branchIdSignal,
  clearBranch,
  pickBranch,
  toBranchOptions,
  type BranchSource,
  type UiConfig,
} from "../src/index.ts";
import { AppLayout } from "../src/layout.ts";
import { testConfig } from "./test-config.ts";

const branchReply: BranchSource = {
  data: [
    { id: "B1", name: "North store", priority: 2 },
    { branchId: "B2", branchName: "South store", priority: 1, isDefault: true },
    { id: "B3", name: "Closed store", active: false },
    { id: "B4", name: "Locked store", priority: 3, disabled: true },
  ],
};

const branchConfig: UiConfig = { ...testConfig, branchLabel: "Store" };

async function renderShell(branch: BranchSource | null): Promise<void> {
  window.history.pushState({}, "", "/");
  const page = <p>branch page</p>;
  render(
    <SharedWebUiProvider config={branchConfig} branch={branch}>
      <AppLayout>{page}</AppLayout>
    </SharedWebUiProvider>,
  );
  await screen.findByText("branch page");
}

function resetBranch(): void {
  cleanup();
  clearBranch();
}

function testPickOrder(): void {
  const branches = toBranchOptions(branchReply);
  const ids: string[] = [];
  for (const branch of branches) {
    ids.push(branch.id);
  }
  expect(ids).toEqual(["B2", "B1", "B4"]);
  expect(pickBranch(branches, "B1")?.id).toBe("B1");
  expect(pickBranch(branches, "")?.id).toBe("B2");
  expect(pickBranch(branches, "missing")?.id).toBe("B2");
  // A saved branch that is now disabled is not kept.
  expect(pickBranch(branches, "B4")?.id).toBe("B2");
  const plainBranches = toBranchOptions([{ id: "X", disabled: true }, { id: "Y" }]);
  expect(pickBranch(plainBranches, "")?.id).toBe("Y");
}

async function testDefaultBranchAndSwitcher(): Promise<void> {
  await renderShell(branchReply);
  expect(branchIdSignal.value).toBe("B2");
  expect(AppStorage.getData(BRANCH_ID)).toBe("B2");
  const banner = screen.getByRole("banner");
  const switcher = within(banner).getByRole("button", { name: "Store: South store" });
  expect(switcher).toBeTruthy();
  const northButton = within(banner).getByRole("button", { name: "North store" });
  fireEvent.click(northButton);
  expect(branchIdSignal.value).toBe("B1");
  const headers = AppHttp.Headers();
  expect(headers["x-branch-id"]).toBe("B1");
  expect(within(banner).getByRole("button", { name: "Store: North store" })).toBeTruthy();
  // A disabled branch is shown but can not be selected.
  const lockedButton = within(banner).getByRole("button", { name: "Locked store" }) as HTMLButtonElement;
  expect(lockedButton.disabled).toBe(true);
  fireEvent.click(lockedButton);
  expect(branchIdSignal.value).toBe("B1");
}

async function testNoSwitcherWithoutBranches(): Promise<void> {
  await renderShell(null);
  const banner = screen.getByRole("banner");
  expect(within(banner).queryByRole("button", { name: /Store/ })).toBeNull();
  cleanup();
  await renderShell([]);
  const emptyBanner = screen.getByRole("banner");
  expect(within(emptyBanner).queryByRole("button", { name: /Store/ })).toBeNull();
}

async function testSavedBranchWins(): Promise<void> {
  act(resetBranch);
  AppStorage.setData(BRANCH_ID, "B1");
  await renderShell(branchReply);
  expect(branchIdSignal.value).toBe("B1");
}

describe("Branches", function describeBranches() {
  afterEach(resetBranch);
  it("sorts, filters and picks: saved -> isDefault -> first, never a disabled one", testPickOrder);
  it("selects the isDefault branch, switches from the header (x-branch-id), disabled can not be picked", testDefaultBranchAndSwitcher);
  it("shows no switcher for null or an empty list", testNoSwitcherWithoutBranches);
  it("keeps the saved branch when it is in the list", testSavedBranchWins);
});

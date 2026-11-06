// feedback.page.ts — TypeScript only: selected tab of the feedback showcase.
import { signal } from "@preact/signals-react";
import { readDataValue } from "shared-lib-web";
import type { MouseEvent } from "react";

export type FeedbackTab = "skeletons" | "states";

export const feedbackTab = signal<FeedbackTab>("skeletons");

/** Tab buttons carry the tab name in data-value. */
export function handleFeedbackTabClick(event: MouseEvent<HTMLButtonElement>): void {
  feedbackTab.value = readDataValue(event) as FeedbackTab;
}

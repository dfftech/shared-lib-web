// rail-tooltip.tsx
// Tooltip next to the collapsed sidebar rail: hovering or focusing an icon shows its label.
// The sidebar scrolls (overflow), which would cut off a CSS tooltip, so this one is fixed next to the rail
// (like RailFlyout). Elements opt in with data-rail-tip="Label"; the Sidebar listens with the handlers below.
// AppLayout renders <RailTooltip />; an own layout that uses <Sidebar /> renders it once as well.

import { useSignals } from "@preact/signals-react/runtime";
import type { FocusEvent, MouseEvent } from "react";
import { ConstValue } from "dff-util";
import { isRailEverywhereSignal, isSidebarCollapsedSignal, railFlyoutSignal, railTooltipSignal } from "../state/signals.ts";

const TIP_CLASS =
  "pointer-events-none fixed start-22 z-50 -translate-y-1/2 rounded-field bg-neutral px-3 py-1.5 text-sm whitespace-nowrap text-neutral-content shadow-lg";

const HIDDEN_TIP = { text: ConstValue.EMPTY, top: 0 };

export function hideRailTooltip(): void {
  if (railTooltipSignal.value.text) {
    railTooltipSignal.value = HIDDEN_TIP;
  }
}

/** Shows the tooltip of the nearest [data-rail-tip] element (only while the sidebar is collapsed). */
export function showRailTooltipFor(target: EventTarget | null): void {
  const isCollapsed = isSidebarCollapsedSignal.value || isRailEverywhereSignal.value;
  const isElement = target instanceof Element;
  if (!isCollapsed || !isElement) {
    hideRailTooltip();
    return;
  }
  const tipElement = target.closest("[data-rail-tip]");
  const text = tipElement?.getAttribute("data-rail-tip") ?? ConstValue.EMPTY;
  // An open dropdown (for example the user menu) has the focus inside: no tooltip over it.
  const hasOpenDropdown = tipElement ? tipElement.matches(".dropdown:focus-within") : false;
  if (!tipElement || !text || hasOpenDropdown) {
    hideRailTooltip();
    return;
  }
  const rect = tipElement.getBoundingClientRect();
  const top = rect.top + rect.height / 2;
  const current = railTooltipSignal.value;
  if (current.text === text && current.top === top) {
    return;
  }
  railTooltipSignal.value = { text: text, top: top };
}

export function handleRailTooltipMouseOver(event: MouseEvent<HTMLElement>): void {
  showRailTooltipFor(event.target);
}

export function handleRailTooltipFocus(event: FocusEvent<HTMLElement>): void {
  showRailTooltipFor(event.target);
}

export function RailTooltip() {
  useSignals();
  const tip = railTooltipSignal.value;
  const isFlyoutOpen = Boolean(railFlyoutSignal.value.groupId);
  const isRailEverywhere = isRailEverywhereSignal.value;
  const isCollapsed = isSidebarCollapsedSignal.value || isRailEverywhere;
  if (!tip.text || isFlyoutOpen || !isCollapsed) {
    return null;
  }
  const tipStyle = { top: tip.top };
  const tipClassName = isRailEverywhere ? TIP_CLASS : `${TIP_CLASS} hidden lg:block`;

  return (
    <div
      role="tooltip"
      style={tipStyle}
      className={tipClassName}
    >
      {tip.text}
    </div>
  );
}

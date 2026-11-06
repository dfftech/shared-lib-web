// scroll-to-top.tsx
// Round button that appears after scrolling down and scrolls back to the top. Rendered by AppLayout.

import { useSignals } from "@preact/signals-react/runtime";
import { translate } from "../i18n/translator.ts";
import { isScrolledSignal } from "../state/signals.ts";
import { TypeIcon } from "../types/type.icon.ts";

const SCROLL_THRESHOLD_PX = 400;

let isScrollListenerStarted = false;

/** Updates isScrolledSignal from the window scroll position. */
export function handleWindowScroll(): void {
  const isScrolled = window.scrollY > SCROLL_THRESHOLD_PX;
  if (isScrolledSignal.value !== isScrolled) {
    isScrolledSignal.value = isScrolled;
  }
}

/** Starts listening to scrolling. Safe to call many times. */
export function startScrollListener(): void {
  if (isScrollListenerStarted) {
    return;
  }
  isScrollListenerStarted = true;
  const listenerOptions = { passive: true };
  window.addEventListener("scroll", handleWindowScroll, listenerOptions);
}

/** Smoothly scrolls to the top. */
export function scrollToTop(): void {
  const scrollOptions: ScrollToOptions = { top: 0, behavior: "smooth" };
  window.scrollTo(scrollOptions);
}

export interface ScrollToTopProps {
  /** Start position, so the button does not sit under a sidebar. Default "start-6". */
  positionClassName?: string;
}

export function ScrollToTop(props: ScrollToTopProps) {
  useSignals();
  const isScrolled = isScrolledSignal.value;
  if (!isScrolled) {
    return null;
  }
  const label = translate("ui.scrollToTop");
  const positionClassName = props.positionClassName ?? "start-6";
  const buttonClassName = `btn btn-circle btn-neutral fixed bottom-6 z-20 shadow-lg ${positionClassName}`;
  return (
    <button
      type="button"
      className={buttonClassName}
      aria-label={label}
      title={label}
      onClick={scrollToTop}
    >
      <TypeIcon name="ArrowUp" size={18} />
    </button>
  );
}

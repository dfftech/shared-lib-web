// scroll-to-top.tsx
// Round button that appears after scrolling down and scrolls back to the top. Rendered by AppLayout and AsideLayout.

import { useSignals } from "@preact/signals-react/runtime";
import { translate } from "../i18n/translator.ts";
import { scrollPageTo, startScrollListener } from "../state/scroll-service.ts";
import { isScrolledSignal } from "../state/signals.ts";
import { TypeIcon } from "../types/type.icon.ts";

export { startScrollListener };

/** Smoothly scrolls to the top. */
export function scrollToTop(): void {
  const scrollOptions: ScrollToOptions = { top: 0, behavior: "smooth" };
  scrollPageTo(scrollOptions);
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

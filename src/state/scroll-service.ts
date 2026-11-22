// scroll-service.ts
// Page scrolling. AppLayout scrolls inside its <main> (the scroll root); AsideLayout and pages without a layout scroll the window.

import { isScrolledSignal } from "./signals.ts";

/** Attribute on the element that scrolls the page content (AppLayout's <main>). */
export const SCROLL_ROOT_ATTRIBUTE = "data-scroll-root";

const SCROLL_ROOT_SELECTOR = `[${SCROLL_ROOT_ATTRIBUTE}]`;
const SCROLL_THRESHOLD_PX = 400;

let isScrollListenerStarted = false;

/** Returns the element that scrolls the page content, or null when the window scrolls. */
export function readScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR);
}

/** Updates isScrolledSignal from the scroll root or the window. Scrolling inside other boxes (tables, lists) is ignored. */
export function handlePageScroll(event: Event): void {
  const target = event.target;
  let scrollTop = window.scrollY;
  if (target instanceof Element) {
    const isScrollRoot = target.hasAttribute(SCROLL_ROOT_ATTRIBUTE);
    if (!isScrollRoot) {
      return;
    }
    scrollTop = target.scrollTop;
  }
  const isScrolled = scrollTop > SCROLL_THRESHOLD_PX;
  if (isScrolledSignal.value !== isScrolled) {
    isScrolledSignal.value = isScrolled;
  }
}

/** Starts listening to page scrolling. Safe to call many times. */
export function startScrollListener(): void {
  if (isScrollListenerStarted) {
    return;
  }
  isScrollListenerStarted = true;
  // "scroll" does not bubble; capturing on document sees the window and every scrolling element.
  const listenerOptions = { capture: true, passive: true };
  document.addEventListener("scroll", handlePageScroll, listenerOptions);
}

/** Scrolls the page content (the scroll root and the window). */
export function scrollPageTo(options: ScrollToOptions): void {
  const scrollRoot = readScrollRoot();
  // jsdom has no Element.scrollTo.
  if (scrollRoot && "scrollTo" in scrollRoot) {
    scrollRoot.scrollTo(options);
  }
  window.scrollTo(options);
}

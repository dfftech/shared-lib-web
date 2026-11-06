// page-link.tsx
// A link that shows another page by setting ?page=<page> (no router, no redirect, no reload).
// Ctrl / Cmd click still opens the page in a new tab, because the href is a real URL.
//
//   <PageLink page="/profiles">Profiles</PageLink>
//   <PageLink page="/" isExact className="btn" activeClassName="btn-active">Home</PageLink>

import { useSignals } from "@preact/signals-react/runtime";
import type { MouseEvent, ReactNode } from "react";
import { isPathMatch } from "../layouts/navigation.ts";
import { currentPageSignal } from "../state/signals.ts";
import { joinClassNames } from "../types/class-names.ts";
import { buildPageHref, openPage } from "./query-param.ts";

export interface PageLinkProps {
  /** Page to show, usually a menu href such as "/profiles". */
  page: string;
  children?: ReactNode;
  className?: string;
  /** Added when the link is the current page. */
  activeClassName?: string;
  /** Active only on the exact page (not on child pages). Default: true for "/", false otherwise. */
  isExact?: boolean;
  title?: string;
  /** aria-label. */
  label?: string;
}

/** true when the link page is the current page (or a parent of it, unless exact). */
export function isPageActive(page: string, currentPage: string, isExact: boolean): boolean {
  if (isExact) {
    return page === currentPage;
  }
  return isPathMatch(page, currentPage);
}

/** true when the click should be left to the browser (new tab, other mouse button ...). */
function isSpecialClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  const isOtherButton = event.button !== 0;
  const anchor = event.currentTarget;
  const opensNewTab = anchor.target === "_blank";
  return hasModifier || isOtherButton || opensNewTab;
}

/** Click on a PageLink: sets ?page from data-page without reloading. */
export function handlePageLinkClick(event: MouseEvent<HTMLAnchorElement>): void {
  const isSpecial = isSpecialClick(event);
  if (isSpecial) {
    return;
  }
  const anchor = event.currentTarget;
  const page = anchor.dataset.page;
  if (!page) {
    return;
  }
  event.preventDefault();
  openPage(page);
}

export function PageLink(props: PageLinkProps) {
  useSignals();
  const { page, children, className, activeClassName, title, label } = props;
  const isExact = props.isExact ?? page === "/";
  const currentPage = currentPageSignal.value;
  const isActive = isPageActive(page, currentPage, isExact);
  const href = buildPageHref(page);
  const classList = [className, isActive ? activeClassName : undefined];
  const linkClassName = joinClassNames(classList);

  return (
    <a
      href={href}
      data-page={page}
      className={linkClassName || undefined}
      aria-current={isActive ? "page" : undefined}
      title={title}
      aria-label={label}
      onClick={handlePageLinkClick}
    >
      {children}
    </a>
  );
}

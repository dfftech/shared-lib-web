// aside-layout.tsx
// AsideLayout: a ready-made layout WITHOUT a top header — only the side menu and the page.
//   - Desktop: the sidebar can be collapsed to an icon rail (button at the bottom), tooltips on the rail.
//   - Small screens: the sidebar is always the collapsed icon rail (no drawer, no menu button).
//   - No mega menu: the navigation mode setting is ignored and hidden in the settings dialog.
//   - The user sits at the bottom of the sidebar (showSettings adds a settings button there, off by default).
//
//   <AsideLayout sidebarUser={<UserMenu isInSidebar ... />}>{pageElement}</AsideLayout>

import { useSignals } from "@preact/signals-react/runtime";
import { Suspense, useLayoutEffect, type ReactNode } from "react";
import { ScrollToTop } from "../components/scroll-to-top.tsx";
import { SettingsMenu } from "../components/settings-menu.tsx";
import { RUN_ONCE } from "../providers/provider-effects.ts";
import { SkeletonPage } from "../skeleton/skeleton-page.tsx";
import {
  isAsideLayoutSignal,
  isMenuVisibleSignal,
  isRailEverywhereSignal,
  isSidebarCollapsedSignal,
  isSmallScreenSignal,
  uiConfigSignal,
} from "../state/signals.ts";
import { RailFlyout } from "./rail-flyout.tsx";
import { RailTooltip } from "./rail-tooltip.tsx";
import { Sidebar } from "./sidebar.tsx";

export interface AsideLayoutProps {
  /** The page content (the app picks it from the ?page query parameter). */
  children?: ReactNode;
  /** User block at the bottom of the sidebar, for example <UserMenu isInSidebar ... />. */
  sidebarUser?: ReactNode;
  /** Content at the bottom of the sidebar (hidden on the rail). */
  sidebarFooter?: ReactNode;
  /** Settings button (language, theme) at the bottom of the sidebar. Default false. */
  showSettings?: boolean;
  /** Show the side menu. Default: isMenuVisibleSignal (config.layout.showMenu, setMenuVisible()). */
  showSidebar?: boolean;
  /** Own sidebar content instead of the library Sidebar. */
  sidebar?: ReactNode;
  /** Content below the page, for example a footer bar. */
  footer?: ReactNode;
}

/** Media query for screens below the lg breakpoint (1024px). */
const SMALL_SCREEN_QUERY = "(max-width: 1023.98px)";

let smallScreenQuery: MediaQueryList | null = null;

function updateSmallScreen(): void {
  isSmallScreenSignal.value = smallScreenQuery?.matches ?? false;
}

/** Starts following the screen size (isSmallScreenSignal). Safe to call more than once. */
export function watchSmallScreen(): void {
  const hasMatchMedia = typeof window !== "undefined" && typeof window.matchMedia === "function";
  if (!hasMatchMedia || smallScreenQuery) {
    return;
  }
  smallScreenQuery = window.matchMedia(SMALL_SCREEN_QUERY);
  smallScreenQuery.addEventListener("change", updateSmallScreen);
  updateSmallScreen();
}

/** Stops following the screen size. */
export function unwatchSmallScreen(): void {
  smallScreenQuery?.removeEventListener("change", updateSmallScreen);
  smallScreenQuery = null;
}

/** Leaves the aside mode when the AsideLayout goes away (for example when the app switches layouts). */
export function endAsideLayout(): void {
  isAsideLayoutSignal.value = false;
  unwatchSmallScreen();
}

/** Turns the aside mode on while the AsideLayout is on screen. Returns the clean-up. */
export function startAsideLayout(): () => void {
  watchSmallScreen();
  isAsideLayoutSignal.value = true;
  return endAsideLayout;
}

export function AsideLayout(props: AsideLayoutProps) {
  useSignals();
  useLayoutEffect(startAsideLayout, RUN_ONCE);
  const { children, sidebarUser, sidebarFooter, showSettings = false, sidebar, footer } = props;
  const isMenuVisible = isMenuVisibleSignal.value;
  const showSidebar = props.showSidebar ?? isMenuVisible;
  const config = uiConfigSignal.value;
  const showScrollToTop = config?.layout?.showScrollToTop ?? true;
  const pageFallback = <SkeletonPage />;
  // Scroll-to-top sits on the start side, so it moves past the sidebar (rail 5rem, open 18rem).
  const isNarrowSidebar = isRailEverywhereSignal.value || isSidebarCollapsedSignal.value;
  const sidebarScrollClass = isNarrowSidebar ? "start-26" : "start-78";
  const scrollPositionClassName = showSidebar ? sidebarScrollClass : "start-6";
  const settingsElement = showSettings ? <SettingsMenu isInSidebar /> : undefined;
  const librarySidebar = <Sidebar footer={sidebarFooter} user={sidebarUser} tools={settingsElement} />;
  const sidebarElement = sidebar ?? librarySidebar;

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* sticky makes its own stacking layer: z-40 keeps the sidebar (and the user menu opening from it) above the page. */}
      {showSidebar ? <div className="sticky top-0 z-40 h-screen shrink-0">{sidebarElement}</div> : null}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 space-y-4 p-4 lg:p-6">
          <Suspense fallback={pageFallback}>
            {children}
          </Suspense>
        </main>
        {footer}
      </div>
      {showSidebar ? <RailFlyout /> : null}
      {showSidebar ? <RailTooltip /> : null}
      {showScrollToTop ? <ScrollToTop positionClassName={scrollPositionClassName} /> : null}
    </div>
  );
}

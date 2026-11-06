// app-layout.tsx
// The single, ready-made layout (optional — a project may build its own from Header, Sidebar, SidebarNav,
// MegaMenuBar ... or use none of them). Built with the DaisyUI drawer:
//   menuMode "sidebar":  sidebar always visible on desktop (collapsible to an icon rail)
//   menuMode "megamenu": header mega menu on desktop
//   Small screens (both modes): the sidebar slides in from the menu button.
//
//   <AppLayout headerEnd={<UserMenu ... />}>{pageElement}</AppLayout>
//   <AppLayout sidebarUser={<UserMenu isInSidebar ... />}>{pageElement}</AppLayout>   user at the bottom of the side menu
//
// Parts can be turned off or replaced:
//   <AppLayout showSidebar={false}>                     header + page only
//   <AppLayout header={<MyHeader />}>                   own header, library sidebar
//   <AppLayout sidebar={<MySidebar />} footer={<MyFooter />}>

import { useSignals } from "@preact/signals-react/runtime";
import { Suspense, type ReactNode } from "react";
import { translate } from "../i18n/translator.ts";
import { ScrollToTop } from "../components/scroll-to-top.tsx";
import { SkeletonPage } from "../skeleton/skeleton-page.tsx";
import { handleDrawerToggleChange } from "../state/sidebar-service.ts";
import { isMenuVisibleSignal, isSidebarCollapsedSignal, isSidebarOpenSignal, navigationModeSignal, uiConfigSignal } from "../state/signals.ts";
import { joinClassNames } from "../types/class-names.ts";
import { Header } from "./header.tsx";
import { DRAWER_ID } from "./layout-constants.ts";
import { RailFlyout } from "./rail-flyout.tsx";
import { RailTooltip } from "./rail-tooltip.tsx";
import { Sidebar } from "./sidebar.tsx";

export interface AppLayoutProps {
  /** The page content (the app picks it from the ?page query parameter). */
  children?: ReactNode;
  /** Extra content in the header, for example <UserMenu />. */
  headerEnd?: ReactNode;
  /** Content at the bottom of the sidebar. */
  sidebarFooter?: ReactNode;
  /** User block at the bottom of the sidebar (above the collapse button), for example <UserMenu isInSidebar ... />. */
  sidebarUser?: ReactNode;
  /** Show the header. Default true. */
  showHeader?: boolean;
  /** Show the menu (sidebar / drawer / mega menu bar). Default: isMenuVisibleSignal (config.layout.showMenu, setMenuVisible()). */
  showSidebar?: boolean;
  /** Own header instead of the library Header. */
  header?: ReactNode;
  /** Own sidebar content instead of the library Sidebar (it still slides in on small screens). */
  sidebar?: ReactNode;
  /** Content below the page, for example a footer bar. */
  footer?: ReactNode;
}

export function AppLayout(props: AppLayoutProps) {
  useSignals();
  const { children, headerEnd, sidebarFooter, sidebarUser, showHeader = true, header, sidebar, footer } = props;
  const isMenuVisible = isMenuVisibleSignal.value;
  const showSidebar = props.showSidebar ?? isMenuVisible;

  const config = uiConfigSignal.value;
  const isSidebarOpen = isSidebarOpenSignal.value;
  const isMegaMenu = navigationModeSignal.value === "megamenu";
  const showScrollToTop = config?.layout?.showScrollToTop ?? true;
  const closeText = translate("ui.close");
  const pageFallback = <SkeletonPage />;
  const isDesktopSidebar = showSidebar && !isMegaMenu; // same rule as isDesktopSidebarSignal, plus the showSidebar prop
  const drawerClassList = ["drawer", isDesktopSidebar ? "lg:drawer-open" : ""];
  const libraryHeader = <Header endContent={headerEnd} showMenuButtons={showSidebar} />;
  const headerElement = header ?? libraryHeader;
  const librarySidebar = <Sidebar footer={sidebarFooter} user={sidebarUser} />;
  const sidebarElement = sidebar ?? librarySidebar;
  const drawerClassName = joinClassNames(drawerClassList);
  // Scroll-to-top sits on the start side: on desktop it moves past the sidebar (rail 5rem, open 18rem).
  const desktopScrollClass = isSidebarCollapsedSignal.value ? "start-6 lg:start-26" : "start-6 lg:start-78";
  const scrollPositionClassName = isDesktopSidebar ? desktopScrollClass : "start-6";

  return (
    <div className={drawerClassName}>
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        checked={isSidebarOpen}
        onChange={handleDrawerToggleChange}
      />
      <div className="drawer-content flex min-h-screen min-w-0 flex-col bg-base-200">
        {showHeader ? headerElement : null}
        <main className="flex-1 space-y-4 p-4 lg:p-6">
          <Suspense fallback={pageFallback}>
            {children}
          </Suspense>
        </main>
        {footer}
      </div>
      {showSidebar ? (
        <div className="drawer-side z-40">
          <label htmlFor={DRAWER_ID} aria-label={closeText} className="drawer-overlay" />
          {sidebarElement}
        </div>
      ) : null}
      {isDesktopSidebar ? <RailFlyout /> : null}
      {isDesktopSidebar ? <RailTooltip /> : null}
      {showScrollToTop ? <ScrollToTop positionClassName={scrollPositionClassName} /> : null}
    </div>
  );
}

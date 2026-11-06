// main-layout.tsx
// MainLayout: a layout this PROJECT builds itself, using single parts of the library instead of <AppLayout>:
//   Header and SidebarNav (menu only) from shared-lib-web/layout.
// Any markup works here — this is only one idea: a top bar, a slim menu column on the left and the page.
import { isDesktopSidebarSignal, isMenuVisibleSignal, isSidebarOpenSignal } from "shared-lib-web";
import { Header, SidebarNav } from "shared-lib-web/layout";
import { useSignals } from "@preact/signals-react/runtime";
import type { ReactNode } from "react";

/** Sticky menu column: below the 4rem header, full remaining height, scrolls on its own. */
const MENU_COLUMN_CLASS =
  "sticky top-16 h-[calc(100dvh-4rem)] w-64 shrink-0 self-start overflow-y-auto border-e border-base-300 bg-base-100";

export interface MainLayoutProps {
  headerEnd?: ReactNode;
  children?: ReactNode;
}

export function MainLayout(props: MainLayoutProps) {
  useSignals();
  const { headerEnd, children } = props;
  const isMenuOpen = isSidebarOpenSignal.value;
  const isMenuVisible = isMenuVisibleSignal.value;
  // Desktop: a menu column only in "sidebar" mode (in "megamenu" mode the header shows the menu).
  // Small screens: the column opens with the header menu button.
  const isDesktopSidebar = isDesktopSidebarSignal.value;
  const desktopClassName = isDesktopSidebar ? "lg:block" : "lg:hidden";
  const mobileClassName = isMenuOpen ? "block" : "hidden";
  // The menu column stays in place while the page scrolls: sticky under the 4rem header, its own scroll when long.
  const menuClassName = `${mobileClassName} ${desktopClassName} ${MENU_COLUMN_CLASS}`;

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <Header endContent={headerEnd} isStandalone />
      <div className="flex flex-1">
        {isMenuVisible ? (
          <aside className={menuClassName}>
            <SidebarNav isAlwaysExpanded />
          </aside>
        ) : null}
        <main className="flex-1 space-y-4 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

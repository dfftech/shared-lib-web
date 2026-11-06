// shared-lib-web/layout
// OPTIONAL app shell. The main entry ("shared-lib-web") has every component, control and service;
// this entry only adds ready-made layouts. A project picks one way:
//
//   1. Single layout:      <AppLayout headerEnd={<UserMenu />}>{page}</AppLayout>   (+ AuthLayout for login)
//                          or <AsideLayout sidebarUser={<UserMenu isInSidebar />}>{page}</AsideLayout>  (no header, no mega menu)
//   2. Individual parts:   <Header />, <Sidebar />, <SidebarNav />, <SidebarCollapseButton />, <MegaMenuBar />, <MegaMenuPanel />, <RailFlyout />, <RailTooltip />
//                          inside the project's own layout
//   3. None:               the project builds its whole layout itself with the main entry
//                          (AppBrand, UserMenu, LanguageSwitcher, ThemeSwitcher, PageLink ...)
//
//   import { AppLayout, AuthLayout } from "shared-lib-web/layout";

export { AppLayout, type AppLayoutProps } from "./layouts/app-layout.tsx";
export { AsideLayout, type AsideLayoutProps } from "./layouts/aside-layout.tsx";
export { AuthLayout, type AuthLayoutProps } from "./layouts/auth-layout.tsx";
export { Header, type HeaderProps } from "./layouts/header.tsx";
export {
  Sidebar,
  SidebarCollapseButton,
  SidebarNav,
  type SidebarCollapseButtonProps,
  type SidebarNavProps,
  type SidebarProps,
} from "./layouts/sidebar.tsx";
export { MegaMenuBar, MegaMenuPanel } from "./layouts/mega-menu.tsx";
export { RailFlyout } from "./layouts/rail-flyout.tsx";
export { RailTooltip } from "./layouts/rail-tooltip.tsx";
export { DRAWER_ID } from "./layouts/layout-constants.ts";

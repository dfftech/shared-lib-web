// app.tsx
// Basic example: ONE language (en-US) and NO branches. The whole app is one component (no router):
//   - signed out: the login page
//   - signed in:  AppLayout, and inside it the component for the current page (?page=profiles -> "/profiles")

import { ComingSoon, isDesktopSidebarSignal, PageNotFound, RequireAccess, SkeletonAuthForm, SkeletonPage, useCurrentPage } from "shared-lib-web";
import { AppLayout, AuthLayout } from "shared-lib-web/layout";
import { Suspense, type ReactElement } from "react";
import { HeaderUser } from "./modules/auth/login/components/header-user.tsx";
import { isLoggedIn } from "./modules/auth/login/hooks/service.ts";
import { LoginPage } from "./modules/auth/login/login.page.tsx";
import { DashboardPage } from "./modules/dashboard/dashboard.page.tsx";
import { UserPage } from "./modules/profiles/users/user.page.tsx";
import { SettingsPage } from "./modules/settings/settings.page.tsx";

const headerEnd = <HeaderUser />;
const sidebarUser = <HeaderUser isInSidebar />;
const pageFallback = <SkeletonPage />;
const loginFallback = <SkeletonAuthForm />;
const comingSoon = <ComingSoon />;
const notFound = <PageNotFound />;

/** The component for each page value. The keys are the hrefs of the backend menu (sor /authorization/<persona>?roles=<roles>). */
const PAGE_ELEMENTS: Record<string, ReactElement> = {
  "/": <DashboardPage />,
  "/dashboard": <DashboardPage />,
  "/products": comingSoon,
  "/stores": comingSoon,
  "/profiles": <UserPage />,
  "/store-management": comingSoon,
  "/role-assignor": comingSoon,
  "/menu-management": comingSoon,
  "/menu-access": comingSoon,
  "/app-settings": <SettingsPage />,
};

/** The component for a page value, or "page not found". */
function readPageElement(page: string): ReactElement {
  return PAGE_ELEMENTS[page] ?? notFound;
}

export function App() {
  const page = useCurrentPage();
  if (!isLoggedIn.value) {
    return (
      <AuthLayout>
        <Suspense fallback={loginFallback}>
          <LoginPage />
        </Suspense>
      </AuthLayout>
    );
  }
  const pageElement = readPageElement(page);
  // On desktop in "sidebar" mode the user sits at the bottom of the side menu, so the header copy is hidden there.
  const headerUserClassName = isDesktopSidebarSignal.value ? "lg:hidden" : undefined;
  const appHeaderEnd = <div className={headerUserClassName}>{headerEnd}</div>;
  return (
    <AppLayout headerEnd={appHeaderEnd} sidebarUser={sidebarUser}>
      <Suspense fallback={pageFallback}>
        <RequireAccess key={page}>{pageElement}</RequireAccess>
      </Suspense>
    </AppLayout>
  );
}

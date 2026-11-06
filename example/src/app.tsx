// app.tsx
// The whole example in ONE component. There is no router:
//   - signed out: the login page
//   - signed in:  the shell, and inside it the component for the current page
//
// The layout is optional: AppLayout (single, ready-made) or layout/main-layout.tsx (MainLayout, built from parts).
// The current page is the ?page query parameter (a menu href without the leading slash, for example ?page=profiles -> "/profiles").
// A menu click only changes ?page (no redirect, no reload); this component then shows another component.

import {
  ComingSoon,
  isDesktopSidebarSignal,
  PageNotFound,
  RequireAccess,
  SkeletonAuthForm,
  SkeletonPage,
  useCurrentPage,
} from "shared-lib-web";
import { AppLayout, AsideLayout, AuthLayout } from "shared-lib-web/layout";
import { Suspense, type ReactElement } from "react";
import { layoutChoiceSignal } from "./layout/layout-choice.ts";
import { MainLayout } from "./layout/main-layout.tsx";
import { HeaderUser } from "./modules/auth/login/components/header-user.tsx";
import { isLoggedIn } from "./modules/auth/login/hooks/service.ts";
import { LoginPage } from "./modules/auth/login/login.page.tsx";
import { DashboardPage } from "./modules/dashboard/dashboard.page.tsx";
import { UserPage } from "./modules/profiles/users/user.page.tsx";
import { SettingsPage } from "./modules/settings/settings.page.tsx";
import { FeedbackPage } from "./modules/showcase/feedback/feedback.page.tsx";
import { FormsPage } from "./modules/showcase/forms/forms.page.tsx";
import { OverlaysPage } from "./modules/showcase/overlays/overlays.page.tsx";

const headerEnd = <HeaderUser />;
const sidebarUser = <HeaderUser isInSidebar />;
const pageFallback = <SkeletonPage />;
const loginFallback = <SkeletonAuthForm />;
const comingSoon = <ComingSoon />;
const notFound = <PageNotFound />;

/** The component for each page value. The keys are the hrefs of the backend menu (nav/admin-nav.ts). */
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
  "/components/forms": <FormsPage />,
  "/components/overlays": <OverlaysPage />,
  "/components/feedback": <FeedbackPage />,
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
  const content = (
    <Suspense fallback={pageFallback}>
      <RequireAccess key={page}>{pageElement}</RequireAccess>
    </Suspense>
  );
  // The app shell is optional: the ready-made AppLayout, or a layout this project builds from single parts.
  if (layoutChoiceSignal.value === "main") {
    return <MainLayout headerEnd={headerEnd}>{content}</MainLayout>;
  }
  if (layoutChoiceSignal.value === "aside") {
    return <AsideLayout sidebarUser={sidebarUser}>{content}</AsideLayout>;
  }
  // On desktop in "sidebar" mode the user sits at the bottom of the side menu, so the header copy is hidden there.
  const headerUserClassName = isDesktopSidebarSignal.value ? "lg:hidden" : undefined;
  const appHeaderEnd = <div className={headerUserClassName}>{headerEnd}</div>;
  return (
    <AppLayout headerEnd={appHeaderEnd} sidebarUser={sidebarUser}>
      {content}
    </AppLayout>
  );
}

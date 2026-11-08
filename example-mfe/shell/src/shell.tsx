// shell.tsx — the shell UI in one file: provider, layout, login and home page.
//   signed out -> the auth MFE (env.mfe.js isAuth: true) in <div id="mfe-body" /> — the shell has NO login of its own
//   signed in  -> AppLayout (header, menu, user) or AsideLayout (menu only; picked on the Settings page), and in <main>:
//                   a page of the shell itself (SHELL_PAGES: "/dashboard" home, "/settings" settings),
//                   or the MFE of the current page (env.mfe.js) in <div id="mfe-body" />

import { useSignals } from "@preact/signals-react/runtime";
import {
  ComingSoon,
  ContentLayout,
  HeadLayout,
  PageLink,
  SharedWebUiProvider,
  UserMenu,
  authUserSignal,
  isAuthenticatedSignal,
  isDesktopSidebarSignal,
  useCurrentPage,
  useUi,
  layoutChoiceSignal,
} from "shared-lib-web";
import { AppLayout, AsideLayout } from "shared-lib-web/layout";
import { useEffect, type ComponentType, type ReactElement } from "react";
import { shellConfig } from "./config.ts";
import { attachMfeBody, findAuthRoute, findMfeRoute, mfeErrorSignal, readMfeRoutes, syncMfes, type MfeRoute } from "./mfe.ts";
import { signOut, startAppInit } from "./session.ts";
import { SettingsPage } from "./settings.page.tsx";

const RUN_ONCE: never[] = [];

/** The error box of an MFE that could not load (its server is not running, or the url in env.mfe.js is wrong). */
function MfeLoadError(props: { route: MfeRoute }) {
  return (
    <div role="alert" className="alert alert-error m-4 flex-col items-start">
      <b>{props.route.id} could not be loaded from {props.route.url}</b>
      <span className="text-sm">Is it running at that url (see shell/public/env.mfe.js)? Start it, then reload.</span>
    </div>
  );
}

// ---- Signed out: the auth MFE ----

/** Signed out: the whole screen is the auth MFE (it renders its own AuthLayout + login form). */
function SignedOutShell() {
  useSignals();
  const authRoute = findAuthRoute();
  const mfeError = mfeErrorSignal.value;
  const showError = Boolean(authRoute) && mfeError?.id === authRoute?.id;
  return (
    <>
      {authRoute ? null : <p className="alert alert-warning m-4">No auth MFE in env.mfe.js (an entry with isAuth: true).</p>}
      {showError && authRoute ? <MfeLoadError route={authRoute} /> : null}
      {/* The auth MFE (render: "mfe-body") mounts here while nobody is signed in. */}
      <div ref={attachMfeBody} />
    </>
  );
}

// ---- Home ("/dashboard"): a page of the shell itself, with links to the MFEs ----

function HomePage() {
  const { t } = useUi();
  const cards: ReactElement[] = [];
  for (const route of readMfeRoutes()) {
    if (route.path && !route.isAuth) {
      cards.push(
        <PageLink key={route.id} page={route.path} className="rounded-box border border-base-300 p-4 hover:bg-base-200">
          <span className="font-semibold">{route.id}</span>
          <span className="block truncate text-xs opacity-60" dir="ltr">{route.url}</span>
        </PageLink>,
      );
    }
  }
  return (
    <>
      <HeadLayout title={t("home.title")} />
      <ContentLayout>
        <p className="mb-4 opacity-70">{t("home.text")}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{cards}</div>
      </ContentLayout>
    </>
  );
}

// ---- The pages of the shell itself (not microfrontends) ----

/**
 * Pages the shell renders itself, by path (the menu hrefs). Everything else is an MFE of env.mfe.js, or ComingSoon.
 * Register a new shell page here: { "/reports": ReportsPage }.
 */
const SHELL_PAGES: Record<string, ComponentType> = {
  // With a token "/" goes to /dashboard (session.ts). Only a fallback: a dashboard MFE in env.mfe.js wins.
  "/dashboard": HomePage,
  "/settings": SettingsPage,
};

/** The shell page of a path: its component, or ComingSoon when the shell has none. */
function renderShellPage(page: string): ReactElement {
  const ShellPage = SHELL_PAGES[page];
  return ShellPage ? <ShellPage /> : <ComingSoon />;
}

// ---- Layout ----

function Shell() {
  useSignals();
  const page = useCurrentPage();
  const isSignedIn = isAuthenticatedSignal.value;
  // After the layout (with #mfe-body) is on screen, and after every sign in / out: let single-spa (un)mount MFEs.
  const signedInState = [isSignedIn];
  useEffect(syncMfes, signedInState);
  if (!isSignedIn) {
    return <SignedOutShell />;
  }
  const email = authUserSignal.value?.email ?? "";
  // An MFE of env.mfe.js wins over a shell page with the same path (single-spa mounts it anyway).
  const mfeRoute = findMfeRoute(page);
  const shellPage = renderShellPage(page);
  // Desktop with the side menu: the user sits at the bottom of the menu, so the header copy is hidden there.
  const headerUserClassName = isDesktopSidebarSignal.value ? "lg:hidden" : undefined;
  const headerEnd = (
    <div className={headerUserClassName}>
      <UserMenu name={email} email={email} onLogout={signOut} />
    </div>
  );
  const sidebarUser = <UserMenu isInSidebar name={email} email={email} onLogout={signOut} />;
  const mfeError = mfeErrorSignal.value;
  const showMfeError = Boolean(mfeRoute) && mfeError?.id === mfeRoute?.id;

  const pageContent = (
    <>
      {mfeRoute ? null : shellPage}
      {showMfeError && mfeRoute ? <MfeLoadError route={mfeRoute} /> : null}
      {/* Every page MFE of env.mfe.js (render: "mfe-body") mounts here, one at a time. */}
      <div ref={attachMfeBody} />
    </>
  );

  // The layout picked on the Settings page (ORG-LAYOUT_CHOICE): aside = menu only, no header, no mega menu.
  if (layoutChoiceSignal.value === "aside") {
    return <AsideLayout sidebarUser={sidebarUser}>{pageContent}</AsideLayout>;
  }
  return (
    <AppLayout headerEnd={headerEnd} sidebarUser={sidebarUser}>
      {pageContent}
    </AppLayout>
  );
}

/** The provider around the shell (type "shell": pages are paths; languages and menu are signals, see config.ts / session.ts). */
export function Root() {
  useEffect(startAppInit, RUN_ONCE);
  return (
    <SharedWebUiProvider type="shell" config={shellConfig}>
      <Shell />
    </SharedWebUiProvider>
  );
}

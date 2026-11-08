// shell.tsx — the shell UI in one file: provider, layout, login and home page.
//   signed out -> login page
//   signed in  -> AppLayout (header, menu, user) or AsideLayout (menu only; picked in the settings MFE), and in <main>:
//                   the shell's home page ("/"), or the MFE of the current page in <div id="mfe-body" />

import { useSignals } from "@preact/signals-react/runtime";
import { ConstKeys, RegExp } from "dff-util";
import {
  ComingSoon,
  ContentLayout,
  HeadLayout,
  PageLink,
  SharedWebUiProvider,
  TypeButton,
  TypeInput,
  UserMenu,
  authUserSignal,
  isAuthenticatedSignal,
  isDesktopSidebarSignal,
  useCurrentPage,
  useUi,
  layoutChoiceSignal,
} from "shared-lib-web";
import { AppLayout, AsideLayout, AuthLayout } from "shared-lib-web/layout";
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { shellConfig } from "./config.ts";
import { attachMfeBody, findMfeRoute, mfeErrorSignal, readMfeRoutes, syncMfes } from "./mfe.ts";
import { signIn, signOut, startAppInit } from "./session.ts";

/** Login email: required + a valid address (dff-util messages, translated in root.json). */
const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};

const RUN_ONCE: never[] = [];

// ---- Login ----

interface LoginFormType {
  email: string;
}

function handleLoginSubmit(values: LoginFormType): void {
  signIn(values.email);
}

function LoginPage() {
  const { t } = useUi();
  const formOptions = { defaultValues: { email: "" } };
  const form = useForm<LoginFormType>(formOptions);
  const onSubmit = form.handleSubmit(handleLoginSubmit);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-primary">{t("login.title")}</h1>
      <p className="mb-2 text-sm opacity-70">{t("login.hint")}</p>
      <TypeInput control={form.control} name="email" type="email" label={t("login.email")} rules={emailRules} />
      <TypeButton type="submit" icon="LogIn" label={t("login.submit")} isBlock />
    </form>
  );
}

// ---- Home ("/"): a page of the shell itself, with links to the MFEs ----

function HomePage() {
  const { t } = useUi();
  const cards: ReactElement[] = [];
  for (const route of readMfeRoutes()) {
    if (route.path) {
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

// ---- Layout ----

function Shell() {
  useSignals();
  const page = useCurrentPage();
  const isSignedIn = isAuthenticatedSignal.value;
  // After the layout (with #mfe-body) is on screen, and after every sign in / out: let single-spa (un)mount MFEs.
  const signedInState = [isSignedIn];
  useEffect(syncMfes, signedInState);
  if (!isSignedIn) {
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  }
  const email = authUserSignal.value?.email ?? "";
  const mfeRoute = findMfeRoute(page);
  const shellPage = page === "/" ? <HomePage /> : <ComingSoon />;
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
      {showMfeError ? (
        <div role="alert" className="alert alert-error flex-col items-start">
          <b>{mfeRoute?.id} could not be loaded from {mfeRoute?.url}</b>
          <span className="text-sm">Is it running at that url (see shell/public/env.mfe.js)? Start it, then click the menu again.</span>
        </div>
      ) : null}
      {/* Every page MFE of env.mfe.js (render: "mfe-body") mounts here, one at a time. */}
      <div ref={attachMfeBody} />
    </>
  );

  // The layout picked in the settings MFE (ORG-LAYOUT_CHOICE): aside = menu only, no header, no mega menu.
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

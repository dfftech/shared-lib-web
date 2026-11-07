// auth-layout.tsx
// Centered card layout for login, register and forgot-password pages.
//
//   <AuthLayout>
//     <LoginPage />
//   </AuthLayout>

import { Suspense, type ReactNode } from "react";
import { AppBrand } from "../components/app-brand.tsx";
import { LanguageSwitcher } from "../components/language-switcher.tsx";
import { ThemeSwitcher } from "../components/theme-switcher.tsx";
import { useUi } from "../context/use-ui.ts";
import { SkeletonAuthForm } from "../skeleton/skeleton-auth-form.tsx";

export interface AuthLayoutProps {
  /** The auth page, for example <LoginPage />. */
  children?: ReactNode;
}

export function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;
  useUi();
  const pageFallback = <SkeletonAuthForm />;

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="flex justify-end gap-1 p-3">
        <LanguageSwitcher isFullName />
        <ThemeSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body gap-4">
            <AppBrand className="justify-center" />
            <Suspense fallback={pageFallback}>{children}</Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

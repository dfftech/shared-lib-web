// settings.page.tsx — page layout only (HeadLayout + ContentLayout), no AppLayout.
import {
  AppStorage,
  ContentLayout,
  HeadLayout,
  LANG,
  THEME,
  TypeButton,
  TypeIcon,
  changeLanguage,
  changeNavigationMode,
  changeTheme,
  navigationModeSignal,
  readDataValue,
  useUi,
  type LanguageOption,
  type NavigationMode,
  type Theme,
} from "shared-lib-web";
import type { MouseEvent, ReactElement } from "react";
import type { MfeProps } from "../../shared/mfe-lifecycles.ts";
import { MfePage } from "../../shared/mfe-page.tsx";
import { layoutChoiceSignal, saveLayoutChoice, type LayoutChoice } from "../../shared/layout-choice.ts";

/** Language buttons carry the code in data-value. Saved as ORG-LANG. */
function handleLanguageClick(event: MouseEvent<HTMLButtonElement>): void {
  const code = readDataValue(event);
  void changeLanguage(code);
}

/** Layout buttons carry "app" or "aside". Saved as ORG-LAYOUT_CHOICE; the shell switches its layout. */
function handleLayoutClick(event: MouseEvent<HTMLButtonElement>): void {
  const choice = readDataValue(event) as LayoutChoice;
  saveLayoutChoice(choice);
}

/** Menu buttons carry "sidebar" or "megamenu". Saved as ORG-MENU_MODE; the shell menu switches. */
function handleMenuModeClick(event: MouseEvent<HTMLButtonElement>): void {
  const mode = readDataValue(event) as NavigationMode;
  changeNavigationMode(mode);
}

/** Theme buttons carry the theme in data-value. Saved as ORG-THEME. */
function handleThemeClick(event: MouseEvent<HTMLButtonElement>): void {
  const theme = readDataValue(event);
  changeTheme(theme);
}

function buildLanguageButtons(languages: LanguageOption[], activeCode: string): ReactElement[] {
  const buttons: ReactElement[] = [];
  for (const language of languages) {
    const isActive = language.code === activeCode;
    const label = `${language.flag ?? ""} ${language.label}`;
    const button = (
      <TypeButton
        key={language.code}
        size="sm"
        action={isActive ? "primary" : "ghost"}
        className={isActive ? undefined : "border border-base-300"}
        label={label}
        dataValue={language.code}
        onPress={handleLanguageClick}
      />
    );
    buttons.push(button);
  }
  return buttons;
}

function buildThemeButtons(themes: Theme[], activeTheme: Theme): ReactElement[] {
  const buttons: ReactElement[] = [];
  for (const theme of themes) {
    const isActive = theme === activeTheme;
    const button = (
      <button
        key={theme}
        type="button"
        className={isActive ? "btn btn-sm btn-primary gap-2 capitalize" : "btn btn-sm btn-ghost gap-2 border border-base-300 capitalize"}
        aria-pressed={isActive}
        data-value={theme}
        onClick={handleThemeClick}
      >
        <span data-theme={theme} className="flex gap-0.5 rounded bg-base-100 p-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-secondary" />
          <span className="size-2 rounded-full bg-accent" />
        </span>
        {theme}
      </button>
    );
    buttons.push(button);
  }
  return buttons;
}

function SettingsPage() {
  const { t, languages, locale, theme, lightThemes, darkThemes } = useUi();
  const languageButtons = buildLanguageButtons(languages, locale);
  const lightButtons = buildThemeButtons(lightThemes, theme);
  const darkButtons = buildThemeButtons(darkThemes, theme);
  // What the other MFEs will read (empty until the user picks something).
  const savedLanguage = AppStorage.getText(LANG) || "-";
  const savedTheme = AppStorage.getText(THEME) || "-";
  const savedParams = { lang: savedLanguage, theme: savedTheme };

  const layoutChoice = layoutChoiceSignal.value;
  const isAppLayout = layoutChoice === "app";
  const isSidebarMode = navigationModeSignal.value === "sidebar";

  return (
    <>
      <HeadLayout title={t("mfe.settings.title")} />
      <p className="text-sm opacity-70">{t("mfe.settings.text")}</p>
      <ContentLayout className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">{t("mfe.settings.layout")}</h3>
          <div className="join">
            <TypeButton
              size="sm"
              icon="LayoutTemplate"
              action={isAppLayout ? "primary" : "ghost"}
              className="join-item border border-base-300"
              label={t("mfe.settings.appLayout")}
              dataValue="app"
              onPress={handleLayoutClick}
            />
            <TypeButton
              size="sm"
              icon="PanelLeftDashed"
              action={isAppLayout ? "ghost" : "primary"}
              className="join-item border border-base-300"
              label={t("mfe.settings.asideLayout")}
              dataValue="aside"
              onPress={handleLayoutClick}
            />
          </div>
        </div>
        {/* The aside layout has no mega menu, so the menu navigation choice is only for the app layout. */}
        {isAppLayout ? (
          <div>
            <h3 className="mb-2 font-semibold">{t("mfe.settings.menu")}</h3>
            <div className="join">
              <TypeButton
                size="sm"
                icon="PanelLeft"
                action={isSidebarMode ? "primary" : "ghost"}
                className="join-item border border-base-300"
                label={t("mfe.settings.sidebar")}
                dataValue="sidebar"
                onPress={handleMenuModeClick}
              />
              <TypeButton
                size="sm"
                icon="PanelTop"
                action={isSidebarMode ? "ghost" : "primary"}
                className="join-item border border-base-300"
                label={t("mfe.settings.megaMenu")}
                dataValue="megamenu"
                onPress={handleMenuModeClick}
              />
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="mb-2 font-semibold">{t("mfe.settings.language")}</h3>
          <div className="flex flex-wrap gap-2">{languageButtons}</div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{t("mfe.settings.theme")}</h3>
          <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
            <TypeIcon name="Sun" size={14} />
            {t("ui.lightThemes")}
          </h4>
          <div className="mb-3 flex flex-wrap gap-2">{lightButtons}</div>
          <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
            <TypeIcon name="Moon" size={14} />
            {t("ui.darkThemes")}
          </h4>
          <div className="flex flex-wrap gap-2">{darkButtons}</div>
        </div>
        <p className="badge badge-ghost font-mono" dir="ltr">{t("mfe.settings.saved", savedParams)}</p>
      </ContentLayout>
    </>
  );
}

/** Root component of the settings MFE. */
export function SettingsMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  return (
    <MfePage isInShell={isInShell}>
      <SettingsPage />
    </MfePage>
  );
}

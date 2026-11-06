// settings.page.tsx — view only. Basic example: one language and no branches, so no language or store section.
import { ArticleLayout, ContentLayout, TypeButton, TypeIcon, type Theme } from "shared-lib-web";
import type { ReactElement } from "react";
import { handleSettingsMenuClick, handleSettingsNavigationClick, handleSettingsThemeClick, useSettings } from "./settings.page.ts";

/** One button per theme, with the theme's primary / secondary / accent colours. */
function buildThemeButtons(themes: Theme[], activeTheme: Theme): ReactElement[] {
  const buttons: ReactElement[] = [];
  for (const themeName of themes) {
    const isActive = themeName === activeTheme;
    const button = (
      <button
        key={themeName}
        type="button"
        className={isActive ? "btn btn-sm btn-primary gap-2 capitalize" : "btn btn-sm btn-ghost gap-2 border border-base-300 capitalize"}
        aria-pressed={isActive}
        data-value={themeName}
        onClick={handleSettingsThemeClick}
      >
        <span data-theme={themeName} className="flex gap-0.5 rounded bg-base-100 p-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-secondary" />
          <span className="size-2 rounded-full bg-accent" />
        </span>
        {themeName}
      </button>
    );
    buttons.push(button);
  }
  return buttons;
}

export function SettingsPage() {
  const {
    titleText,
    currentText,
    themeTitle,
    lightThemesTitle,
    darkThemesTitle,
    theme,
    lightThemes,
    darkThemes,
    navigationTitle,
    sidebarText,
    megaMenuText,
    navigationMode,
    hasMenu,
    menuTitle,
    menuOnText,
    menuOffText,
    isMenuVisible,
  } = useSettings();
  const isSidebarMode = navigationMode === "sidebar";
  const lightThemeButtons = buildThemeButtons(lightThemes, theme);
  const darkThemeButtons = buildThemeButtons(darkThemes, theme);

  return (
    <>
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">{titleText}</h2>
        <p className="mt-1 opacity-70">{currentText}</p>
      </ArticleLayout>
      <ContentLayout className="mt-4 space-y-6">
        {/* No menu items yet: no sidebar / mega menu choice. */}
        {hasMenu ? (
          <div>
            <h3 className="mb-2 font-semibold">{navigationTitle}</h3>
            <div className="join">
              <TypeButton
                action={isSidebarMode ? "primary" : "ghost"}
                size="sm"
                icon="PanelLeft"
                label={sidebarText}
                className="join-item border border-base-300"
                dataValue="sidebar"
                onPress={handleSettingsNavigationClick}
              />
              <TypeButton
                action={isSidebarMode ? "ghost" : "primary"}
                size="sm"
                icon="PanelTop"
                label={megaMenuText}
                className="join-item border border-base-300"
                dataValue="megamenu"
                onPress={handleSettingsNavigationClick}
              />
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="mb-2 font-semibold">{menuTitle}</h3>
          <div className="join">
            <TypeButton
              action={isMenuVisible ? "primary" : "ghost"}
              size="sm"
              icon="Eye"
              label={menuOnText}
              className="join-item border border-base-300"
              dataValue="on"
              onPress={handleSettingsMenuClick}
            />
            <TypeButton
              action={isMenuVisible ? "ghost" : "primary"}
              size="sm"
              icon="EyeOff"
              label={menuOffText}
              className="join-item border border-base-300"
              dataValue="off"
              onPress={handleSettingsMenuClick}
            />
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{themeTitle}</h3>
          <div className="space-y-3">
            <div>
              <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
                <TypeIcon name="Sun" size={14} />
                {lightThemesTitle}
              </h4>
              <div className="flex flex-wrap gap-2">{lightThemeButtons}</div>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
                <TypeIcon name="Moon" size={14} />
                {darkThemesTitle}
              </h4>
              <div className="flex flex-wrap gap-2">{darkThemeButtons}</div>
            </div>
          </div>
        </div>
      </ContentLayout>
    </>
  );
}

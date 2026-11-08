// settings-menu.tsx
// One settings button that opens a dialog with the language list (from config.languages),
// the theme list (from config.themes), the layout (App / Aside, when config.layout.showLayoutChoice) and the navigation
// style. The branches (when the app passes them)
// come first, titled with config.branchLabel.
// Used by the header when config.layout.headerSettings is "menu"; can also be placed anywhere.
// isInSidebar: a full-width "Settings" row for the sidebar (icon only on the collapsed rail, with a rail tooltip).
// In an AsideLayout the navigation style choice is hidden (no mega menu there).

import type { MouseEvent, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import { changeLanguage } from "../i18n/locale-service.ts";
import type { LanguageOption, NavigationMode, Theme } from "../interfaces/ui-config.ts";
import { changeLayoutChoice, layoutChoiceSignal, toLayoutChoice } from "../state/layout-choice-service.ts";
import { changeNavigationMode } from "../state/navigation-service.ts";
import {
  isAsideLayoutSignal,
  isRailEverywhereSignal,
  isSettingsOpenSignal,
  isSidebarCollapsedSignal,
  navigationModeSignal,
  navigationSignal,
} from "../state/signals.ts";
import { changeTheme } from "../theme/theme-service.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { TypeModal } from "../types/type.modal.tsx";
import { readDataValue } from "../utils/event-util.ts";
import { readLanguageLabel } from "./language-switcher.tsx";
import { DEFAULT_BRANCH_LABEL, readBranchName } from "./branch-switcher.tsx";
import type { BranchOption } from "../interfaces/app-types.ts";
import { branchesSignal, branchIdSignal, handleBranchSelect } from "../state/branch-service.ts";

export interface SettingsMenuProps {
  /** Show the sidebar / mega menu choice. Default true. Never shown without menu items or in an AsideLayout. */
  showNavigationMode?: boolean;
  /** Sidebar look: full-width row with the label; icon only on the collapsed rail. Default false. */
  isInSidebar?: boolean;
  /** Show the App layout / Aside layout choice. Default config.layout.showLayoutChoice (false). */
  showLayoutChoice?: boolean;
}

export function openSettings(): void {
  isSettingsOpenSignal.value = true;
}

export function closeSettings(): void {
  isSettingsOpenSignal.value = false;
}

/** Language buttons carry the code in data-value. */
export function handleSettingsLanguageSelect(event: MouseEvent<HTMLButtonElement>): void {
  const languageCode = readDataValue(event);
  void changeLanguage(languageCode);
}

/** Theme buttons carry the theme in data-value. */
export function handleSettingsThemeSelect(event: MouseEvent<HTMLButtonElement>): void {
  const themeName = readDataValue(event);
  changeTheme(themeName);
}

/** Navigation buttons carry "sidebar" or "megamenu" in data-value. */
export function handleSettingsNavigationSelect(event: MouseEvent<HTMLButtonElement>): void {
  const mode = readDataValue(event) as NavigationMode;
  changeNavigationMode(mode);
}

/** Layout buttons carry "app" or "aside" in data-value. Saved as LAYOUT_CHOICE; the app switches its layout. */
export function handleSettingsLayoutSelect(event: MouseEvent<HTMLButtonElement>): void {
  const value = readDataValue(event);
  const choice = toLayoutChoice(value);
  changeLayoutChoice(choice);
}

/** Builds one choice button. */
function buildChoice(
  value: string,
  label: string,
  isActive: boolean,
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void,
  isDisabled: boolean = false,
): ReactElement {
  const className = isActive ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost border border-base-300";
  return (
    <button key={value} type="button" className={className} aria-pressed={isActive} disabled={isDisabled} data-value={value} onClick={onSelect}>
      {label}
    </button>
  );
}

/** Builds the branch buttons (data-value = branch id). */
function buildBranchChoices(branches: BranchOption[], activeId: string): ReactElement[] {
  const choices: ReactElement[] = [];
  for (const branch of branches) {
    const name = readBranchName(branch);
    const isActive = branch.id === activeId;
    const choice = buildChoice(branch.id, name, isActive, handleBranchSelect, branch.isDisabled);
    choices.push(choice);
  }
  return choices;
}

/** Builds the language buttons. */
function buildLanguageChoices(languages: LanguageOption[], activeCode: string): ReactElement[] {
  const choices: ReactElement[] = [];
  for (const language of languages) {
    const label = readLanguageLabel(language);
    const isActive = language.code === activeCode;
    const choice = buildChoice(language.code, label, isActive, handleSettingsLanguageSelect);
    choices.push(choice);
  }
  return choices;
}

/** Builds the theme buttons, each with the theme's primary / secondary / accent colours. */
function buildThemeChoices(themes: Theme[], activeTheme: Theme): ReactElement[] {
  const choices: ReactElement[] = [];
  for (const themeName of themes) {
    const isActive = themeName === activeTheme;
    const className = isActive ? "btn btn-sm btn-primary gap-2" : "btn btn-sm btn-ghost gap-2 border border-base-300";
    const choice = (
      <button
        key={themeName}
        type="button"
        className={className}
        aria-pressed={isActive}
        data-value={themeName}
        onClick={handleSettingsThemeSelect}
      >
        <span data-theme={themeName} className="flex gap-0.5 rounded bg-base-100 p-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-secondary" />
          <span className="size-2 rounded-full bg-accent" />
        </span>
        {themeName}
      </button>
    );
    choices.push(choice);
  }
  return choices;
}

export function SettingsMenu(props: SettingsMenuProps) {
  const { isInSidebar = false } = props;
  const { t, config, languages, lightThemes, darkThemes, locale, theme } = useUi();
  const branches = branchesSignal.value;
  const hasBranches = branches.length > 0;
  const branchLabelKey = config.branchLabel ?? DEFAULT_BRANCH_LABEL;
  const branchTitle = t(branchLabelKey);
  const branchChoices = buildBranchChoices(branches, branchIdSignal.value);
  const isAsideLayout = isAsideLayoutSignal.value;
  // No menu (nav null / [] and no config.navigation): there is nothing to show as sidebar or mega menu.
  const hasMenu = navigationSignal.value.length > 0;
  const isNavigationModeAllowed = hasMenu && !isAsideLayout;
  const showNavigationMode = isNavigationModeAllowed && (props.showNavigationMode ?? true);
  const hasLanguages = languages.length > 1;
  const isCollapsed = isSidebarCollapsedSignal.value || isRailEverywhereSignal.value;
  const showLabel = isInSidebar && !isCollapsed;
  const isOpen = isSettingsOpenSignal.value;
  const navigationMode = navigationModeSignal.value;
  const settingsText = t("ui.settings");
  const languageChoices = buildLanguageChoices(languages, locale);
  const lightThemeChoices = buildThemeChoices(lightThemes, theme);
  const darkThemeChoices = buildThemeChoices(darkThemes, theme);
  const lightTitle = t("ui.lightThemes");
  const darkTitle = t("ui.darkThemes");
  const sidebarText = t("ui.sidebar");
  const megaMenuText = t("ui.megaMenu");
  const showLayoutChoice = props.showLayoutChoice ?? config.layout?.showLayoutChoice ?? false;
  const layoutChoice = layoutChoiceSignal.value;
  const appLayoutText = t("ui.appLayout");
  const asideLayoutText = t("ui.asideLayout");
  const appLayoutChoice = buildChoice("app", appLayoutText, layoutChoice === "app", handleSettingsLayoutSelect);
  const asideLayoutChoice = buildChoice("aside", asideLayoutText, layoutChoice === "aside", handleSettingsLayoutSelect);
  const sidebarChoice = buildChoice("sidebar", sidebarText, navigationMode === "sidebar", handleSettingsNavigationSelect);
  const megaMenuChoice = buildChoice("megamenu", megaMenuText, navigationMode === "megamenu", handleSettingsNavigationSelect);

  return (
    <>
      {isInSidebar ? (
        <div data-rail-tip={isCollapsed ? settingsText : undefined}>
          <button
            type="button"
            className={isCollapsed ? "btn btn-ghost w-full justify-center px-0" : "btn btn-ghost w-full justify-start gap-3"}
            aria-label={settingsText}
            onClick={openSettings}
          >
            <TypeIcon name="Settings" size={18} />
            {showLabel ? <span className="font-normal">{settingsText}</span> : null}
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={settingsText} title={settingsText} onClick={openSettings}>
          <TypeIcon name="Settings" size={18} />
        </button>
      )}
      <TypeModal isOpen={isOpen} title={settingsText} onClose={closeSettings}>
        <div className="flex flex-col gap-5">
          {hasBranches ? (
            <section>
              <h4 className="mb-2 text-sm font-semibold opacity-70">{branchTitle}</h4>
              <div className="flex flex-wrap gap-2">{branchChoices}</div>
            </section>
          ) : null}
          {hasLanguages ? (
            <section>
              <h4 className="mb-2 text-sm font-semibold opacity-70">{t("ui.language")}</h4>
              <div className="flex flex-wrap gap-2">{languageChoices}</div>
            </section>
          ) : null}
          <section>
            <h4 className="mb-2 text-sm font-semibold opacity-70">{t("ui.theme")}</h4>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {lightThemeChoices.length > 0 ? (
                <div>
                  <h5 className="mb-1 text-xs font-medium opacity-60">{lightTitle}</h5>
                  <div className="flex flex-wrap gap-2 capitalize">{lightThemeChoices}</div>
                </div>
              ) : null}
              {darkThemeChoices.length > 0 ? (
                <div>
                  <h5 className="mb-1 text-xs font-medium opacity-60">{darkTitle}</h5>
                  <div className="flex flex-wrap gap-2 capitalize">{darkThemeChoices}</div>
                </div>
              ) : null}
            </div>
          </section>
          {showLayoutChoice ? (
            <section>
              <h4 className="mb-2 text-sm font-semibold opacity-70">{t("ui.layout")}</h4>
              <div className="flex flex-wrap gap-2">
                {appLayoutChoice}
                {asideLayoutChoice}
              </div>
            </section>
          ) : null}
          {showNavigationMode ? (
            <section>
              <h4 className="mb-2 text-sm font-semibold opacity-70">{t("ui.navigationMode")}</h4>
              <div className="flex flex-wrap gap-2">
                {sidebarChoice}
                {megaMenuChoice}
              </div>
            </section>
          ) : null}
        </div>
      </TypeModal>
    </>
  );
}

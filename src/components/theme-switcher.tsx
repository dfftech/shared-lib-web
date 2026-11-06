// theme-switcher.tsx
// Dropdown that lists the DaisyUI themes from config.themes (light and dark ones in two groups) and switches the theme.

import type { MouseEvent, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import type { Theme } from "../interfaces/ui-config.ts";
import { changeTheme } from "../theme/theme-service.ts";
import { TypeIcon } from "../types/type.icon.ts";

/** Switches to the theme stored in the button's data-theme-name attribute. */
export function handleThemeButtonClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const themeName = button.dataset.themeName;
  if (!themeName) {
    return;
  }
  changeTheme(themeName);
}

/** Builds one menu entry per theme, each with a small colour preview. */
function buildThemeItems(themes: Theme[], activeTheme: Theme): ReactElement[] {
  const items: ReactElement[] = [];
  for (const themeName of themes) {
    const isActive = themeName === activeTheme;
    const item = (
      <li key={themeName}>
        <button
          type="button"
          className={isActive ? "menu-active capitalize" : "capitalize"}
          aria-current={isActive}
          data-theme-name={themeName}
          onClick={handleThemeButtonClick}
        >
          <span data-theme={themeName} className="flex gap-0.5 rounded bg-base-100 p-1" aria-hidden="true">
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-secondary" />
            <span className="size-2 rounded-full bg-accent" />
          </span>
          {themeName}
        </button>
      </li>
    );
    items.push(item);
  }
  return items;
}

export function ThemeSwitcher() {
  const { lightThemes, darkThemes, theme, t } = useUi();
  const themeText = t("ui.theme");
  const lightItems = buildThemeItems(lightThemes, theme);
  const darkItems = buildThemeItems(darkThemes, theme);
  const lightTitle = t("ui.lightThemes");
  const darkTitle = t("ui.darkThemes");

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm" aria-label={themeText}>
        <TypeIcon name="Palette" size={16} />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-40 mt-2 max-h-80 w-52 flex-nowrap overflow-y-auto p-2 shadow-lg"
      >
        {lightItems.length > 0 ? <li className="menu-title">{lightTitle}</li> : null}
        {lightItems}
        {darkItems.length > 0 ? <li className="menu-title">{darkTitle}</li> : null}
        {darkItems}
      </ul>
    </div>
  );
}

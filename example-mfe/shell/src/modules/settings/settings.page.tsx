// settings.page.tsx — view only: the shell's Settings page (a shell page, not an MFE), registered in SHELL_PAGES.
import { ContentLayout, HeadLayout, TypeButton, TypeIcon } from "shared-lib-web";
import type { ReactElement } from "react";
import { handleThemeClick, useSettingsPage, type LanguageButtonType, type ThemeButtonType } from "./settings.page.ts";

function buildLanguageElements(buttons: LanguageButtonType[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const button of buttons) {
    elements.push(<TypeButton key={button.code} {...button.props} />);
  }
  return elements;
}

/** A theme button with a swatch of the theme's own colours (data-theme on the swatch). */
function ThemeButton(props: ThemeButtonType) {
  const className = props.isActive
    ? "btn btn-sm btn-primary gap-2 capitalize"
    : "btn btn-sm btn-ghost gap-2 border border-base-300 capitalize";
  return (
    <button type="button" className={className} aria-pressed={props.isActive} data-value={props.theme} onClick={handleThemeClick}>
      <span data-theme={props.theme} className="flex gap-0.5 rounded bg-base-100 p-1" aria-hidden="true">
        <span className="size-2 rounded-full bg-primary" />
        <span className="size-2 rounded-full bg-secondary" />
        <span className="size-2 rounded-full bg-accent" />
      </span>
      {props.theme}
    </button>
  );
}

function buildThemeElements(buttons: ThemeButtonType[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const button of buttons) {
    elements.push(<ThemeButton key={button.theme} theme={button.theme} isActive={button.isActive} />);
  }
  return elements;
}

export function SettingsPage() {
  const model = useSettingsPage();
  const languageElements = buildLanguageElements(model.languageButtons);
  const lightElements = buildThemeElements(model.lightThemes);
  const darkElements = buildThemeElements(model.darkThemes);
  return (
    <>
      <HeadLayout title={model.titleText} />
      <p className="text-sm opacity-70">{model.introText}</p>
      <ContentLayout className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">{model.layoutTitle}</h3>
          <div className="join">
            <TypeButton {...model.appLayoutProps} />
            <TypeButton {...model.asideLayoutProps} />
          </div>
        </div>
        {model.showMenuChoice ? (
          <div>
            <h3 className="mb-2 font-semibold">{model.menuTitle}</h3>
            <div className="join">
              <TypeButton {...model.sidebarProps} />
              <TypeButton {...model.megaMenuProps} />
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="mb-2 font-semibold">{model.languageTitle}</h3>
          <div className="flex flex-wrap gap-2">{languageElements}</div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">{model.themeTitle}</h3>
          <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
            <TypeIcon name="Sun" size={14} />
            {model.lightTitle}
          </h4>
          <div className="mb-3 flex flex-wrap gap-2">{lightElements}</div>
          <h4 className="mb-1 flex items-center gap-1 text-sm opacity-70">
            <TypeIcon name="Moon" size={14} />
            {model.darkTitle}
          </h4>
          <div className="flex flex-wrap gap-2">{darkElements}</div>
        </div>
        <p className="badge badge-ghost font-mono" dir="ltr">{model.savedText}</p>
      </ContentLayout>
    </>
  );
}

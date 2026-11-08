# shared-lib-web – microfrontend example (single-spa + Vite + Tailwind)

Four separate Vite projects, each with its own `package.json`:

| Folder | Port | What |
| --- | --- | --- |
| `shell/` | 9000 | **The only app layout**: `AppLayout` or `AsideLayout` (from `ORG-LAYOUT_CHOICE`) (header with the settings dialog, side menu, user), single-spa, **no login of its own**, and its own pages: Home and **Settings** (layout app / aside, menu navigation sidebar / mega menu, language and theme — saved as `ORG-LAYOUT_CHOICE`, `ORG-MENU_MODE`, `ORG-LANG`, `ORG-THEME`) |
| `auth/` | 5186 (dev) / 5176 (built) | MFE: the login page (`AuthLayout` + form). The shell shows it while nobody is signed in, whatever the address |
| `forms/` | 5187 (dev) / 5177 (built) | MFE: form with a sticky `HeadLayout` (Cancel / Submit), validation, toast |
| `profile/` | 5188 (dev) / 5178 (built) | MFE: profile with a `TypeImage` avatar and an edit `TypeDrawer` |

```bash
node run-all.mjs install   # npm install in every folder   (or: npm run example-mfe:install from the repo root)
node run-all.mjs start     # npm run dev everywhere: shell 9000, MFEs 5187-5188 -> open http://localhost:9000
node run-all.mjs serve     # MFEs built + served on 5177-5178 (switch the urls in env.mfe.js), shell 9000
node run-all.mjs build     # production builds
```

Each folder also runs on its own:

| Folder | `npm run dev` | `npm run serve` (built) |
| --- | --- | --- |
| `shell/` | 9000 | – |
| `auth/` | 5186 – alone at `/`, or loaded by the shell from `/src/main.tsx` | 5176 `auth.js` |
| `forms/` | 5187 | 5177 `forms.js` |
| `profile/` | 5188 | 5178 `profile.js` |

`env.mfe.js` points at the dev servers (`http://localhost:5187/src/main.tsx` …). For the built files use the
`.js` urls (listed at the bottom of `env.mfe.js`); in production, the URLs of the deployed `dist/` files.

## The shell in 6 files (`shell/src/`)

| File | What |
| --- | --- |
| `config.ts` | App key, languages, themes, texts + the shell parts (company details = app name / logos / favicon, header settings, API URL, menu) |
| `session.ts` | Sign out and `navSignal` (the menu, filled after sign in) — signing in is the auth MFE's job |
| `mfe.ts` | Everything single-spa: reads `env.mfe.js`, registers the MFEs, `syncMfes()` |
| `shell.tsx` | The UI: provider, `AppLayout` with a plain `<div id="mfe-body" />`, home page, `SHELL_PAGES` (the shell's own pages); signed out = only `#mfe-body` with the auth MFE |
| `settings.page.tsx` | The Settings page (a shell page, not an MFE): layout, menu navigation, language, theme |
| `main.tsx` | Start: render |

## Addresses

The shell uses `layout.pageMode: "path"`, so every page is a real address:

| Page | Address |
| --- | --- |
| Home (a shell page) | `http://localhost:9000/` |
| Settings (a shell page) | `http://localhost:9000/settings` |
| Forms | `http://localhost:9000/forms` |
| Profile | `http://localhost:9000/profile` |

## Shell pages vs MFEs

`/` (Home) and `/settings` (Settings) are pages of the shell itself — clicking Settings in the menu stays in the
shell and shows `settings.page.tsx`. They are registered in `SHELL_PAGES` (`shell.tsx`); a shell page wins over an MFE
with the same path. Every other path is an MFE of `env.mfe.js` (or ComingSoon):

```tsx
const SHELL_PAGES: Record<string, ComponentType> = {
  "/": HomePage,
  "/settings": SettingsPage,
};
```

## Signed out: the auth MFE

The shell has no login page. The `env.mfe.js` entry with `isAuth: true` (no `path`) is active while nobody is signed in,
so `http://localhost:9000/forms` signed out shows the login, and after sign in the same address shows the forms MFE.

1. `auth/src/auth.page.tsx` signs in with the library: `startSession(token, user)`.
2. The library fires `SESSION_EVENT`; the shell's own library copy reads the token and user from sessionStorage
   (same page, same `ORG-` keys) — `isAuthenticatedSignal` turns true in the shell.
3. The shell renders its layout, loads the menu, and single-spa unmounts the auth MFE and mounts the page MFE.
4. Sign out in the shell's user menu → `SESSION_EVENT` again → the auth MFE comes back.

The auth MFE also sets `loadCompanyDetails`, so its login page shows the brand (logo, app name, favicon).

## Routing: `shell/public/env.mfe.js`

```js
window.envMfe = [
  { id: "@org/auth",     isAuth: true,       url: "http://localhost:5176/auth.js",     render: "mfe-body" },
  { id: "@org/forms",    path: "/forms",    url: "http://localhost:5177/forms.js",    render: "mfe-body" },
  { id: "@org/profile",  path: "/profile",  url: "http://localhost:5178/profile.js",  render: "mfe-body" },
];
```

- `id` – single-spa application name · `path` – the address (`http://localhost:9000/forms` → `/forms`) · `url` – the MFE build ·
  `render` – a **fixed slot of the shell layout**; the MFE mounts there.
- The places are part of the shell layout, not of the config: `shell.tsx` has a plain `<div id="mfe-body" />` inside
  `AppLayout`'s `<main>`. All page MFEs share `mfe-body` (one at a time; single-spa unmounts the old one first).
  `syncMfes()` runs in an effect after that div is on screen (and after every sign in / out).
- A widget (a small part of the page) gets its own fixed slot in the layout, for example
  `<div id="mfe-header-widget" />` in the header, and an entry **without `path`** — it is on whenever the user
  is signed in: `{ id: "@org/clock", url: ".../clock.js", render: "mfe-header-widget" }`.
- The file is loaded by `shell/index.html` before the app, so each environment can change it without a rebuild.
- `shell/src/mfe.ts` registers every entry: active when signed in and the address is its path; the module
  is imported from its `url` the first time; `render` goes to the MFE as `customProps.domElementId`.

## Session → menu (a signal)

`shell/src/session.ts` has `navSignal`, passed in the config as `loadMenuNavigation: navSignal`; the provider shows
every new value at once (`null` = menu skeleton). `startMenuSync()` (started in `shell.tsx`) fills it:

- start: the provider restores `ORG-TOKEN` / `ORG-AUTH_USER` from sessionStorage → signed in → menu request
- sign in in the **auth MFE** (`startSession` there) → `SESSION_EVENT` → the shell's library copy reads the session → menu request
- sign out (`signOut`, the shell's user menu) → `navSignal` back to `null`, page MFE unmounted, auth MFE mounted again

## Every project stands alone (no shared folder)

The shell and each MFE have their own copies of what they need, so each one can live in its own repository and
build with its own Docker context:

| File | shell | auth | forms | profile |
| --- | --- | --- | --- | --- |
| `src/config.ts` (app key `ORG`, `MsUrl` main / sor / utils, signals: `localeSignal`, `themesSignal`, `supportLangSignal`) | ✓ (+ shell parts, `navSignal`, `companySignal`) | ✓ (+ `companySignal`) | ✓ | ✓ |
| `fake-api.ts` + `fake-api/` (fake sor backend, Vite plugin) | ✓ | ✓ (alone) | ✓ (alone) | ✓ (alone) |
| `fake-api/locales/<code>.json` (texts, groups inside) | `app`, `ui`, `root`, `login`, `home` + every MFE group | `ui`, `root`, `login` | `ui`, `root`, `forms` | `ui`, `root`, `profile` |
| `fake-api/themes.json`, `fake-api/languages.json` | ✓ | ✓ | ✓ | ✓ |
| `fake-api/company-details.json`, `fake-api/menu-access.json` | ✓ | `company-details.json` (alone) | – | – |
| `src/mfe-page.tsx`, `src/mfe-lifecycles.ts` | – | ✓ | ✓ | ✓ |

Everything comes from **sor** (`MsUrl.sor` → `/api/org-sor`): `/company-details`, `/load/LANG?active=true`,
`/content-load?query=theme`, `/content-load?query=locales.<code>`, `/authorization/<persona>?roles=<roles>` (menu).
Inside the shell an MFE asks the shell's `/api`, so the shell's fake locale files hold every MFE group too.

Keep the common parts the same in every project: `appNameKey` (`ORG`, so all read the same `ORG-THEME` / `ORG-LANG` /
`ORG-LAYOUT_CHOICE`) and the sor data (themes, languages).

**Everything loaded is a signal** in every config: `loadLocale: localeSignal` (texts per language, filled with
`fillLocaleBundle`), `loadThemes: themesSignal` (sor `/content-load?query=theme`, an object keyed by theme name) and
`loadSupportLanguages: supportLangSignal`; the shell also `loadCompanyDetails: companySignal` (the brand — no appName /
logos in its config; MFEs do not load it). The
shell fills them in `session.ts`, each MFE in `startConfigData()` (`config.ts`, started by `mfe-page.tsx`).

**Languages** (`supportLangSignal`) come from
sor `/load/LANG?active=true` (the shell in `session.ts`, each MFE in `startConfigData()`). Inside the shell the MFE asks
the shell's site (`/api` is relative to the page); alone it uses its own fake backend.

**Layout choice** (app / aside) lives in the library: `layoutChoiceSignal` and `changeLayoutChoice()`. The shell's
Settings page calls `changeLayoutChoice`, the shell renders `AppLayout` or `AsideLayout` from `layoutChoiceSignal`, and every MFE's
`mfe-page.tsx` copies it into `isAsideLayoutSignal` (HeadLayout below the header, or at the very top). No
layout-choice file in the projects.

Texts come from sor `/content-load?query=locales.<code>` (the groups inside: `{ "ui": {...}, "settings": {...} }`),
only for the languages the library asks for:

```ts
async function loadTexts(languageCode: string): Promise<LocaleModule> {
  const query = `locales.${languageCode}`;
  const reply = await AppHttp.Get(`${MsUrl.sor}/content-load`, { query: query });
  const messages = readContent(reply, query);
  return messages as LocaleModule;
}
fillLocaleBundle(localeSignal, loadTexts);
```

## Theme and language

Every MFE renders `<SharedWebUiProvider type="mfe" config={config}>` (its own `src/config.ts`) (no app layout, only page layouts; no menu or
branch calls), which
applies `ORG-THEME` / `ORG-LANG` from localStorage when it mounts. Each MFE bundles its own copy of the library, so
the library fires a window event when a preference is saved (`PREFERENCE_EVENT`); every copy follows it at once:
change the language in the shell's settings dialog and the open MFE switches too (and the other way round).
The same works for the layout and the menu mode: pick "Aside layout" or "Mega menu" on the Settings page and the shell switches at once (the open MFEs follow). `#mfe-body` is one element that moves between the two layouts, so the open MFE stays mounted.

## Builds

Each MFE builds as ONE ES module + CSS (`dist/forms.js`, `dist/forms.css`) with React and shared-lib-web bundled in.
The MFE loads its CSS itself before its first mount. Deploy the `dist/` folders anywhere and put their URLs in
`env.mfe.js`.

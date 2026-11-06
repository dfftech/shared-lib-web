# shared-lib-web – microfrontend example (single-spa + Vite + Tailwind)

Four separate Vite projects, each with its own `package.json`:

| Folder | Port | What |
| --- | --- | --- |
| `shell/` | 5175 | **The only app layout**: `AppLayout` or `AsideLayout` (from `ORG-LAYOUT_CHOICE`) (header with the settings dialog, side menu, user), login, single-spa |
| `settings/` | 5186 (dev) / 5176 (built) | MFE: layout (app / aside), menu navigation (sidebar / mega menu), language and theme (saved as `ORG-LAYOUT_CHOICE`, `ORG-MENU_MODE`, `ORG-LANG`, `ORG-THEME`) |
| `forms/` | 5187 (dev) / 5177 (built) | MFE: form with a sticky `HeadLayout` (Cancel / Submit), validation, toast |
| `profile/` | 5188 (dev) / 5178 (built) | MFE: profile with a `TypeImage` avatar and an edit `TypeDrawer` |
| `shared/` | – | Files every project imports: `config.ts`, locales, org themes, MFE helpers |

```bash
node run-all.mjs install   # npm install in every folder   (or: npm run example-mfe:install from the repo root)
node run-all.mjs start     # npm run dev everywhere: shell 5175, MFEs 5186-5188 -> open http://localhost:5175
node run-all.mjs serve     # MFEs built + served on 5176-5178 (switch the urls in env.mfe.js), shell 5175
node run-all.mjs build     # production builds
```

Each folder also runs on its own:

| Folder | `npm run dev` | `npm run serve` (built) |
| --- | --- | --- |
| `shell/` | 5175 | – |
| `settings/` | 5186 – alone at `/`, or loaded by the shell from `/src/main.tsx` | 5176 `settings.js` |
| `forms/` | 5187 | 5177 `forms.js` |
| `profile/` | 5188 | 5178 `profile.js` |

`env.mfe.js` points at the dev servers (`http://localhost:5186/src/main.tsx` …). For the built files use the
`.js` urls (listed at the bottom of `env.mfe.js`); in production, the URLs of the deployed `dist/` files.

## The shell in 5 files (`shell/src/`)

| File | What |
| --- | --- |
| `config.ts` | The shared config + the shell parts (logo, header settings, API URL) |
| `session.ts` | Sign in / out and the menu (event based, see below) |
| `mfe.ts` | Everything single-spa: reads `env.mfe.js`, registers the MFEs, `syncMfes()` |
| `shell.tsx` | The UI: provider, `AppLayout` with a plain `<div id="mfe-body" />`, login page, home page |
| `main.tsx` | Start: listen for the session event, render |

## Addresses

The shell uses `layout.pageMode: "path"`, so every page is a real address:

| Page | Address |
| --- | --- |
| Home (the shell's own page) | `http://localhost:5175/` |
| Settings | `http://localhost:5175/settings` |
| Forms | `http://localhost:5175/forms` |
| Profile | `http://localhost:5175/profile` |

## Routing: `shell/public/env.mfe.js`

```js
window.envMfe = [
  { id: "@org/settings", path: "/settings", url: "http://localhost:5176/settings.js", render: "mfe-body" },
  { id: "@org/forms",    path: "/forms",    url: "http://localhost:5177/forms.js",    render: "mfe-body" },
  { id: "@org/profile",  path: "/profile",  url: "http://localhost:5178/profile.js",  render: "mfe-body" },
];
```

- `id` – single-spa application name · `path` – the address (`http://localhost:5175/forms` → `/forms`) · `url` – the MFE build ·
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

## Session → menu (event based)

`shell/src/session.ts`: when user info is in the session a window event `org:session` is fired
and the shell then requests the menu.

- start: the provider restores `ORG-TOKEN` / `ORG-AUTH_USER` from sessionStorage → user found → event → menu
- sign in (shell login, or any MFE: `window.dispatchEvent(new CustomEvent("org:session"))`) → event → menu
- sign out → menu cleared, MFE unmounted

## Theme and language

Every MFE renders `<SharedWebUiProvider config={sharedConfig} nav={[]}>` (no app layout, only page layouts), which
applies `ORG-THEME` / `ORG-LANG` from localStorage when it mounts. Each MFE bundles its own copy of the library, so
the library fires a window event when a preference is saved (`PREFERENCE_EVENT`); every copy follows it at once:
change the language in the shell's settings dialog and the open MFE switches too (and the other way round).
The same works for the layout and the menu mode: pick "Aside layout" or "Mega menu" in the settings MFE and the shell switches at once. `#mfe-body` is one element that moves between the two layouts, so the open MFE stays mounted.

## Builds

Each MFE builds as ONE ES module + CSS (`dist/forms.js`, `dist/forms.css`) with React and shared-lib-web bundled in.
The MFE loads its CSS itself before its first mount. Deploy the `dist/` folders anywhere and put their URLs in
`env.mfe.js`.

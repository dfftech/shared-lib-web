// env.mfe.js — the routing config of the shell (no build needed: change it on the server per environment).
// One entry per microfrontend:
//   id      single-spa application name
//   path    the address that shows it: http://localhost:9000/settings -> "/settings" (leave it out: a widget, always on)
//   url     where its code is served
//   render  id of a FIXED slot in the shell layout; the MFE mounts there. The page MFEs share "mfe-body"
//           (one at a time); a widget would use its own slot, for example "mfe-header-widget".
//
// Development: each MFE runs "npm run dev" (Vite dev server, hot reload) and the url is its src/main.tsx:
window.envMfe = [
  { id: "@org/settings", path: "/settings", url: "http://localhost:5186/src/main.tsx", render: "mfe-body" },
  { id: "@org/forms", path: "/forms", url: "http://localhost:5187/src/main.tsx", render: "mfe-body" },
  { id: "@org/profile", path: "/profile", url: "http://localhost:5188/src/main.tsx", render: "mfe-body" },
];

// Built MFEs ("npm run serve" in each folder, or the deployed dist/ files) — use these urls instead:
//   http://localhost:5176/settings.js   http://localhost:5177/forms.js   http://localhost:5178/profile.js

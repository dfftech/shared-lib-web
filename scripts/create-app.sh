#!/usr/bin/env bash
# create-app.sh — creates a new React + Vite app (its own git repo) that uses shared-lib-web, with all themes:
#   the 2 custom themes as JSON (org-light, org-dark) + all 35 DaisyUI 5 themes, AppLayout, side menu, 2 sample pages.
#
# Usage:
#   bash create-app.sh <path> <name>
#     path   parent folder, for example ~/work/github (created when missing)
#     name   module / app name, for example my-app  -> creates <path>/<name>
# shared-lib-web is installed from npm (npm i shared-lib-web).
#
# Example: bash create-app.sh ~/work/github my-app
# Then:    cd ~/work/github/my-app && npm run dev

set -euo pipefail

BASE_PATH="${1:-}"
APP_NAME="${2:-}"

if [ -z "$BASE_PATH" ] || [ -z "$APP_NAME" ]; then
  echo "Usage: bash create-app.sh <path> <name>" >&2
  echo "  e.g. bash create-app.sh ~/work/github my-app" >&2
  exit 1
fi
# npm package names: lowercase letters, digits, - . _
if ! echo "$APP_NAME" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  echo "Name '$APP_NAME' must be lowercase (letters, digits, - . _), for example my-app." >&2
  exit 1
fi
mkdir -p "$BASE_PATH"
APP_DIR="$(cd "$BASE_PATH" && pwd)/$APP_NAME"
if [ -e "$APP_DIR" ]; then
  echo "Folder '$APP_DIR' already exists." >&2
  exit 1
fi

# Storage / env key: MY-APP -> MYAPP (storage keys become MYAPP-THEME, MYAPP-LANG ...)
APP_KEY="$(echo "$APP_NAME" | tr '[:lower:]' '[:upper:]' | tr -cd 'A-Z0-9')"

echo "Creating $APP_NAME (key $APP_KEY) ..."
mkdir -p "$APP_DIR/src/pages" "$APP_DIR/src/theme" "$APP_DIR/public"
cd "$APP_DIR"

# ---------------------------------------------------------------- package.json
cat > package.json <<EOF
{
  "name": "$APP_NAME",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
EOF

# ---------------------------------------------------------------- .gitignore
cat > .gitignore <<'EOF'
node_modules/
dist/
*.tsbuildinfo
.env
.env.*
!.env.example
npm-debug.log*
.vite/
.DS_Store
Thumbs.db
.idea/
.vscode/
EOF

# ---------------------------------------------------------------- vite / ts / html
cat > vite.config.ts <<'EOF'
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // dff-util expects Node's "global" object.
  define: { global: "globalThis" },
});
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
EOF

cat > index.html <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$APP_NAME</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ---------------------------------------------------------------- styles: Tailwind + library + all themes
cat > src/index.css <<'EOF'
/* index.css — Tailwind, the library classes and all 35 DaisyUI themes.
   The custom org themes are JSON (src/theme/org-themes.json -> config.loadThemes): no CSS needed. */
@import "tailwindcss";
@import "shared-lib-web/styles.css";

@plugin "daisyui" {
  themes: all;
}
EOF

# Custom themes as data: an object keyed by theme name, each { isDark, name, variables } (the DaisyUI theme variables).
# Listed first in the switcher.
cat > src/theme/org-themes.json <<'EOF'
{
  "org-dark": {
    "isDark": true,
    "name": "org-dark",
    "variables": {
      "border": "1px",
      "color-accent": "oklch(70.4% 0.04 256.8)",
      "color-accent-content": "oklch(12.9% 0.042 264.7)",
      "color-base-100": "oklch(25.5% 0.04 264.5)",
      "color-base-200": "oklch(20.8% 0.042 265.8)",
      "color-base-300": "oklch(32% 0.04 262)",
      "color-base-content": "oklch(92.9% 0.013 255.5)",
      "color-error": "oklch(70.4% 0.191 22.2)",
      "color-error-content": "oklch(25.8% 0.092 26)",
      "color-info": "oklch(78.9% 0.154 211.5)",
      "color-info-content": "oklch(30.2% 0.056 229.7)",
      "color-neutral": "oklch(37.2% 0.044 257.3)",
      "color-neutral-content": "oklch(96.8% 0.007 247.9)",
      "color-primary": "oklch(74.6% 0.16 232.7)",
      "color-primary-content": "oklch(29.3% 0.066 243.2)",
      "color-secondary": "oklch(82.8% 0.189 84.4)",
      "color-secondary-content": "oklch(27.9% 0.077 45.6)",
      "color-success": "oklch(79.2% 0.209 151.7)",
      "color-success-content": "oklch(26.6% 0.065 152.9)",
      "color-warning": "oklch(75% 0.183 55.9)",
      "color-warning-content": "oklch(26.6% 0.079 36.3)",
      "depth": "1",
      "noise": "0",
      "radius-box": "0.75rem",
      "radius-field": "0.5rem",
      "radius-selector": "1rem",
      "size-field": "0.25rem",
      "size-selector": "0.25rem"
    }
  },
  "org-light": {
    "isDark": false,
    "name": "org-light",
    "variables": {
      "border": "1px",
      "color-accent": "oklch(55.4% 0.046 257.4)",
      "color-accent-content": "oklch(98.4% 0.003 247.9)",
      "color-base-100": "oklch(100% 0 0)",
      "color-base-200": "oklch(96.8% 0.007 247.9)",
      "color-base-300": "oklch(92.9% 0.013 255.5)",
      "color-base-content": "oklch(20.8% 0.042 265.8)",
      "color-error": "oklch(55% 0.23 27.3)",
      "color-error-content": "oklch(97.1% 0.013 17.4)",
      "color-info": "oklch(71.5% 0.143 215.2)",
      "color-info-content": "oklch(30.2% 0.056 229.7)",
      "color-neutral": "oklch(27.9% 0.041 260)",
      "color-neutral-content": "oklch(98.4% 0.003 247.9)",
      "color-primary": "oklch(55.8% 0.154 249.1)",
      "color-primary-content": "oklch(98.5% 0.01 240)",
      "color-secondary": "oklch(76.9% 0.188 70.1)",
      "color-secondary-content": "oklch(27.9% 0.077 45.6)",
      "color-success": "oklch(52.7% 0.154 150.1)",
      "color-success-content": "oklch(98.2% 0.018 155.8)",
      "color-warning": "oklch(75% 0.183 55.9)",
      "color-warning-content": "oklch(26.6% 0.079 36.3)",
      "depth": "1",
      "noise": "0",
      "radius-box": "0.75rem",
      "radius-field": "0.5rem",
      "radius-selector": "1rem",
      "size-field": "0.25rem",
      "size-selector": "0.25rem"
    }
  }
}
EOF

# Company details (brand): config.loadCompanyDetails reads this file. Add "logoUrl", "logoDarkUrl", "faviconUrl" when you have them.
cat > public/company-details.json <<EOF
{
  "appName": "$APP_NAME",
  "companyName": "$APP_NAME"
}
EOF

# ---------------------------------------------------------------- app code
cat > src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

cat > src/config.ts <<EOF
// config.ts — app settings and the menu.
import type { CustomThemesModule, UiConfig } from "shared-lib-web";

/** The custom org themes (theme/org-themes.json), loaded lazily like the locale files. */
function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

/** The company details (app name, company name, favicon, logos): public/company-details.json — replace with your API. */
async function loadCompanyDetails(): Promise<unknown> {
  const response = await fetch("/company-details.json");
  return response.json();
}

export const config: UiConfig = {
  appNameKey: "$APP_KEY", // storage keys: $APP_KEY-THEME, $APP_KEY-LANG ...
  // The brand (appName, logoUrl, logoDarkUrl, faviconUrl, companyName) comes from the company details, not this config.
  loadCompanyDetails: loadCompanyDetails,
  // Themes: the custom org themes (loadThemes -> theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: loadThemes,
  homePath: "/",
  layout: { menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu" },
  // A fixed menu. With a backend and a login use  loadMenuNavigation: () => AppHttp.Get("/app-api/menu-access")  instead
  // (the provider calls it after sign in; also loadSupportLanguages and loadBranches).
  navigation: [
    { id: "home", labelKey: "Home", path: "/", icon: "House" },
    { id: "users", labelKey: "Users", path: "/users", icon: "Users" },
  ],
};
EOF

cat > src/pages/home.page.tsx <<'EOF'
// home.page.tsx
import { HeadLayout, TypeButton } from "shared-lib-web";

export function HomePage() {
  const actions = <TypeButton label="Save" icon="Save" />;
  return (
    <>
      <HeadLayout title="Home" actions={actions} />
      <div className="card bg-base-100 p-6 shadow-sm">Hello from shared-lib-web. Pick a theme with the settings (gear) icon.</div>
    </>
  );
}
EOF

cat > src/pages/users.page.tsx <<'EOF'
// users.page.tsx
import { HeadLayout } from "shared-lib-web";

export function UsersPage() {
  return (
    <>
      <HeadLayout title="Users" />
      <div className="card bg-base-100 p-6 shadow-sm">Users list</div>
    </>
  );
}
EOF

cat > src/app.tsx <<'EOF'
// app.tsx — provider + layout + the page for the current URL (?page=users -> "/users").
import { PageNotFound, SharedWebUiProvider, useCurrentPage } from "shared-lib-web";
import { AppLayout } from "shared-lib-web/layout";
import { config } from "./config.ts";
import { HomePage } from "./pages/home.page.tsx";
import { UsersPage } from "./pages/users.page.tsx";

function Pages() {
  const page = useCurrentPage();
  if (page === "/") return <HomePage />;
  if (page === "/users") return <UsersPage />;
  return <PageNotFound />;
}

export function App() {
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <AppLayout>
        <Pages />
      </AppLayout>
    </SharedWebUiProvider>
  );
}
EOF

cat > src/main.tsx <<'EOF'
// main.tsx — entry.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
EOF

cat > README.md <<EOF
# $APP_NAME

React + Vite app built with [shared-lib-web](https://www.npmjs.com/package/shared-lib-web).

\`\`\`bash
npm install
npm run dev     # start
npm run build   # -> dist/
\`\`\`

- Themes: \`src/theme/org-themes.json\` (custom, as JSON) + all 35 DaisyUI themes
- Settings and menu: \`src/config.ts\`
- Pages: \`src/pages/\`, wired in \`src/app.tsx\`
EOF

# ---------------------------------------------------------------- install
echo "Installing packages ..."
npm i shared-lib-web
npm install --save react react-dom @preact/signals-react react-hook-form lucide-react dff-util @uiw/react-md-editor
npm install --save-dev vite @vitejs/plugin-react tailwindcss @tailwindcss/vite daisyui typescript @types/react @types/react-dom

# ---------------------------------------------------------------- git
if command -v git >/dev/null 2>&1; then
  git init -q
  git add -A
  git commit -q -m "Initial app from shared-lib-web create-app.sh" || true
fi

echo ""
echo "Done. Next:"
echo "  cd $APP_DIR"
echo "  npm run dev"

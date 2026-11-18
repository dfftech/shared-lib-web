#!/usr/bin/env python3
# build-shell-script.py — turns the examples into ONE stand-alone bash script (mfe-shell-web.sh) that creates a
# shared-lib-web project of the type the user picks:
#   spa    a normal single app          <- example-basic       (login, dashboard, users, settings; ?page=...)
#   shell  the root that hosts MFEs     <- example-mfe/shell   (AppLayout / AsideLayout, single-spa, env.mfe.js)
#   mfe    a microfrontend              <- example-mfe/forms   (single-spa lifecycles, runs alone with npm run dev)
#
#   python3 scripts/build-shell-script.py [out-file]      (default: dist-scripts/mfe-shell-web.sh)
#
# The generated projects stand alone: shared-lib-web comes from npm (npm i shared-lib-web), no alias to the library
# source. Text files become quoted heredocs, images base64. Placeholders filled by the script at run time:
#   %%APP_NAME%%    project name (package.json, <title>, README, MFE file name)
#   %%BASE_NAME%%   app key / base name: APP_NAME_KEY, storage keys (BASE-TOKEN ...), window.env REACT_APP_BASE_...
#   %%BASE_LOWER%%  the base name in lowercase (single-spa ids "@base/forms")
#   %%PORT%%        dev server port            %%PREVIEW_PORT%%  port of "npm run serve" (mfe)
# Run it again after changing an example, so the script stays the same as the examples.

import base64
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / "dist-scripts" / "mfe-shell-web.sh"

SOURCES = {
    "spa": REPO / "example-basic",
    "shell": REPO / "example-mfe" / "shell",
    "mfe": REPO / "example-mfe" / "forms",
}

IMAGE_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp"}
SKIP_PARTS = {"node_modules", "dist", ".git", ".vite"}
SKIP_FILES = {"package-lock.json", "bun.lock", "package.json", "vite.config.ts", "tsconfig.json", ".DS_Store"}

# ------------------------------------------------------------------ common templates

GITIGNORE = """node_modules/
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
"""

TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "vite.config.ts"]
}
"""

# ------------------------------------------------------------------ spa

SPA_PACKAGE = """{
  "name": "%%APP_NAME%%",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "description": "App built with shared-lib-web: AppLayout, login, pages by ?page=..., themes, languages.",
  "scripts": {
    "dev": "vite --port %%PORT%%",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --port %%PORT%%",
    "typecheck": "tsc -p tsconfig.json"
  }
}
"""

SPA_VITE = """// vite.config.ts — %%APP_NAME%% (a normal app).
//   npm run dev     -> http://localhost:%%PORT%%
//   npm run build   -> dist/
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const reactPlugin = react();
const tailwindPlugin = tailwindcss();

export default defineConfig({
  // dff-util expects Node's "global" object.
  define: { global: "globalThis" },
  plugins: [reactPlugin, tailwindPlugin],
});
"""

SPA_README = """# %%APP_NAME%%

App (type **spa**) built with [shared-lib-web](https://www.npmjs.com/package/shared-lib-web).
App key (base name): **%%BASE_NAME%%** — storage keys `%%BASE_NAME%%-TOKEN`, `%%BASE_NAME%%-LANG` ...

```bash
npm install
npm run dev      # http://localhost:%%PORT%%
npm run build    # -> dist/
```

- `public/env.js` — runtime settings: `REACT_APP_%%BASE_NAME%%_API_BASE_URL` (no rebuild needed)
- `src/config.ts` — the app config (app key, languages, themes, layout, http, menu)
- `src/modules/<module>/` — pages: `<module>.page.tsx`, `components/`, `hooks/`
"""

# ------------------------------------------------------------------ shell

SHELL_PACKAGE = """{
  "name": "%%APP_NAME%%",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "description": "MFE shell built with shared-lib-web: AppLayout / AsideLayout (header, menu, user), single-spa routing from public/env.mfe.js.",
  "scripts": {
    "dev": "vite --port %%PORT%% --strictPort",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --port %%PORT%% --strictPort",
    "typecheck": "tsc -p tsconfig.json"
  }
}
"""

SHELL_VITE = """// vite.config.ts — the MFE shell %%APP_NAME%% (a normal app, not a library build).
//   npm run dev   -> http://localhost:%%PORT%%   (start the MFEs first; their urls are in public/env.mfe.js)
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const reactPlugin = react();
const tailwindPlugin = tailwindcss();

export default defineConfig({
  // dff-util expects Node's "global" object.
  define: { global: "globalThis" },
  plugins: [reactPlugin, tailwindPlugin],
});
"""

SHELL_README = """# %%APP_NAME%%

MFE shell (type **shell**) built with [shared-lib-web](https://www.npmjs.com/package/shared-lib-web) and single-spa.
App key (base name): **%%BASE_NAME%%** — use the SAME base name in every MFE, so they share the theme, language and session.

```bash
npm install
npm run dev      # http://localhost:%%PORT%%
npm run build    # -> dist/
```

- `public/env.js` — runtime settings: `REACT_APP_%%BASE_NAME%%_API_BASE_URL`
- `public/env.mfe.js` — the MFEs: `{ id, path, url, render, isAuth }` (change per environment, no build needed)
- `src/config.ts` — shell config (app key, languages, themes, layout, http, menu)
- `src/shell.tsx` — provider, AppLayout / AsideLayout, shell pages; MFEs mount in `<div id="mfe-body">`
- `src/mfe.ts` — single-spa registration; `src/session.ts` — sign out and the menu
- No login in the shell: signed out it shows the auth MFE (`env.mfe.js` entry with `isAuth: true`)
"""

# ------------------------------------------------------------------ mfe

MFE_PACKAGE = """{
  "name": "%%APP_NAME%%",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "description": "Microfrontend built with shared-lib-web: single-spa lifecycles (src/main.tsx), runs alone with npm run dev.",
  "scripts": {
    "dev": "vite --port %%PORT%%",
    "build": "tsc -p tsconfig.json && vite build",
    "serve": "vite build && vite preview --port %%PREVIEW_PORT%%",
    "typecheck": "tsc -p tsconfig.json"
  }
}
"""

MFE_VITE = """// vite.config.ts — the MFE %%APP_NAME%%: its own Vite project.
//   npm run dev     -> http://localhost:%%PORT%%   the MFE alone (index.html + src/dev.tsx), with hot reload;
//                      the shell loads http://localhost:%%PORT%%/src/main.tsx
//   npm run serve   -> http://localhost:%%PREVIEW_PORT%%/%%APP_NAME%%.js   ONE ES module + %%APP_NAME%%.css for the shell
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const mfeEntryUrl = new URL("./src/main.tsx", import.meta.url);
const mfeEntry = fileURLToPath(mfeEntryUrl);

const reactPlugin = react();
const tailwindPlugin = tailwindcss();

// Library build: one ES module (%%APP_NAME%%.js) + its CSS (%%APP_NAME%%.css). React and shared-lib-web are bundled
// in, so the MFE runs on its own; the shell only needs its URL.
const libraryOptions = { entry: mfeEntry, formats: ["es" as const], fileName: "%%APP_NAME%%", cssFileName: "%%APP_NAME%%" };

// "vite build" (npm run build / serve) = production React; "vite" (npm run dev) = development React.
const isBuild = process.argv.includes("build");
const nodeEnvText = JSON.stringify(isBuild ? "production" : "development");

export default defineConfig({
  // dff-util expects Node's "global"; a library build does not replace process.env.NODE_ENV by itself.
  define: { global: "globalThis", "process.env.NODE_ENV": nodeEnvText },
  plugins: [reactPlugin, tailwindPlugin],
  // The shell (another port) imports this dev server's modules; their asset URLs must point back here.
  server: { cors: true, origin: "http://localhost:%%PORT%%" },
  // The shell (another port) loads %%APP_NAME%%.js from here.
  preview: { cors: true },
  build: { lib: libraryOptions, outDir: "dist", emptyOutDir: true },
});
"""

MFE_README = """# %%APP_NAME%%

Microfrontend (type **mfe**) built with [shared-lib-web](https://www.npmjs.com/package/shared-lib-web) and single-spa.
App key (base name): **%%BASE_NAME%%** — the same as the shell, so the MFE reads the shell's theme, language and session.

```bash
npm install
npm run dev      # http://localhost:%%PORT%%  (alone, hot reload)
npm run serve    # http://localhost:%%PREVIEW_PORT%%/%%APP_NAME%%.js  (built)
```

Add it to the shell's `public/env.mfe.js`:

```js
{ id: '@%%BASE_LOWER%%/%%APP_NAME%%', path: '/%%APP_NAME%%', url: 'http://localhost:%%PORT%%/src/main.tsx', render: 'mfe-body' },
```

- `public/env.js` — runtime settings when it runs alone: `REACT_APP_%%BASE_NAME%%_API_BASE_URL` (inside the shell the shell's env.js is used)
- `src/config.ts` — the MFE config (type "mfe": no menu, no branches)
- `src/main.tsx` — single-spa lifecycles; `src/dev.tsx` — runs it alone
- `src/modules/forms/` — the sample page (rename / replace with your module)
"""

TEMPLATES = {
    "spa": {"package.json": SPA_PACKAGE, "vite.config.ts": SPA_VITE, "README.md": SPA_README},
    "shell": {"package.json": SHELL_PACKAGE, "vite.config.ts": SHELL_VITE, "README.md": SHELL_README},
    "mfe": {"package.json": MFE_PACKAGE, "vite.config.ts": MFE_VITE, "README.md": MFE_README},
}

DEPENDENCIES = {
    "spa": "shared-lib-web react react-dom @preact/signals-react react-hook-form lucide-react dff-util",
    "shell": "shared-lib-web react react-dom @preact/signals-react react-hook-form lucide-react dff-util single-spa",
    "mfe": "shared-lib-web react react-dom @preact/signals-react react-hook-form lucide-react dff-util single-spa single-spa-react",
}
DEV_DEPENDENCIES = "vite @vitejs/plugin-react tailwindcss @tailwindcss/vite daisyui typescript @types/react @types/react-dom @types/node"

# ------------------------------------------------------------------ text fixes

APP_KEY_LINE = re.compile(r"""(APP_NAME_KEY\s*=\s*)(['"])[A-Z0-9]+\2""")
ENV_NAME = re.compile(r"REACT_APP_[A-Z0-9]+_")
LIBRARY_SOURCE = re.compile(r'@source "(\.\./)+src";\n')
MONOREPO_PATH = re.compile(r"(\.\./){3,}|\.\./\.\./src\b")


def fix_css(text: str) -> str:
    """The library source (@source "../../src") becomes the published stylesheet."""
    text = re.sub(r"\n?\s*In a real app replace (the library )?@source line with:\s*@import \"shared-lib-web/styles.css\";\s*\*/",
                  " */", text)
    text = re.sub(r"/\* In a real app replace the @source line with:\s*@import \"shared-lib-web/styles.css\"; \*/\n", "", text)
    text = LIBRARY_SOURCE.sub("", text)
    return text.replace('@import "tailwindcss";', '@import "tailwindcss";\n@import "shared-lib-web/styles.css";', 1)


def fix_text(kind: str, path: str, text: str) -> str:
    """Rewrites example names and monorepo paths so the project stands alone."""
    text = APP_KEY_LINE.sub(r"\1'%%BASE_NAME%%'", text)
    text = ENV_NAME.sub("REACT_APP_%%BASE_NAME%%_", text)
    if path.endswith(".css"):
        text = fix_css(text)
    if path == "index.html":
        text = re.sub(r"<title>.*?</title>", "<title>%%APP_NAME%%</title>", text)
    if kind == "shell" and path == "public/env.mfe.js":
        text = text.replace("'@org/", "'@%%BASE_LOWER%%/")
    if kind == "mfe":
        text = text.replace('"forms.css"', '"%%APP_NAME%%.css"')
        text = text.replace("forms.js", "%%APP_NAME%%.js").replace("forms.css", "%%APP_NAME%%.css")
    return text


def collect(kind: str) -> tuple[dict[str, str], dict[str, bytes]]:
    source_root = SOURCES[kind]
    texts: dict[str, str] = {}
    images: dict[str, bytes] = {}
    for source in sorted(source_root.rglob("*")):
        relative = source.relative_to(source_root)
        if source.is_dir() or SKIP_PARTS.intersection(relative.parts) or source.name in SKIP_FILES:
            continue
        path = relative.as_posix()
        if source.suffix.lower() in IMAGE_SUFFIXES:
            images[path] = source.read_bytes()
            continue
        raw = source.read_text(encoding="utf-8")
        texts[path] = fix_text(kind, path, raw)
    texts.update(TEMPLATES[kind])
    texts["tsconfig.json"] = TSCONFIG
    texts[".gitignore"] = GITIGNORE
    leftover = [p for p, t in texts.items() if p.endswith((".ts", ".tsx", ".css")) and MONOREPO_PATH.search(t)]
    if leftover:
        sys.exit(f"{kind}: monorepo paths left in {leftover}")
    return texts, images


HEADER = r"""#!/usr/bin/env bash
# mfe-shell-web.sh — creates a shared-lib-web project (React 19, Vite, Tailwind 4, DaisyUI 5, Signals) of one type:
#   spa    a normal single app (AppLayout, login, pages by ?page=...)       dev port 5173
#   shell  the root app that hosts microfrontends (single-spa, env.mfe.js)  dev port 9000
#   mfe    a microfrontend for the shell (single-spa lifecycles)            dev port 5187
# shared-lib-web is installed from npm (npm i shared-lib-web).
# Generated from the shared-lib-web examples by scripts/build-shell-script.py — do not edit by hand:
# change the examples, then run  python3 scripts/build-shell-script.py <this file>  again.
#
# Usage (every missing value is asked):
#   sh mfe-shell-web.sh [type] [path] [name] [base-name] [port]
#     type        spa | shell | mfe
#     path        parent folder (created when missing)
#     name        project name (lowercase, - . _) -> creates <path>/<name>
#     base-name   app key, UPPERCASE letters / digits, for example ORG: storage keys ORG-TOKEN, ORG-LANG,
#                 window.env REACT_APP_ORG_API_BASE_URL. Use the SAME base name in a shell and all its MFEs.
#     port        dev server port (default: spa 5173, shell 9000, mfe 5187)
#
# Examples:
#   sh mfe-shell-web.sh                                             (asks everything)
#   sh mfe-shell-web.sh shell /Volumes/work/poc web-shell ORG
#   sh mfe-shell-web.sh mfe   /Volumes/work/poc web-orders ORG 5190
#   sh mfe-shell-web.sh spa   /Volumes/work/poc web-admin ADMIN
# Needs: node + npm (and git, optional).

# Started with "sh": run again with bash.
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

APP_TYPE="${1:-}"
BASE_PATH="${2:-}"
APP_NAME="${3:-}"
BASE_NAME="${4:-}"
APP_PORT="${5:-}"

# Asks for a value (with a default) when the terminal is interactive; otherwise uses the default.
ask() {
  local question="$1"
  local default_value="$2"
  local answer=""
  if [ -t 0 ]; then
    if [ -n "$default_value" ]; then
      read -r -p "$question [$default_value]: " answer
    else
      read -r -p "$question: " answer
    fi
  fi
  if [ -z "$answer" ]; then
    answer="$default_value"
  fi
  printf '%s' "$answer"
}

fail() {
  echo "$1" >&2
  echo "Usage: sh mfe-shell-web.sh [spa|shell|mfe] [path] [name] [BASE-NAME] [port]" >&2
  exit 1
}

if [ -z "$APP_TYPE" ]; then
  APP_TYPE="$(ask "Type (spa | shell | mfe)" "shell")"
fi
APP_TYPE="$(printf '%s' "$APP_TYPE" | tr '[:upper:]' '[:lower:]')"
case "$APP_TYPE" in
  spa | shell | mfe) ;;
  *) fail "Type '$APP_TYPE' is not valid: use spa, shell or mfe." ;;
esac

if [ -z "$BASE_PATH" ]; then
  BASE_PATH="$(ask "Parent folder" "$(pwd)")"
fi
[ -n "$BASE_PATH" ] || fail "The parent folder is missing."

case "$APP_TYPE" in
  spa) DEFAULT_NAME="web-app" ;;
  shell) DEFAULT_NAME="web-shell" ;;
  mfe) DEFAULT_NAME="web-mfe" ;;
esac
if [ -z "$APP_NAME" ]; then
  APP_NAME="$(ask "Project name" "$DEFAULT_NAME")"
fi
if ! printf '%s' "$APP_NAME" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  fail "Name '$APP_NAME' must be lowercase (letters, digits, - . _), for example $DEFAULT_NAME."
fi

if [ -z "$BASE_NAME" ]; then
  BASE_NAME="$(ask "Base name / app key (same in the shell and all its MFEs)" "ORG")"
fi
BASE_NAME="$(printf '%s' "$BASE_NAME" | tr '[:lower:]' '[:upper:]')"
if ! printf '%s' "$BASE_NAME" | grep -Eq '^[A-Z][A-Z0-9]*$'; then
  fail "Base name '$BASE_NAME' must be letters and digits (starting with a letter), for example ORG."
fi
BASE_LOWER="$(printf '%s' "$BASE_NAME" | tr '[:upper:]' '[:lower:]')"

case "$APP_TYPE" in
  spa) DEFAULT_PORT="5173" ;;
  shell) DEFAULT_PORT="9000" ;;
  mfe) DEFAULT_PORT="5187" ;;
esac
if [ -z "$APP_PORT" ]; then
  APP_PORT="$(ask "Dev server port" "$DEFAULT_PORT")"
fi
if ! printf '%s' "$APP_PORT" | grep -Eq '^[0-9]{2,5}$'; then
  fail "Port '$APP_PORT' must be a number, for example $DEFAULT_PORT."
fi
PREVIEW_PORT=$((APP_PORT - 10))

mkdir -p "$BASE_PATH"
APP_DIR="$(cd "$BASE_PATH" && pwd)/$APP_NAME"
# The folder may already exist: every file is created only when it is missing (existing files are kept).
if [ -d "$APP_DIR" ]; then
  echo "Updating $APP_DIR ($APP_TYPE, base $BASE_NAME; only missing files are created) ..."
else
  echo "Creating $APP_DIR ($APP_TYPE, base $BASE_NAME, port $APP_PORT) ..."
fi
mkdir -p "$APP_DIR"
cd "$APP_DIR"

CREATED_COUNT=0
SKIPPED_COUNT=0
CREATED_TEXT_FILES=()

# Writes stdin to a file when the file does not exist yet (creates its folder); otherwise keeps the file.
write_file() {
  if [ -e "$1" ]; then
    cat > /dev/null
    echo "  kept     $1"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi
  mkdir -p "$(dirname "$1")"
  cat > "$1"
  echo "  created  $1"
  CREATED_COUNT=$((CREATED_COUNT + 1))
  CREATED_TEXT_FILES+=("$1")
}

# Decodes base64 from stdin into a file (images) when the file does not exist yet.
write_base64() {
  if [ -e "$1" ]; then
    cat > /dev/null
    echo "  kept     $1"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi
  mkdir -p "$(dirname "$1")"
  base64 --decode > "$1"
  echo "  created  $1"
  CREATED_COUNT=$((CREATED_COUNT + 1))
}
"""

FOOTER = r"""
case "$APP_TYPE" in
  spa) create_spa_files ;;
  shell) create_shell_files ;;
  mfe) create_mfe_files ;;
esac

# ---------------------------------------------------------------- placeholders (only in the files just created)
if [ "${#CREATED_TEXT_FILES[@]}" -gt 0 ]; then
  APP_NAME="$APP_NAME" BASE_NAME="$BASE_NAME" BASE_LOWER="$BASE_LOWER" APP_PORT="$APP_PORT" PREVIEW_PORT="$PREVIEW_PORT" \
    node -e '
const fs = require("fs");
const values = {
  "%%APP_NAME%%": process.env.APP_NAME,
  "%%BASE_NAME%%": process.env.BASE_NAME,
  "%%BASE_LOWER%%": process.env.BASE_LOWER,
  "%%PREVIEW_PORT%%": process.env.PREVIEW_PORT,
  "%%PORT%%": process.env.APP_PORT,
};
for (const file of process.argv.slice(1)) {
  let text = fs.readFileSync(file, "utf8");
  for (const [token, value] of Object.entries(values)) {
    text = text.split(token).join(value);
  }
  fs.writeFileSync(file, text);
}' "${CREATED_TEXT_FILES[@]}"
fi

echo "Files: $CREATED_COUNT created, $SKIPPED_COUNT already there (kept)."

# ---------------------------------------------------------------- install (shared-lib-web from npm)
# Adds only the packages package.json does not list yet (versions already there are kept), then installs.
missing_packages() {
  node -e 'const p=require("./package.json");const all={...p.dependencies,...p.devDependencies};console.log(process.argv.slice(1).filter((n)=>!all[n]).join(" "));' "$@"
}

case "$APP_TYPE" in
  spa) DEPENDENCIES="__SPA_DEPENDENCIES__" ;;
  shell) DEPENDENCIES="__SHELL_DEPENDENCIES__" ;;
  mfe) DEPENDENCIES="__MFE_DEPENDENCIES__" ;;
esac

echo "Installing packages ..."
# shellcheck disable=SC2086
MISSING_DEPS="$(missing_packages $DEPENDENCIES)"
# shellcheck disable=SC2086
MISSING_DEV_DEPS="$(missing_packages __DEV_DEPENDENCIES__)"
if [ -n "$MISSING_DEPS" ]; then
  # shellcheck disable=SC2086
  npm install --save $MISSING_DEPS
fi
if [ -n "$MISSING_DEV_DEPS" ]; then
  # shellcheck disable=SC2086
  npm install --save-dev $MISSING_DEV_DEPS
fi
npm install

# ---------------------------------------------------------------- git (only a new repo gets the first commit)
if command -v git >/dev/null 2>&1 && [ ! -d .git ]; then
  git init -q
  git add -A
  git commit -q -m "Initial $APP_TYPE project from mfe-shell-web.sh" || true
fi

echo ""
echo "Done ($APP_TYPE, base name $BASE_NAME). Next:"
echo "  cd $APP_DIR"
echo "  npm run dev      # http://localhost:$APP_PORT"
case "$APP_TYPE" in
  shell) echo "MFE urls: public/env.mfe.js" ;;
  mfe)
    echo "Add it to the shell's public/env.mfe.js:"
    echo "  { id: '@$BASE_LOWER/$APP_NAME', path: '/$APP_NAME', url: 'http://localhost:$APP_PORT/src/main.tsx', render: 'mfe-body' },"
    ;;
esac
echo "API base URL: public/env.js (REACT_APP_${BASE_NAME}_API_BASE_URL)"
"""


def build() -> None:
    lines: list[str] = [HEADER]
    marker_index = 0
    counts: list[str] = []
    for kind in ("spa", "shell", "mfe"):
        texts, images = collect(kind)
        counts.append(f"{kind}: {len(texts)} text files, {len(images)} images")
        lines.append(f"# ================================================================ {kind} ({SOURCES[kind].relative_to(REPO)})")
        lines.append(f"create_{kind}_files() {{")
        for path in sorted(texts):
            text = texts[path]
            marker = f"__FILE_{marker_index}__"
            marker_index += 1
            if marker in text:
                sys.exit(f"Marker clash in {kind}/{path}")
            if not text.endswith("\n"):
                text += "\n"
            lines.append(f"# ---------------------------------------------------------------- {path}")
            lines.append(f"write_file '{path}' <<'{marker}'")
            lines.append(text + marker)
        for path in sorted(images):
            encoded = base64.b64encode(images[path]).decode("ascii")
            wrapped = "\n".join(encoded[i:i + 76] for i in range(0, len(encoded), 76))
            lines.append(f"# ---------------------------------------------------------------- {path} (image, base64)")
            lines.append(f"write_base64 '{path}' <<'__BASE64__'")
            lines.append(wrapped)
            lines.append("__BASE64__")
        lines.append("}")
        lines.append("")
    footer = FOOTER
    footer = footer.replace("__SPA_DEPENDENCIES__", DEPENDENCIES["spa"])
    footer = footer.replace("__SHELL_DEPENDENCIES__", DEPENDENCIES["shell"])
    footer = footer.replace("__MFE_DEPENDENCIES__", DEPENDENCIES["mfe"])
    footer = footer.replace("__DEV_DEPENDENCIES__", DEV_DEPENDENCIES)
    lines.append(footer)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    OUT.chmod(0o755)
    print(f"Wrote {OUT} — " + "; ".join(counts))


build()

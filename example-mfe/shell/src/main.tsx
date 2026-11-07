// main.tsx — shell entry: renders the shell (it reads the saved layout).
// The shell is 5 files: config.ts (settings + api), session.ts (sign in/out), mfe.ts (single-spa from env.mfe.js),
// shell.tsx (layout, login, home), main.tsx (this file).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Root } from "./shell.tsx";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
}

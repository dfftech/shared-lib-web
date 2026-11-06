// dev.tsx — runs the "profile" MFE alone (npm run dev), without the single-spa root. Hot reload works here.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MFE_CONTAINER_ID } from "../../shared/mfe-lifecycles.ts";
import { ProfileMfe } from "./profile.page.tsx";
import "./index.css";

const container = document.getElementById(MFE_CONTAINER_ID);

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ProfileMfe />
    </StrictMode>,
  );
}

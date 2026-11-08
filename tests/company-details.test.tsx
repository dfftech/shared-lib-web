// company-details.test.tsx — company / brand details: config.loadCompanyDetails, setCompanyDetails, AppBrand.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { signal } from "@preact/signals-react";
import { act, cleanup, render } from "@testing-library/react";
import {
  SharedWebUiProvider,
  companyDetailsSignal,
  readAppNameLabel,
  readCompanyDetails,
  readLogoUrl,
  setCompanyDetails,
  type CompanyDetails,
  type UiConfig,
} from "../src/index.ts";
import { AppBrand } from "../src/components/app-brand.tsx";

const companyReply: CompanyDetails = {
  appName: "YourAppName",
  companyName: "YourBrandName",
  faviconUrl: "https://www.w3.org/favicon.ico",
  logoUrl: "https://www.w3.org/Icons/w3c_home.png",
  logoDarkUrl: "https://www.w3.org/Icons/w3c_home_dark.png",
};

describe("company details", () => {
  afterEach(() => {
    cleanup();
    setCompanyDetails(null);
  });

  it("readCompanyDetails: the object or { data }, only text fields", () => {
    const fromData = readCompanyDetails({ data: companyReply });
    expect(fromData?.companyName).toBe("YourBrandName");
    const partial = readCompanyDetails({ appName: "A", logoUrl: "", extra: 1 });
    expect(partial?.appName).toBe("A");
    expect(partial?.logoUrl).toBe(undefined);
    expect(readCompanyDetails(null)).toBe(null);
  });

  it("company values win over the config; missing ones keep the config", () => {
    const config: UiConfig = { appNameKey: "CO", appName: "Config App", logoUrl: "/light.svg", logoDarkUrl: "/dark.svg" };
    expect(readLogoUrl(config, true, companyReply)).toBe(companyReply.logoDarkUrl);
    expect(readLogoUrl(config, false, companyReply)).toBe(companyReply.logoUrl);
    expect(readLogoUrl(config, true, { logoUrl: "/co.png" })).toBe("/co.png");
    expect(readLogoUrl(config, true, { appName: "X" })).toBe("/dark.svg");
    expect(readAppNameLabel(config, companyReply)).toBe("YourAppName");
    expect(readAppNameLabel(config, null)).toBe("Config App");
    const brandOnlyFromBackend: UiConfig = { appNameKey: "CO", loadCompanyDetails: "/company" };
    expect(readAppNameLabel(brandOnlyFromBackend, null)).toBe("");
    expect(readAppNameLabel(brandOnlyFromBackend, {})).toBe("CO");
  });

  it("loadCompanyDetails (function): brand, favicon and tab title update", async () => {
    const config: UiConfig = { appNameKey: "CO", appName: "Config App", defaultTheme: "light", loadCompanyDetails: () => Promise.resolve(companyReply) };
    const view = render(<SharedWebUiProvider config={config}><AppBrand /></SharedWebUiProvider>);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(companyDetailsSignal.value?.companyName).toBe("YourBrandName");
    expect(view.container.textContent).toContain("YourAppName");
    const logo = view.container.querySelector("img");
    expect(logo?.getAttribute("src")).toBe(companyReply.logoUrl);
    expect(logo?.getAttribute("alt")).toBe("YourBrandName");
    const icon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    expect(icon?.href).toBe(companyReply.faviconUrl);
    expect(document.title).toBe("YourAppName");
  });

  it("no appName / logos in the config: no name until the company details arrive", async () => {
    const companySignal = signal<CompanyDetails | null>(null);
    const config: UiConfig = { appNameKey: "CO", loadCompanyDetails: companySignal };
    const view = render(<SharedWebUiProvider config={config}><AppBrand /></SharedWebUiProvider>);
    expect(view.container.textContent?.includes("CO")).toBe(false);
    expect(view.container.querySelector("img")).toBe(null);
    await act(async () => {
      companySignal.value = companyReply;
    });
    expect(view.container.textContent).toContain("YourAppName");
  });

  it("loadCompanyDetails (signal): null keeps the config, the reply applies at once", async () => {
    const companySignal = signal<CompanyDetails | null>(null);
    const config: UiConfig = { appNameKey: "CO", appName: "Config App", loadCompanyDetails: companySignal };
    const view = render(<SharedWebUiProvider config={config}><AppBrand /></SharedWebUiProvider>);
    expect(view.container.textContent).toContain("Config App");
    await act(async () => {
      companySignal.value = companyReply;
    });
    expect(view.container.textContent).toContain("YourAppName");
  });
});

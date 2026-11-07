// mfe-lifecycles.ts
// Turns an MFE's root component into single-spa lifecycles (bootstrap / mount / unmount) with single-spa-react.
// The shell passes the element id of each MFE (env.mfe.js "render") as customProps.domElementId;
// alone (npm run dev) an MFE uses #mfe-container of its own index.html.
// Each MFE is its own build (its own React and shared-lib-web copy), so it also loads its own CSS file
// (settings.css next to settings.js) before the first mount.

import type { FunctionComponent } from "react";
import { createElement } from "react";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import type { AppProps, LifeCycles } from "single-spa";
import singleSpaReact from "single-spa-react";

/** Where an MFE renders when it runs alone (its own index.html). */
export const MFE_CONTAINER_ID = "mfe-container";

/** Props every MFE root component gets from single-spa (+ the shell's customProps). */
export interface MfeProps extends Partial<AppProps> {
  /** Element id from env.mfe.js ("render"). */
  domElementId?: string;
}

/** The element of this MFE: customProps.domElementId from the shell, else #mfe-container. */
function readMfeContainer(props: MfeProps): HTMLElement {
  const elementId = props.domElementId ?? MFE_CONTAINER_ID;
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`#${elementId} is missing`);
  }
  return container;
}

/** Shown when an MFE crashes, so the root shell keeps working. */
function MfeError() {
  return createElement("div", { className: "alert alert-error m-6" }, "This part of the app could not be shown.");
}

/** Resolves when the stylesheet has loaded (or failed: the MFE still mounts). */
function waitForStylesheet(link: HTMLLinkElement): Promise<unknown> {
  const loading = Promise.withResolvers<unknown>();
  link.onload = loading.resolve;
  link.onerror = loading.resolve;
  return loading.promise;
}

/** Adds <link rel="stylesheet" href={cssUrl}> once. */
export function loadMfeStylesheet(cssUrl: string): Promise<unknown> {
  if (!cssUrl) {
    return Promise.resolve();
  }
  const existingLink = document.querySelector(`link[href="${cssUrl}"]`);
  if (existingLink) {
    return Promise.resolve();
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  document.head.append(link);
  return waitForStylesheet(link);
}

/**
 * single-spa lifecycles for one MFE.
 *   cssUrl: the MFE's built CSS file, for example new URL("settings.css", import.meta.url).href
 */
export function createMfeLifecycles(rootComponent: FunctionComponent<MfeProps>, cssUrl: string): LifeCycles<MfeProps> {
  const options = {
    React: React,
    ReactDOMClient: ReactDOMClient,
    rootComponent: rootComponent,
    errorBoundary: MfeError,
    domElementGetter: readMfeContainer as (props: AppProps) => HTMLElement,
  };
  const reactLifecycles = singleSpaReact(options);
  const loadStyles = loadMfeStylesheet.bind(null, cssUrl);
  return {
    bootstrap: [loadStyles, reactLifecycles.bootstrap],
    mount: reactLifecycles.mount,
    unmount: reactLifecycles.unmount,
  };
}

// media-service.ts
// Shared state and handlers for TypeImage / TypeVideo:
// - loading: <img> / <video> get data-loaded or data-error, so CSS (peer-data-*) hides the skeleton
//   or shows the error icon without React state;
// - preview: one popup for the whole app (MediaViewer, rendered by SharedWebUiProvider).

import { signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import type { SyntheticEvent, MouseEvent } from "react";

export type MediaType = "image" | "video";

export interface MediaPreview {
  type: MediaType;
  /** Full-size file shown in the popup. "" = popup closed. */
  src: string;
  /** Popup heading and alt text (already translated). */
  title: string;
  /** Video still shown before playing. */
  poster: string;
}

const CLOSED_PREVIEW: MediaPreview = { type: "image", src: ConstValue.EMPTY, title: ConstValue.EMPTY, poster: ConstValue.EMPTY };

/** The media shown in the popup, or src "" when it is closed. */
export const mediaPreviewSignal = signal<MediaPreview>(CLOSED_PREVIEW);

/** onLoad / onLoadedData: the file is ready, the skeleton goes away. */
export function markMediaLoaded(event: SyntheticEvent<HTMLElement>): void {
  const element = event.currentTarget;
  element.dataset.loaded = "true";
}

/** onError: the file could not be loaded, an icon replaces the skeleton. */
export function markMediaFailed(event: SyntheticEvent<HTMLElement>): void {
  const element = event.currentTarget;
  element.dataset.error = "true";
}

/** Opens the popup for any media. */
export function openMediaPreview(preview: MediaPreview): void {
  mediaPreviewSignal.value = preview;
}

/** Thumbnail click: the button carries data-media-type, data-media-src, data-media-title and data-media-poster. */
export function handleMediaPreviewClick(event: MouseEvent<HTMLElement>): void {
  const dataset = event.currentTarget.dataset;
  const type: MediaType = dataset.mediaType === "video" ? "video" : "image";
  const preview: MediaPreview = {
    type: type,
    src: dataset.mediaSrc ?? ConstValue.EMPTY,
    title: dataset.mediaTitle ?? ConstValue.EMPTY,
    poster: dataset.mediaPoster ?? ConstValue.EMPTY,
  };
  openMediaPreview(preview);
}

/** Closes the popup (a playing video stops because it is removed). */
export function closeMediaPreview(): void {
  mediaPreviewSignal.value = CLOSED_PREVIEW;
}

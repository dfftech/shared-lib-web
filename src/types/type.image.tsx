// type.image.tsx
// Image thumbnail with a skeleton while it loads; a click opens the full image in a popup.
//
//   <TypeImage src="/media/photo-1.jpg" previewSrc="/media/photo-1-small.jpg" alt={t("product.photo")} />
//   <TypeImage src={url} alt={name} className="size-20 rounded-full" isPreviewable={false} />
//   <TypeImage src={url} alt={name} width={240} height={160} />      // dynamic size: number = px, or any CSS size
//   <TypeImage src={url} alt={name} height="8rem" />                 // only a height: the width follows the 16:9 box

import type { CSSProperties } from "react";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { handleMediaPreviewClick, markMediaFailed, markMediaLoaded } from "./media-service.ts";
import { TypeIcon } from "./type.icon.ts";

export type MediaFit = "cover" | "contain";

export interface TypeImageProps {
  /** Full-size image (shown in the popup, and as the thumbnail when there is no previewSrc). */
  src: string;
  /** Text for screen readers and the popup heading (already translated). */
  alt: string;
  /** Smaller image for the thumbnail. Default src. */
  previewSrc?: string;
  /** Popup heading. Default alt. */
  title?: string;
  /** Click opens the popup. Default true. */
  isPreviewable?: boolean;
  /** How the image fills the box. Default "cover". */
  fit?: MediaFit;
  /** Size and shape of the box. Default "aspect-video w-48 rounded-box". */
  className?: string;
  /** Optional box width: a number is px (240), a string any CSS size ("12rem", "100%"). Wins over className. */
  width?: MediaSize;
  /** Optional box height, like width. With only a height, the width follows the aspect ratio of className. */
  height?: MediaSize;
}

/** Box size: number = px, string = any CSS size. */
export type MediaSize = number | string;

/** Inline width / height for dynamic sizes (Tailwind classes can not be built at runtime). */
export function buildMediaStyle(width?: MediaSize, height?: MediaSize): CSSProperties | undefined {
  const hasWidth = width !== undefined;
  const hasHeight = height !== undefined;
  if (!hasWidth && !hasHeight) {
    return undefined;
  }
  // Only a height: width "auto" lets the aspect ratio (aspect-video) work out the width.
  const widthValue = hasWidth ? width : "auto";
  return { width: widthValue, height: height };
}

/** Thumbnail box, skeleton, error icon and hover layer (shared with TypeVideo). */
export const MEDIA_BOX_CLASS = "group relative block shrink-0 overflow-hidden bg-base-200";
export const MEDIA_FILL_CLASS = "peer size-full opacity-0 transition-opacity data-[loaded=true]:opacity-100";
export const MEDIA_SKELETON_CLASS = "skeleton absolute inset-0 rounded-none peer-data-[error=true]:hidden peer-data-[loaded=true]:hidden";
export const MEDIA_ERROR_CLASS = "absolute inset-0 hidden items-center justify-center opacity-60 peer-data-[error=true]:flex";
export const DEFAULT_MEDIA_SIZE_CLASS = "aspect-video w-48 rounded-box";

const FIT_CLASSES: Record<MediaFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
};

export function TypeImage(props: TypeImageProps) {
  const { src, alt, previewSrc, isPreviewable = true, fit = "cover", className = DEFAULT_MEDIA_SIZE_CLASS, width, height } = props;
  const boxStyle = buildMediaStyle(width, height);
  const { t } = useUi();
  const thumbnailSrc = previewSrc ?? src;
  const title = props.title ?? alt;
  const fitClass = FIT_CLASSES[fit];
  const boxClassList = [MEDIA_BOX_CLASS, isPreviewable ? "cursor-zoom-in" : "", className];
  const boxClassName = joinClassNames(boxClassList);
  const imageClassName = `${MEDIA_FILL_CLASS} ${fitClass}`;
  const openText = t("ui.openPreview");
  const errorText = t("ui.mediaError");
  const imageElement = (
    <img key={thumbnailSrc} src={thumbnailSrc} alt={alt} loading="lazy" className={imageClassName} onLoad={markMediaLoaded} onError={markMediaFailed} />
  );
  const errorElement = (
    <span className={MEDIA_ERROR_CLASS} title={errorText}>
      <TypeIcon name="ImageOff" size={24} />
    </span>
  );

  if (!isPreviewable) {
    return (
      <span className={boxClassName} style={boxStyle}>
        {imageElement}
        <span className={MEDIA_SKELETON_CLASS} />
        {errorElement}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={boxClassName}
      style={boxStyle}
      aria-label={`${openText}: ${title}`}
      data-media-type="image"
      data-media-src={src}
      data-media-title={title}
      onClick={handleMediaPreviewClick}
    >
      {imageElement}
      <span className={MEDIA_SKELETON_CLASS} />
      {errorElement}
      <span className="absolute inset-0 flex items-center justify-center bg-neutral/0 text-neutral-content opacity-0 transition group-hover:bg-neutral/30 group-hover:opacity-100 group-focus-visible:bg-neutral/30 group-focus-visible:opacity-100 peer-data-[error=true]:hidden">
        <TypeIcon name="Expand" size={22} />
      </span>
    </button>
  );
}

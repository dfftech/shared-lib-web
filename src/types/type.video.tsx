// type.video.tsx
// Video thumbnail (poster image, or the first frame) with a skeleton while it loads and a play button;
// a click opens the popup and the video plays there with controls.
//
//   <TypeVideo src="/media/demo.mp4" poster="/media/demo-poster.jpg" title={t("product.video")} />
//   <TypeVideo src={url} title={name} isPreviewable={false} />      // plays inline with controls
//   <TypeVideo src={url} title={name} width={320} height={180} />   // dynamic size: number = px, or any CSS size

import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { handleMediaPreviewClick, markMediaFailed, markMediaLoaded } from "./media-service.ts";
import {
  buildMediaStyle,
  DEFAULT_MEDIA_SIZE_CLASS,
  MEDIA_BOX_CLASS,
  MEDIA_ERROR_CLASS,
  MEDIA_FILL_CLASS,
  MEDIA_SKELETON_CLASS,
  type MediaSize,
} from "./type.image.tsx";
import { TypeIcon } from "./type.icon.ts";

export interface TypeVideoProps {
  /** Video file. */
  src: string;
  /** Text for screen readers and the popup heading (already translated). */
  title: string;
  /** Still image for the thumbnail and before playing. Without it the first frame is shown. */
  poster?: string;
  /** Click opens the popup and plays there. false: the video plays inline with controls. Default true. */
  isPreviewable?: boolean;
  /** Size and shape of the box. Default "aspect-video w-48 rounded-box". */
  className?: string;
  /** Optional box width: a number is px (320), a string any CSS size ("20rem", "100%"). Wins over className. */
  width?: MediaSize;
  /** Optional box height, like width. With only a height, the width follows the aspect ratio of className. */
  height?: MediaSize;
}

/** "#t=0.1" makes browsers show the first frame as the thumbnail when there is no poster. */
const FIRST_FRAME_SUFFIX = "#t=0.1";

export function TypeVideo(props: TypeVideoProps) {
  const { src, title, poster, isPreviewable = true, className = DEFAULT_MEDIA_SIZE_CLASS, width, height } = props;
  const boxStyle = buildMediaStyle(width, height);
  const { t } = useUi();
  const boxClassList = [MEDIA_BOX_CLASS, className];
  const boxClassName = joinClassNames(boxClassList);
  const playText = t("ui.playVideo");
  const errorText = t("ui.mediaError");
  const skeletonElement = <span className={MEDIA_SKELETON_CLASS} />;
  const errorElement = (
    <span className={MEDIA_ERROR_CLASS} title={errorText}>
      <TypeIcon name="VideoOff" size={24} />
    </span>
  );

  if (!isPreviewable) {
    return (
      <span className={boxClassName} style={boxStyle}>
        <video
          key={src}
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          className={`${MEDIA_FILL_CLASS} bg-neutral object-contain`}
          onLoadedMetadata={markMediaLoaded}
          onError={markMediaFailed}
        />
        {skeletonElement}
        {errorElement}
      </span>
    );
  }

  // Thumbnail: the poster image, or the paused video showing its first frame.
  const thumbnailElement = poster ? (
    <img key={poster} src={poster} alt="" loading="lazy" className={`${MEDIA_FILL_CLASS} object-cover`} onLoad={markMediaLoaded} onError={markMediaFailed} />
  ) : (
    <video
      key={src}
      src={`${src}${FIRST_FRAME_SUFFIX}`}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      className={`${MEDIA_FILL_CLASS} pointer-events-none object-cover`}
      onLoadedData={markMediaLoaded}
      onError={markMediaFailed}
    />
  );

  return (
    <button
      type="button"
      className={boxClassName}
      style={boxStyle}
      aria-label={`${playText}: ${title}`}
      data-media-type="video"
      data-media-src={src}
      data-media-title={title}
      data-media-poster={poster}
      onClick={handleMediaPreviewClick}
    >
      {thumbnailElement}
      {skeletonElement}
      {errorElement}
      <span className="absolute inset-0 flex items-center justify-center bg-neutral/10 transition group-hover:bg-neutral/30 peer-data-[error=true]:hidden">
        <span className="flex size-12 items-center justify-center rounded-full bg-base-100/90 text-primary shadow-lg transition group-hover:scale-110">
          <TypeIcon name="Play" size={22} className="ms-0.5 fill-current" />
        </span>
      </span>
    </button>
  );
}

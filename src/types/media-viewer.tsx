// media-viewer.tsx
// The popup of TypeImage / TypeVideo: the full image, or the video playing with controls.
// A skeleton shows until the file is ready. Rendered once by SharedWebUiProvider.

import { useSignals } from "@preact/signals-react/runtime";
import { useUi } from "../context/use-ui.ts";
import { closeMediaPreview, markMediaFailed, markMediaLoaded, mediaPreviewSignal } from "./media-service.ts";
import { TypeIcon } from "./type.icon.ts";
import { TypeModal } from "./type.modal.tsx";

/** Skeleton and error icon that follow the data-loaded / data-error of the media element before them (peer). */
const MEDIA_SKELETON_CLASS = "skeleton absolute inset-0 peer-data-[error=true]:hidden peer-data-[loaded=true]:hidden";
const MEDIA_ERROR_CLASS = "absolute inset-0 hidden flex-col items-center justify-center gap-2 opacity-60 peer-data-[error=true]:flex";

export function MediaViewer() {
  useSignals();
  const { t } = useUi();
  const preview = mediaPreviewSignal.value;
  const isOpen = preview.src !== "";
  const isVideo = preview.type === "video";
  const errorText = t("ui.mediaError");
  const posterUrl = preview.poster || undefined;

  return (
    <TypeModal isOpen={isOpen} title={preview.title} onClose={closeMediaPreview} size="2xl">
      <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-box bg-base-200">
        {isVideo ? (
          <video
            key={preview.src}
            src={preview.src}
            poster={posterUrl}
            controls
            autoPlay
            playsInline
            className="peer max-h-[75vh] w-full bg-neutral opacity-0 transition-opacity data-[loaded=true]:opacity-100"
            onLoadedData={markMediaLoaded}
            onError={markMediaFailed}
          />
        ) : (
          <img
            key={preview.src}
            src={preview.src}
            alt={preview.title}
            className="peer max-h-[75vh] w-auto object-contain opacity-0 transition-opacity data-[loaded=true]:opacity-100"
            onLoad={markMediaLoaded}
            onError={markMediaFailed}
          />
        )}
        <span className={MEDIA_SKELETON_CLASS} />
        <span className={MEDIA_ERROR_CLASS}>
          <TypeIcon name={isVideo ? "VideoOff" : "ImageOff"} size={32} />
          <span className="text-sm">{errorText}</span>
        </span>
      </div>
    </TypeModal>
  );
}

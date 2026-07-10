type MemoryMediaProps = {
  src?: string | null;
  type?: string | null;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  controls?: boolean;
  muted?: boolean;
  showPlayOverlay?: boolean;
  placeholderLabel?: string;
};

export function isVideoMemory(type?: string | null) {
  return type?.toUpperCase() === "VIDEO";
}

function getVideoThumbnailUrl(url: string) {
  return url.replace(/\.[^/.]+$/, ".jpg");
}

export default function MemoryMedia({
  src,
  type,
  alt = "",
  className = "h-full w-full object-cover",
  placeholderClassName = "flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700",
  controls = false,
  muted = true,
  showPlayOverlay = false,
  placeholderLabel = "M",
}: MemoryMediaProps) {
  const mediaUrl = src?.trim();
  const isVideo = isVideoMemory(type);
  const shouldShowPlayOverlay = isVideo && showPlayOverlay && !controls;

  if (!mediaUrl) {
    return <div className={placeholderClassName}>{placeholderLabel}</div>;
  }

  if (isVideo) {
    if (shouldShowPlayOverlay) {
      return (
        <>
          <img
            src={getVideoThumbnailUrl(mediaUrl)}
            alt={alt}
            className={className}
          />

          <span
            aria-hidden="true"
            className="play-button pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-emerald-600/90 text-xl text-white shadow-lg shadow-emerald-950/25 backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-emerald-700"
          >
            &#9655;
          </span>
        </>
      );
    }

    return (
      <video
        src={mediaUrl}
        className={className}
        muted={muted}
        controls={controls}
        playsInline
        preload="metadata"
      />
    );
  }

  return <img src={mediaUrl} alt={alt} className={className} />;
}

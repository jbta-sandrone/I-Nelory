import { AnimatePresence, motion } from "framer-motion";
import MemoryMedia from "./MemoryMedia";
import { formatMoodLabel } from "../utils/memoryMetadata";
import { formatBytes } from "../utils/formatBytes";

export type ViewableMemory = {
  title: string;
  date: string;
  caption: string;
  mood: string;
  type: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaSizeBytes?: number | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  mediaDurationSeconds?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  album?: {
    id: string;
    name: string;
  } | null;
  tags: string[];
};

type MemoryViewerModalProps = {
  memory: ViewableMemory | null;
  onClose: () => void;
};

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

function isVideoMemory(memory: ViewableMemory) {
  return memory.mediaType?.toUpperCase() === "VIDEO";
}

function formatTechnicalDate(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "Unavailable";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
  }

  return `${remainingSeconds}s`;
}

export default function MemoryViewerModal({
  memory,
  onClose,
}: MemoryViewerModalProps) {
  const isVideo = memory ? isVideoMemory(memory) : false;
  const resolution =
    memory?.mediaWidth && memory.mediaHeight
      ? `${memory.mediaWidth} \u00d7 ${memory.mediaHeight}`
      : "Unavailable";
  const details: Array<[string, string]> = memory
    ? [
        ["Album", memory.album?.name?.trim() || "Not in an album"],
        ["Media Type", isVideo ? "Video" : "Photo"],
        [
          "File Size",
          memory.mediaSizeBytes === null ||
          memory.mediaSizeBytes === undefined
            ? "Unavailable"
            : formatBytes(memory.mediaSizeBytes),
        ],
        ["Resolution", resolution],
        ...(isVideo
          ? [
              [
                "Duration",
                formatDuration(memory.mediaDurationSeconds),
              ] as [string, string],
            ]
          : []),
        ["Uploaded", formatTechnicalDate(memory.createdAt)],
        ["Last Updated", formatTechnicalDate(memory.updatedAt)],
      ]
    : [];

  return (
    <AnimatePresence>
      {memory ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-memory-title"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.26, ease: easeOut }}
            className="my-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl shadow-slate-950/30"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {memory.type}
                </p>
                <h2
                  id="view-memory-title"
                  className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                >
                  {memory.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{memory.date}</p>
              </div>

              <button
                type="button"
                aria-label="Close memory viewer"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-950 p-3 sm:p-5">
              {isVideoMemory(memory) && memory.mediaUrl ? (
                <video
                  src={memory.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-auto max-h-[75vh] w-full object-contain"
                />
              ) : (
                <MemoryMedia
                  src={memory.mediaUrl}
                  type={memory.mediaType}
                  className="h-auto max-h-[75vh] w-full object-contain"
                  placeholderClassName="flex h-[min(75vh,28rem)] w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-5xl font-semibold text-emerald-700"
                />
              )}
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <p className="text-sm leading-6 text-slate-600">
                {memory.caption}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {formatMoodLabel(memory.mood)}
                </span>
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <section className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-semibold text-slate-950">
                    Memory Details
                  </h3>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {details.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

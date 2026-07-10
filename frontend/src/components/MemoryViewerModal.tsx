import { AnimatePresence, motion } from "framer-motion";
import MemoryMedia from "./MemoryMedia";
import { formatMoodLabel } from "../utils/memoryMetadata";

type ViewableMemory = {
  title: string;
  date: string;
  caption: string;
  mood: string;
  type: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
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

export default function MemoryViewerModal({
  memory,
  onClose,
}: MemoryViewerModalProps) {
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
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

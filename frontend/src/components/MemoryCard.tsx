import { AnimatePresence, motion, type Variants } from "framer-motion";
import MemoryMedia from "./MemoryMedia";
import { formatMoodLabel } from "../utils/memoryMetadata";

export type MemoryCardType = "Photo" | "Video" | "Story";

export type MemoryCardMemory = {
  id: string;
  title: string;
  caption: string;
  date: string;
  mood: string;
  type: MemoryCardType;
  tags: string[];
  image: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  favorite: boolean;
};

type MemoryCardProps<TMemory extends MemoryCardMemory> = {
  memory: TMemory;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onToggleFavorite: (memory: TMemory) => void;
  onEdit: (memory: TMemory) => void;
  onArchive: (memory: TMemory) => void;
  onDelete: (memory: TMemory) => void;
  onOpen?: (memory: TMemory) => void;
};

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
};

const typeStyles: Record<MemoryCardType, string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

export default function MemoryCard<TMemory extends MemoryCardMemory>({
  memory,
  openMenuId,
  onToggleMenu,
  onToggleFavorite,
  onEdit,
  onArchive,
  onDelete,
  onOpen,
}: MemoryCardProps<TMemory>) {
  const mediaUrl = memory.mediaUrl ?? memory.image;
  const isVideo = memory.mediaType?.toUpperCase() === "VIDEO";
  const visibleTags = memory.tags.slice(0, 3);
  const hiddenTagCount = Math.max(memory.tags.length - visibleTags.length, 0);

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-52 overflow-hidden">
        {onOpen ? (
          <button
            type="button"
            aria-label={`Open ${memory.title}`}
            onClick={() => onOpen(memory)}
            className="block h-full w-full text-left"
          >
            <MemoryMedia
              src={mediaUrl}
              type={memory.mediaType ?? memory.type}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              placeholderClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105"
              showPlayOverlay={isVideo}
            />
          </button>
        ) : (
          <MemoryMedia
            src={mediaUrl}
            type={memory.mediaType ?? memory.type}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            placeholderClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105"
            showPlayOverlay={isVideo}
          />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[memory.type]}`}
          >
            {memory.type}
          </span>
          <button
            type="button"
            aria-label={`Favorite ${memory.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(memory);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
          >
            {memory.favorite ? "\u2665" : "\u2661"}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {memory.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{memory.date}</p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={`Open menu for ${memory.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu(memory.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
            >
              &hellip;
            </button>

            <AnimatePresence>
              {openMenuId === memory.id ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                >
                  {["Edit", "Archive", "Delete"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (action === "Edit") {
                          onEdit(memory);
                        }

                        if (action === "Archive") {
                          onArchive(memory);
                        }

                        if (action === "Delete") {
                          onDelete(memory);
                        }
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {action}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {memory.caption}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatMoodLabel(memory.mood)}
          </span>
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {tag}
            </span>
          ))}
          {hiddenTagCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              +{hiddenTagCount} more
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

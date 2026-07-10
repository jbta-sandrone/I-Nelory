import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";
import FeedbackDialog, {
  type FeedbackState,
} from "../components/FeedbackDialog";
import type { ApiMemory } from "../components/NewMemoryModal";
import MemoryMedia from "../components/MemoryMedia";
import MemoryViewerModal from "../components/MemoryViewerModal";
import { getMemoryTagNames } from "../utils/memoryMetadata";

type ArchiveAction = "restore" | "delete" | null;

type ArchivedMemory = {
  id: string;
  title: string;
  date: string;
  archivedDate: string;
  caption: string;
  type: "Photo" | "Video" | "Story";
  album: string;
  image: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  mood: string;
  tags: string[];
};

type MemoriesResponse = {
  message: string;
  memories: ApiMemory[];
};

type MemoryResponse = {
  message?: string;
  memory?: ApiMemory;
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

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const typeStyles: Record<ArchivedMemory["type"], string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function getMemoryType(mediaType?: string | null): ArchivedMemory["type"] {
  const normalizedType = mediaType?.toUpperCase() ?? "";

  if (normalizedType === "VIDEO") {
    return "Video";
  }

  if (normalizedType.includes("STORY") || normalizedType.includes("TEXT")) {
    return "Story";
  }

  return "Photo";
}

function formatMemoryDate(memoryDate?: string | null) {
  if (!memoryDate) {
    return "No date";
  }

  const date = new Date(memoryDate);

  if (Number.isNaN(date.getTime())) {
    return memoryDate;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatArchivedDate(updatedAt?: string | null) {
  if (!updatedAt) {
    return "Archived";
  }

  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Archived";
  }

  return `Archived ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date)}`;
}

function mapApiMemory(memory: ApiMemory): ArchivedMemory {
  const type = getMemoryType(memory.mediaType);
  const mediaUrl = memory.mediaUrl?.trim() || null;
  const tags = getMemoryTagNames(memory.tags);

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    date: formatMemoryDate(memory.memoryDate),
    archivedDate: formatArchivedDate(memory.updatedAt),
    caption: memory.description?.trim() || "No description yet.",
    type,
    album: memory.albumId ? "Album" : "Memory",
    image: mediaUrl,
    mediaUrl,
    mediaType: memory.mediaType ?? null,
    mood: memory.location?.trim() || "Neutral",
    tags,
  };
}

function ConfirmationModal({
  action,
  memory,
  isWorking,
  onClose,
  onConfirm,
}: {
  action: ArchiveAction;
  memory: ArchivedMemory | null;
  isWorking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!action || !memory) {
    return null;
  }

  const isDelete = action === "delete";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ duration: 0.25, ease: easeOut }}
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            isDelete
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isDelete ? "!" : "R"}
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {isDelete ? "Delete this memory permanently?" : "Restore this memory?"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isDelete
            ? "This action cannot be undone."
            : `"${memory.title}" will return to your main memories and timeline.`}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isWorking}
            className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 ${
              isDelete
                ? "bg-red-600 shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/25"
                : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/25"
            }`}
          >
            {isWorking
              ? isDelete
                ? "Deleting..."
                : "Restoring..."
              : isDelete
                ? "Delete Permanently"
                : "Restore Memory"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ArchivePage() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [archivedMemories, setArchivedMemories] = useState<ArchivedMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMemory, setSelectedMemory] = useState<ArchivedMemory | null>(
    null,
  );
  const [memoryToView, setMemoryToView] = useState<ArchivedMemory | null>(null);
  const [modalAction, setModalAction] = useState<ArchiveAction>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isActionTransitioning, setIsActionTransitioning] = useState(false);

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setFeedback({ type: "success", ...nextFeedback });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchArchivedMemories() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Missing authentication token. Please log in again.");
        }

        const response = await fetch(
          "http://localhost:5000/api/memories/archive",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | MemoriesResponse
          | { message?: string }
          | null;

        if (!response.ok || !data || !("memories" in data)) {
          throw new Error(data?.message || "Failed to fetch archived memories.");
        }

        setArchivedMemories(data.memories.map(mapApiMemory));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setArchivedMemories([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to fetch archived memories.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchArchivedMemories();

    return () => controller.abort();
  }, []);

  const openModal = (memory: ArchivedMemory, action: ArchiveAction) => {
    setSelectedMemory(memory);
    setModalAction(action);
    setOpenMenuId(null);
  };

  const openMemoryViewer = (memory: ArchivedMemory) => {
    setOpenMenuId(null);
    setMemoryToView(memory);
  };

  const closeModal = () => {
    if (!isWorking) {
      setModalAction(null);
      setSelectedMemory(null);
    }
  };

  const restoreMemory = async (memory: ArchivedMemory) => {
    const previousMemories = archivedMemories;
    const transitionStartedAt = startActionTransition();

    setIsWorking(true);
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories(previousMemories);
      setIsWorking(false);
      showFeedback({
        icon: "!",
        title: "Restore failed",
        message: "Missing authentication token. Please log in again.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(
          memory.id,
        )}/archive`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = (await response.json().catch(() => null)) as
        | MemoryResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to restore memory.");
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories((currentMemories) =>
        currentMemories.filter((currentMemory) => currentMemory.id !== memory.id),
      );
      setModalAction(null);
      setSelectedMemory(null);
      showFeedback({
        icon: "\u{1F49A}",
        title: "Memory restored successfully \u{1F49A}",
        message: "This memory returned to Memories.",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories(previousMemories);
      showFeedback({
        icon: "!",
        title: "Restore failed",
        message:
          error instanceof Error ? error.message : "Failed to restore memory.",
        type: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const deleteArchivedMemory = async (memory: ArchivedMemory) => {
    const previousMemories = archivedMemories;
    const transitionStartedAt = startActionTransition();

    setIsWorking(true);
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories(previousMemories);
      setIsWorking(false);
      showFeedback({
        icon: "!",
        title: "Delete failed",
        message: "Missing authentication token. Please log in again.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(memory.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete memory.");
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories((currentMemories) =>
        currentMemories.filter((currentMemory) => currentMemory.id !== memory.id),
      );
      setModalAction(null);
      setSelectedMemory(null);
      showFeedback({
        icon: "M",
        title: "Memory Deleted",
        message: "The memory has been removed.",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setArchivedMemories(previousMemories);
      showFeedback({
        icon: "!",
        title: "Delete failed",
        message:
          error instanceof Error ? error.message : "Failed to delete memory.",
        type: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const confirmArchiveAction = () => {
    if (!selectedMemory) {
      return;
    }

    if (modalAction === "restore") {
      void restoreMemory(selectedMemory);
    }

    if (modalAction === "delete") {
      void deleteArchivedMemory(selectedMemory);
    }
  };

  const stats = [
    {
      label: "Archived Memories",
      value: String(archivedMemories.length),
      icon: "\u25ab",
    },
    {
      label: "Archived Photos",
      value: String(
        archivedMemories.filter((memory) => memory.type === "Photo").length,
      ),
      icon: "\u25c7",
    },
    {
      label: "Archived Videos",
      value: String(
        archivedMemories.filter((memory) => memory.type === "Video").length,
      ),
      icon: "\u25b7",
    },
    {
      label: "Recently Archived",
      value: String(Math.min(archivedMemories.length, 3)),
      icon: "\u25b7",
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Page Header */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Protected Space
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              {"\u25ab"}
            </span>
            Archive
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Hidden memories stay safe here until you restore them.
          </p>
        </div>
      </motion.section>

      {/* Archive Info Banner */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm shadow-emerald-950/5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-emerald-700 shadow-sm">
            i
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Archived memories are safely tucked away.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Archived memories are hidden from your main timeline and memories
              grid, but they are not permanently deleted.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Archive Stats */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.article
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ duration: 0.3 }}
            className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
                {stat.icon}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-5 truncate text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {stat.label}
            </p>
          </motion.article>
        ))}
      </motion.section>

      {/* Filter/Search Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search archived memories"
            className={inputClasses()}
          />

          <select aria-label="Filter by type" className={inputClasses()}>
            <option>All types</option>
            <option>Photos</option>
            <option>Videos</option>
            <option>Stories</option>
          </select>

          <select aria-label="Filter by album" className={inputClasses()}>
            <option>All albums</option>
            <option>Memory</option>
            <option>Album</option>
          </select>

          <select aria-label="Sort archived memories" className={inputClasses()}>
            <option>Recently Archived</option>
            <option>Oldest Archived</option>
          </select>
        </div>
      </motion.section>

      {/* Archived Memory Grid */}
      {isLoading ? (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.article
              key={index}
              variants={fadeUp}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5"
            >
              <div className="h-52 animate-pulse bg-slate-100" />
              <div className="space-y-4 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </motion.article>
          ))}
        </motion.section>
      ) : errorMessage ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm shadow-red-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-semibold text-red-600">
            !
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            Unable to load archive.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>
        </motion.section>
      ) : archivedMemories.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-semibold text-emerald-700">
            {"\u25ab"}
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            Your archive is empty.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Archived memories will appear here.
          </p>
        </motion.section>
      ) : (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {archivedMemories.map((memory) => (
            <motion.article
              key={memory.id}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
              onClick={() => openMemoryViewer(memory)}
            >
              <div className="relative h-52 overflow-hidden">
                <MemoryMedia
                  src={memory.mediaUrl}
                  type={memory.mediaType ?? memory.type}
                  className="h-full w-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  showPlayOverlay={memory.mediaType?.toUpperCase() === "VIDEO"}
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[memory.type]}`}
                  >
                    {memory.type}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openModal(memory, "restore");
                    }}
                    className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    Restore
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">
                      {memory.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {memory.date}
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Open menu for ${memory.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((current) =>
                          current === memory.id ? null : memory.id,
                        );
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
                          className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openModal(memory, "restore");
                            }}
                            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openModal(memory, "delete");
                            }}
                            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                          >
                            Delete Permanently
                          </button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                  {memory.caption}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {memory.album}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {memory.archivedDate}
                  </span>
                  {memory.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {memory.tags.length > 3 ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      +{memory.tags.length - 3} more
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>
      )}

      <MemoryViewerModal
        memory={memoryToView}
        onClose={() => setMemoryToView(null)}
      />

      <AnimatePresence>
        <ConfirmationModal
          action={modalAction}
          memory={selectedMemory}
          isWorking={isWorking}
          onClose={closeModal}
          onConfirm={confirmArchiveAction}
        />
      </AnimatePresence>

      <FeedbackDialog
        isOpen={Boolean(feedback)}
        icon={feedback?.icon ?? ""}
        title={feedback?.title ?? ""}
        message={feedback?.message}
        type={feedback?.type ?? "success"}
        onDismiss={() => setFeedback(null)}
      />

      <ActionTransitionOverlay isOpen={isActionTransitioning} />
    </motion.div>
  );
}

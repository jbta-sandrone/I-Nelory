import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import NewMemoryModal, {
  type ApiMemory,
  type EditableMemory,
} from "../components/NewMemoryModal";

type MemoryType = "Photo" | "Video" | "Story";

type Memory = {
  id: string;
  title: string;
  description: string;
  caption: string;
  date: string;
  memoryDate: string | null;
  mood: string;
  location: string | null;
  type: MemoryType;
  tags: string[];
  image: string;
  favorite: boolean;
};

type MemoriesResponse = {
  message: string;
  memories: ApiMemory[];
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
      delayChildren: 0.04,
    },
  },
};

const fallbackMediaUrl =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80";

const typeStyles: Record<MemoryType, string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

const moods = [
  "All moods",
  "Peaceful",
  "Loved",
  "Reflective",
  "Joyful",
  "Nostalgic",
];

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function getMemoryType(mediaType?: string | null): MemoryType {
  const normalizedType = mediaType?.toLowerCase() ?? "";

  if (normalizedType.includes("video")) {
    return "Video";
  }

  if (normalizedType.includes("story") || normalizedType.includes("text")) {
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

function mapApiMemory(memory: ApiMemory): Memory {
  const type = getMemoryType(memory.mediaType);
  const location = memory.location?.trim();
  const tags = [
    type,
    location,
    memory.albumId ? "Album" : null,
  ].filter(Boolean) as string[];

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    description: memory.description?.trim() || "",
    caption: memory.description?.trim() || "No description yet.",
    date: formatMemoryDate(memory.memoryDate),
    memoryDate: memory.memoryDate ?? null,
    mood: location || "No location",
    location: location ?? null,
    type,
    tags: tags.length > 0 ? tags : ["Memory"],
    image: memory.mediaUrl?.trim() || fallbackMediaUrl,
    favorite: memory.isFavorite,
  };
}

export default function MemoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [memoryToEdit, setMemoryToEdit] = useState<EditableMemory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMemories() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Missing authentication token. Please log in again.");
        }

        const response = await fetch("http://localhost:5000/api/memories", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch memories (${response.status}).`);
        }

        const data = (await response.json()) as MemoriesResponse;
        setMemories(data.memories.map(mapApiMemory));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMemories([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch memories.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchMemories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleMemoryCreated = (event: Event) => {
      const createdMemory = (event as CustomEvent<ApiMemory>).detail;

      if (!createdMemory?.id) {
        return;
      }

      setMemories((currentMemories) => {
        const nextMemory = mapApiMemory(createdMemory);
        const alreadyExists = currentMemories.some(
          (memory) => memory.id === nextMemory.id,
        );

        if (alreadyExists) {
          return currentMemories.map((memory) =>
            memory.id === nextMemory.id ? nextMemory : memory,
          );
        }

        return [nextMemory, ...currentMemories];
      });
      setErrorMessage("");
    };

    window.addEventListener("i-nelory.memory.created", handleMemoryCreated);

    return () => {
      window.removeEventListener(
        "i-nelory.memory.created",
        handleMemoryCreated,
      );
    };
  }, []);

  useEffect(() => {
    const handleMemoryUpdated = (event: Event) => {
      const updatedMemory = (event as CustomEvent<ApiMemory>).detail;

      if (!updatedMemory?.id) {
        return;
      }

      setMemories((currentMemories) =>
        currentMemories.map((memory) =>
          memory.id === updatedMemory.id ? mapApiMemory(updatedMemory) : memory,
        ),
      );
      setMemoryToEdit(null);
      setErrorMessage("");
    };

    window.addEventListener("i-nelory.memory.updated", handleMemoryUpdated);

    return () => {
      window.removeEventListener(
        "i-nelory.memory.updated",
        handleMemoryUpdated,
      );
    };
  }, []);

  const openEditModal = (memory: Memory) => {
    setOpenMenuId(null);
    setMemoryToEdit({
      id: memory.id,
      title: memory.title,
      description: memory.description,
      memoryDate: memory.memoryDate,
      location: memory.location,
    });
  };

  const closeMemoryModal = () => {
    setIsModalOpen(false);
    setMemoryToEdit(null);
  };

  const openDeleteConfirmation = (memory: Memory) => {
    setOpenMenuId(null);
    setDeleteErrorMessage("");
    setMemoryToDelete(memory);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeleting) {
      setDeleteErrorMessage("");
      setMemoryToDelete(null);
    }
  };

  const handleDeleteMemory = async () => {
    if (!memoryToDelete) {
      return;
    }

    setDeleteErrorMessage("");

    const token = getStoredToken();

    if (!token) {
      setDeleteErrorMessage("Missing authentication token. Please log in again.");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(
          memoryToDelete.id,
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete memory.");
      }

      setMemories((currentMemories) =>
        currentMemories.filter((memory) => memory.id !== memoryToDelete.id),
      );
      setMemoryToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete memory.";
      console.error("Delete memory failed:", error);
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

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
        className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Memory Library
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Memories
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Browse and manage the moments you&apos;ve saved.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMemoryToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Memory
        </button>
      </motion.section>

      {/* Filters/Search Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search memories..."
            className={inputClasses()}
          />

          <select aria-label="Filter by mood" className={inputClasses()}>
            {moods.map((mood) => (
              <option key={mood}>{mood}</option>
            ))}
          </select>

          <select aria-label="Filter by type" className={inputClasses()}>
            <option>All types</option>
            <option>Photos</option>
            <option>Videos</option>
            <option>Stories</option>
          </select>

          <input
            aria-label="Filter by date"
            type="date"
            className={inputClasses()}
          />

          <select aria-label="Sort memories" className={inputClasses()}>
            <option>Newest first</option>
            <option>Oldest first</option>
          </select>
        </div>
      </motion.section>

      {/* Memory Grid */}
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
            Unable to load memories.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>
        </motion.section>
      ) : memories.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-semibold text-emerald-700">
            M
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No memories yet.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Start preserving your first moment.
          </p>
        </motion.section>
      ) : (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {memories.map((memory) => (
            <motion.article
              key={memory.id}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
            >
              <div className="relative h-52 overflow-hidden">
                {memory.type === "Video" ? (
                  <video
                    src={memory.image}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={memory.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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
                    <p className="mt-1 text-sm text-slate-500">
                      {memory.date}
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Open menu for ${memory.title}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === memory.id ? null : memory.id,
                        )
                      }
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
                              onClick={() => {
                                if (action === "Edit") {
                                  openEditModal(memory);
                                }

                                if (action === "Delete") {
                                  openDeleteConfirmation(memory);
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
                    {memory.mood}
                  </span>
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>
      )}

      {/* Empty State - keep hidden until there are no memories.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
          *
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          No memories yet.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Start preserving your first moment.
        </p>
      </motion.section>
      */}

      <NewMemoryModal
        isOpen={isModalOpen || Boolean(memoryToEdit)}
        onClose={closeMemoryModal}
        memory={memoryToEdit}
      />

      <AnimatePresence>
        {memoryToDelete ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-memory-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.26, ease: easeOut }}
              className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-semibold text-red-600">
                !
              </div>
              <h2
                id="delete-memory-title"
                className="mt-5 text-2xl font-semibold tracking-tight text-slate-950"
              >
                Delete this memory?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will remove{" "}
                <span className="font-semibold text-slate-700">
                  {memoryToDelete.title}
                </span>{" "}
                from your memories.
              </p>

              {deleteErrorMessage ? (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {deleteErrorMessage}
                </div>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteConfirmation}
                  disabled={isDeleting}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMemory}
                  disabled={isDeleting}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/15 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? "Deleting..." : "Delete Memory"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

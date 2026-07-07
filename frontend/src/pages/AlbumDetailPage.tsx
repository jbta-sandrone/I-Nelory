import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import FeedbackDialog, {
  type FeedbackState,
} from "../components/FeedbackDialog";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";

type MemoryType = "Photo" | "Video" | "Story";

type ApiMemory = {
  id: string;
  title: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  memoryDate?: string | null;
  location?: string | null;
  isFavorite: boolean;
  createdAt: string;
};

type ApiAlbumDetail = {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  coverPublicId?: string | null;
  createdAt: string;
  memories: ApiMemory[];
};

type AlbumDetailResponse = {
  message: string;
  album: ApiAlbumDetail;
};

type UpdateAlbumResponse = {
  message: string;
  album: {
    id: string;
    name: string;
    description?: string | null;
    coverUrl?: string | null;
    coverPublicId?: string | null;
    createdAt: string;
  };
};

type Memory = {
  id: string;
  title: string;
  caption: string;
  date: string;
  mood: string;
  type: MemoryType;
  tags: string[];
  image: string | null;
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

const typeStyles: Record<MemoryType, string> = {
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

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
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
  const tags = [type, memory.isFavorite ? "Favorite" : null].filter(
    Boolean,
  ) as string[];

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    caption: memory.description?.trim() || "No description yet.",
    date: formatMemoryDate(memory.memoryDate || memory.createdAt),
    mood: location || "No location",
    type,
    tags: tags.length > 0 ? tags : ["Memory"],
    image: memory.mediaUrl?.trim() || null,
  };
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-52 overflow-hidden">
        {memory.image ? (
          memory.type === "Video" ? (
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
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105">
            M
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[memory.type]}`}
          >
            {memory.type}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-950">
            {memory.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{memory.date}</p>
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
  );
}

export default function AlbumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<ApiAlbumDetail | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isActionTransitioning, setIsActionTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null,
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const coverPreviewUrlRef = useRef("");
  const detailCoverImage =
    album?.coverUrl?.trim() ||
    memories.find((memory) => memory.image)?.image ||
    null;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAlbum() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Missing authentication token. Please log in again.");
        }

        if (!id) {
          throw new Error("Missing album id.");
        }

        const response = await fetch(
          `http://localhost:5000/api/albums/${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | AlbumDetailResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load album.");
        }

        if (!data || !("album" in data)) {
          throw new Error("Album response was empty.");
        }

        setAlbum(data.album);
        setMemories(data.album.memories.map(mapApiMemory));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAlbum(null);
        setMemories([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load album.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchAlbum();

    return () => controller.abort();
  }, [id]);

  const clearSelectedCoverImage = () => {
    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
      coverPreviewUrlRef.current = "";
    }

    setSelectedCoverImage(null);
    setCoverPreviewUrl("");
  };

  useEffect(() => {
    return () => {
      if (coverPreviewUrlRef.current) {
        URL.revokeObjectURL(coverPreviewUrlRef.current);
      }
    };
  }, []);

  const closeEditModal = () => {
    if (!isUpdating) {
      setEditErrorMessage("");
      clearSelectedCoverImage();
      setIsEditModalOpen(false);
    }
  };

  const openEditModal = () => {
    setEditErrorMessage("");
    clearSelectedCoverImage();
    setIsEditModalOpen(true);
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearSelectedCoverImage();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setEditErrorMessage("Please choose an image file.");
      clearSelectedCoverImage();
      return;
    }

    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    coverPreviewUrlRef.current = previewUrl;
    setSelectedCoverImage(file);
    setCoverPreviewUrl(previewUrl);
    setEditErrorMessage("");
  };

  const uploadAlbumCover = async (
    albumId: string,
    token: string,
    coverImage: File,
  ) => {
    const coverFormData = new FormData();
    coverFormData.append("cover", coverImage);

    const response = await fetch(
      `http://localhost:5000/api/albums/${encodeURIComponent(albumId)}/cover`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: coverFormData,
      },
    );

    const data = (await response.json().catch(() => null)) as
      | UpdateAlbumResponse
      | { message?: string }
      | null;

    if (!response.ok) {
      throw new Error(data?.message || "Failed to upload album cover.");
    }

    if (!data || !("album" in data)) {
      throw new Error("Album cover response was empty.");
    }

    return data.album;
  };

  const handleUpdateAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!album) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    setEditErrorMessage("");

    if (!name) {
      setEditErrorMessage("Album name is required.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setEditErrorMessage("Missing authentication token. Please log in again.");
      return;
    }

    const transitionStartedAt = startActionTransition();
    setIsUpdating(true);
    setIsActionTransitioning(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/albums/${encodeURIComponent(album.id)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || undefined,
          }),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | UpdateAlbumResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update album.");
      }

      if (data && "album" in data) {
        const finalAlbum = selectedCoverImage
          ? await uploadAlbumCover(data.album.id, token, selectedCoverImage)
          : data.album;

        setAlbum((currentAlbum) =>
          currentAlbum
            ? {
                ...currentAlbum,
                name: finalAlbum.name,
                description: finalAlbum.description,
                coverUrl: finalAlbum.coverUrl,
                coverPublicId: finalAlbum.coverPublicId,
              }
            : currentAlbum,
        );
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setEditErrorMessage("");
      clearSelectedCoverImage();
      setIsEditModalOpen(false);
      setFeedback({
        icon: "A",
        title: "Album Updated",
        message: "Your album has been updated.",
        type: "success",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setEditErrorMessage(
        error instanceof Error ? error.message : "Failed to update album.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.section
        variants={fadeUp}
        className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard/albums")}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
          >
            Back to Albums
          </button>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Album
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {album?.name ?? (isLoading ? "Loading album..." : "Album")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {album?.description?.trim() || "No description yet."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:min-w-44">
          <button
            type="button"
            onClick={openEditModal}
            disabled={!album}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit Album
          </button>
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            {detailCoverImage ? (
              <img
                src={detailCoverImage}
                alt=""
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700">
                A
              </div>
            )}
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-emerald-50/70 px-5 py-4 text-left shadow-sm shadow-emerald-950/5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Memories
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {memories.length}
            </p>
          </div>
        </div>
      </motion.section>

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
            Unable to load album.
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
            No memories in this album yet.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Assign memories to this album to see them here.
          </p>
        </motion.section>
      ) : (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </motion.section>
      )}

      <AnimatePresence>
        {isEditModalOpen && album ? (
          <motion.div
            className="fixed inset-0 z-50 f lex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-album-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            >
              <form
                key={album.id}
                onSubmit={handleUpdateAlbum}
                className="max-h-[90vh] overflow-y-auto p-5 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Edit Collection
                    </p>
                    <h2
                      id="edit-album-title"
                      className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      Edit Album
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Update this memory collection.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close edit album modal"
                    onClick={closeEditModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    &times;
                  </button>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-5">
                    <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border border-white bg-white/80 p-5 text-center transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/5">
                      <input
                        name="cover"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={isUpdating}
                        onChange={handleCoverImageChange}
                      />
                      {coverPreviewUrl || detailCoverImage ? (
                        <div className="w-full">
                          <img
                            src={coverPreviewUrl || detailCoverImage || ""}
                            alt=""
                            className="h-44 w-full rounded-[1.1rem] object-cover shadow-lg shadow-slate-950/10"
                          />
                          <p className="mt-4 truncate text-sm font-semibold text-slate-950">
                            {selectedCoverImage?.name || "Album cover"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                            A
                          </div>
                          <p className="mt-4 text-sm font-semibold text-slate-950">
                            Album cover
                          </p>
                          <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                            Choose an image from your device.
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Album name">
                      <input
                        name="name"
                        type="text"
                        placeholder="Family, Travel, Coding..."
                        defaultValue={album.name}
                        disabled={isUpdating}
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Description">
                      <textarea
                        name="description"
                        placeholder="Describe this collection..."
                        rows={5}
                        defaultValue={album.description ?? ""}
                        disabled={isUpdating}
                        className={`${inputClasses()} resize-none`}
                      />
                    </FormField>

                    <FormField label="Privacy">
                      <select disabled={isUpdating} className={inputClasses()}>
                        <option>Private</option>
                        <option>Shared Later</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                {editErrorMessage ? (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {editErrorMessage}
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
                  >
                    {isUpdating ? "Updating..." : "Update Album"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
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

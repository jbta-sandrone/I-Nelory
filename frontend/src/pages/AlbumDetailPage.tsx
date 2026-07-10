import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import FeedbackDialog, {
  type FeedbackState,
} from "../components/FeedbackDialog";
import MemoryMedia from "../components/MemoryMedia";
import MemoryCard from "../components/MemoryCard";
import NewMemoryModal, {
  type ApiMemory,
  type EditableMemory,
} from "../components/NewMemoryModal";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";
import { formatMoodLabel, getMemoryTagNames } from "../utils/memoryMetadata";

type MemoryType = "Photo" | "Video" | "Story";

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

type MemoryResponse = {
  message?: string;
  memory?: ApiMemory;
};

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
  mediaType: string | null;
  mediaUrl: string | null;
  tags: string[];
  image: string | null;
  favorite: boolean;
  albumId: string | null;
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
  const normalizedType = mediaType?.toUpperCase() ?? "";

  if (normalizedType === "VIDEO") {
    return "Video";
  }

  if (normalizedType.includes("STORY") || normalizedType.includes("TEXT")) {
    return "Story";
  }

  return "Photo";
}

function isVideoMemory(memory: Pick<Memory, "mediaType">) {
  return memory.mediaType?.toUpperCase() === "VIDEO";
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
  const tags = getMemoryTagNames(memory.tags);

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    description: memory.description?.trim() || "",
    caption: memory.description?.trim() || "No description yet.",
    date: formatMemoryDate(memory.memoryDate || memory.createdAt),
    memoryDate: memory.memoryDate ?? null,
    mood: location || "Neutral",
    location: location ?? null,
    type,
    mediaType: memory.mediaType ?? null,
    mediaUrl: memory.mediaUrl?.trim() || null,
    tags,
    image: memory.mediaUrl?.trim() || null,
    favorite: memory.isFavorite,
    albumId: memory.albumId ?? null,
  };
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
  const [openMemoryMenuId, setOpenMemoryMenuId] = useState<string | null>(null);
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState("");
  const [memoryToEdit, setMemoryToEdit] = useState<EditableMemory | null>(null);
  const [memoryToView, setMemoryToView] = useState<Memory | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [isDeletingMemory, setIsDeletingMemory] = useState(false);
  const [deleteMemoryErrorMessage, setDeleteMemoryErrorMessage] = useState("");
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null,
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const coverPreviewUrlRef = useRef("");
  const detailCoverImage =
    album?.coverUrl?.trim() ||
    memories.find((memory) => memory.image && memory.type !== "Video")?.image ||
    null;

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setFeedback({ type: "success", ...nextFeedback });
  }, []);

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

  useEffect(() => {
    const handleMemoryCreated = (event: Event) => {
      const createdMemory = (event as CustomEvent<ApiMemory>).detail;

      if (!createdMemory?.id) {
        return;
      }

      const createdAlbumId = createdMemory.albumId ?? null;

      if (createdAlbumId === (id ?? null)) {
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
      }
    };

    window.addEventListener("i-nelory.memory.created", handleMemoryCreated);

    return () => {
      window.removeEventListener(
        "i-nelory.memory.created",
        handleMemoryCreated,
      );
    };
  }, [id]);

  useEffect(() => {
    const handleMemoryUpdated = (event: Event) => {
      const updatedMemory = (event as CustomEvent<ApiMemory>).detail;

      if (!updatedMemory?.id) {
        return;
      }

      const updatedAlbumId = updatedMemory.albumId ?? null;

      setMemories((currentMemories) => {
        if (updatedAlbumId !== (id ?? null)) {
          return currentMemories.filter(
            (memory) => memory.id !== updatedMemory.id,
          );
        }

        return currentMemories.map((memory) =>
          memory.id === updatedMemory.id ? mapApiMemory(updatedMemory) : memory,
        );
      });
      setMemoryToEdit(null);
      setOpenMemoryMenuId(null);
      showFeedback({
        icon: "M",
        title: "Memory Updated",
        message: "Your changes have been saved.",
      });
    };

    window.addEventListener("i-nelory.memory.updated", handleMemoryUpdated);

    return () => {
      window.removeEventListener(
        "i-nelory.memory.updated",
        handleMemoryUpdated,
      );
    };
  }, [id, showFeedback]);

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

  const toggleFavorite = async (memory: Memory) => {
    const previousFavorite = memory.favorite;
    const nextFavorite = !memory.favorite;
    const transitionStartedAt = startActionTransition();

    setFavoriteErrorMessage("");
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setFavoriteErrorMessage(
        "Missing authentication token. Please log in again.",
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(
          memory.id,
        )}/favorite`,
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
        throw new Error(data?.message || "Failed to update favorite.");
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);

      if (data?.memory) {
        setMemories((currentMemories) =>
          currentMemories.map((currentMemory) =>
            currentMemory.id === memory.id
              ? mapApiMemory(data.memory as ApiMemory)
              : currentMemory,
          ),
        );
      } else {
        setMemories((currentMemories) =>
          currentMemories.map((currentMemory) =>
            currentMemory.id === memory.id
              ? { ...currentMemory, favorite: nextFavorite }
              : currentMemory,
          ),
        );
      }

      if (data?.memory?.isFavorite ?? nextFavorite) {
        showFeedback({
          icon: "\u{1F49A}",
          title: "Added to favorites \u{1F49A}",
          message: "This memory is now in Favorites.",
        });
      } else {
        showFeedback({
          icon: "\u2661",
          title: "Removed from favorites",
          message: "This memory was removed from Favorites.",
        });
      }
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setMemories((currentMemories) =>
        currentMemories.map((currentMemory) =>
          currentMemory.id === memory.id
            ? { ...currentMemory, favorite: previousFavorite }
            : currentMemory,
        ),
      );
      setFavoriteErrorMessage(
        error instanceof Error ? error.message : "Failed to update favorite.",
      );
    }
  };

  const openEditModalForMemory = (memory: Memory) => {
    setOpenMemoryMenuId(null);
    setMemoryToEdit({
      id: memory.id,
      title: memory.title,
      description: memory.description,
      memoryDate: memory.memoryDate,
      location: memory.location,
      albumId: memory.albumId,
      tags: memory.tags,
    });
  };

  const openMemoryViewer = (memory: Memory) => {
    setOpenMemoryMenuId(null);
    setMemoryToView(memory);
  };

  const closeMemoryViewer = () => {
    setMemoryToView(null);
  };

  const openDeleteConfirmation = (memory: Memory) => {
    setOpenMemoryMenuId(null);
    setDeleteMemoryErrorMessage("");
    setMemoryToDelete(memory);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeletingMemory) {
      setDeleteMemoryErrorMessage("");
      setMemoryToDelete(null);
    }
  };

  const handleDeleteMemory = async () => {
    if (!memoryToDelete) {
      return;
    }

    setDeleteMemoryErrorMessage("");
    const transitionStartedAt = startActionTransition();
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setDeleteMemoryErrorMessage("Missing authentication token. Please log in again.");
      return;
    }

    setIsDeletingMemory(true);

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

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setMemories((currentMemories) =>
        currentMemories.filter((memory) => memory.id !== memoryToDelete.id),
      );
      setMemoryToDelete(null);
      showFeedback({
        icon: "M",
        title: "Memory Deleted",
        message: "The memory has been removed.",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      const message =
        error instanceof Error ? error.message : "Failed to delete memory.";
      console.error("Delete memory failed:", error);
      setDeleteMemoryErrorMessage(message);
    } finally {
      setIsDeletingMemory(false);
    }
  };

  const archiveMemory = async (memory: Memory) => {
    const previousMemories = memories;
    const transitionStartedAt = startActionTransition();

    setFavoriteErrorMessage("");
    setOpenMemoryMenuId(null);
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setMemories(previousMemories);
      showFeedback({
        icon: "!",
        title: "Archive failed",
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
        throw new Error(data?.message || "Failed to archive memory.");
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setMemories((currentMemories) =>
        currentMemories.filter((currentMemory) => currentMemory.id !== memory.id),
      );
      showFeedback({
        icon: "\u{1F49A}",
        title: "Memory archived successfully \u{1F49A}",
        message: "This memory was moved to Archive.",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setMemories(previousMemories);
      showFeedback({
        icon: "!",
        title: "Archive failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to archive memory.",
        type: "error",
      });
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
        className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7 lg:flex-row lg:items-start lg:justify-between"
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

      {favoriteErrorMessage ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {favoriteErrorMessage}
        </motion.div>
      ) : null}

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
            <MemoryCard
              key={memory.id}
              memory={memory}
              openMenuId={openMemoryMenuId}
              onToggleMenu={(memoryId) =>
                setOpenMemoryMenuId((current) =>
                  current === memoryId ? null : memoryId,
                )
              }
              onToggleFavorite={toggleFavorite}
              onEdit={openEditModalForMemory}
              onArchive={archiveMemory}
              onDelete={openDeleteConfirmation}
              onOpen={openMemoryViewer}
            />
          ))}
        </motion.section>
      )}

      <AnimatePresence>
        {isEditModalOpen && album ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
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

      <NewMemoryModal
        isOpen={Boolean(memoryToEdit)}
        onClose={() => setMemoryToEdit(null)}
        memory={memoryToEdit}
      />

      <FeedbackDialog
        isOpen={Boolean(feedback)}
        icon={feedback?.icon ?? ""}
        title={feedback?.title ?? ""}
        message={feedback?.message}
        type={feedback?.type ?? "success"}
        onDismiss={() => setFeedback(null)}
      />

      <ActionTransitionOverlay isOpen={isActionTransitioning} />

      <AnimatePresence>
        {memoryToView ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMemoryViewer}
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
                    {memoryToView.type}
                  </p>
                  <h2
                    id="view-memory-title"
                    className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {memoryToView.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {memoryToView.date}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close memory viewer"
                  onClick={closeMemoryViewer}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                >
                  &times;
                </button>
              </div>

              <div className="bg-slate-950 p-3 sm:p-5">
                {isVideoMemory(memoryToView) && memoryToView.mediaUrl ? (
                  <video
                    src={memoryToView.mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-auto max-h-[75vh] w-full object-contain"
                  />
                ) : (
                  <MemoryMedia
                    src={memoryToView.mediaUrl}
                    type={memoryToView.mediaType}
                    className="h-auto max-h-[75vh] w-full object-contain"
                    placeholderClassName="flex h-[min(75vh,28rem)] w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-5xl font-semibold text-emerald-700"
                  />
                )}
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                <p className="text-sm leading-6 text-slate-600">
                  {memoryToView.caption}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatMoodLabel(memoryToView.mood)}
                  </span>
                  {memoryToView.tags.map((tag) => (
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

              {deleteMemoryErrorMessage ? (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {deleteMemoryErrorMessage}
                </div>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteConfirmation}
                  disabled={isDeletingMemory}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMemory}
                  disabled={isDeletingMemory}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/15 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeletingMemory ? "Deleting..." : "Delete Memory"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

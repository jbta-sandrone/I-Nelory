import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import FeedbackDialog, {
  type FeedbackState,
} from "../components/FeedbackDialog";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";

type Album = {
  id: string;
  name: string;
  description: string;
  count: string;
  updated: string;
  image: string | null;
  tags: string[];
  thumbnails: string[];
  memoryCount: number;
};

type ApiAlbumMemory = {
  id: string;
  mediaUrl?: string | null;
  createdAt: string;
};

type ApiAlbum = {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  coverPublicId?: string | null;
  memories?: ApiAlbumMemory[];
  _count?: {
    memories?: number;
  };
  createdAt: string;
  updatedAt: string;
};

type AlbumsResponse = {
  message: string;
  albums: ApiAlbum[];
};

type CreateAlbumResponse = {
  message: string;
  album: ApiAlbum;
};

type DeleteAlbumResponse = {
  message?: string;
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


function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? "memory" : "memories"}`;
}

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Updated recently";
  }

  return `Updated ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

function isPresentString(value: string | undefined): value is string {
  return Boolean(value);
}

function mapApiAlbum(album: ApiAlbum): Album {
  const thumbnails =
    album.memories
      ?.map((memory) => memory.mediaUrl?.trim())
      .filter(isPresentString)
      .slice(0, 3) ?? [];
  const memoryCount = album._count?.memories ?? thumbnails.length;

  return {
    id: album.id,
    name: album.name,
    description: album.description?.trim() || "No description yet.",
    count: formatCount(memoryCount),
    updated: formatUpdatedAt(album.updatedAt),
    image: album.coverUrl?.trim() || thumbnails[0] || null,
    tags: [memoryCount > 0 ? "Has memories" : "Empty album"],
    thumbnails,
    memoryCount,
  };
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

function ThumbnailStack({ images }: { images: string[] }) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="flex -space-x-3">
      {images.map((image) => (
        <img
          key={image}
          src={image}
          alt=""
          className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
        />
      ))}
    </div>
  );
}

function AlbumCard({
  album,
  openMenuId,
  onToggleMenu,
  onOpen,
  onEdit,
  onDelete,
}: {
  album: Album;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onOpen: (album: Album) => void;
  onEdit: (album: Album) => void;
  onDelete: (album: Album) => void;
}) {
  return (
    <motion.article
      role="button"
      tabIndex={0}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      onClick={() => onOpen(album)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(album);
        }
      }}
      className="group relative min-w-0 cursor-pointer overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-44 overflow-hidden">
        {album.image ? (
          <img
            src={album.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105">
            A
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
        <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-lg text-emerald-700 shadow-sm backdrop-blur">
          ▣
        </div>
        <div className="absolute right-3 top-3">
          <button
            type="button"
            aria-label={`Open menu for ${album.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu(album.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-slate-500 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-emerald-700"
          >
            ⋯
          </button>

          <AnimatePresence>
            {openMenuId === album.id ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
              >
                {["Edit", "Delete"].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (action === "Edit") {
                        onEdit(album);
                      }

                      if (action === "Delete") {
                        onDelete(album);
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

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {album.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-emerald-700">
              {album.count}
            </p>
          </div>
          <ThumbnailStack images={album.thumbnails} />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {album.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {album.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
          {album.updated}
        </p>
      </div>
    </motion.article>
  );
}

export default function AlbumsPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isActionTransitioning, setIsActionTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(
    null,
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const coverPreviewUrlRef = useRef("");

  const featuredAlbum = albums[0] ?? null;
  const stats = useMemo(() => {
    const totalMemories = albums.reduce(
      (total, album) => total + album.memoryCount,
      0,
    );
    const largestAlbum = albums.reduce<Album | null>(
      (largest, album) =>
        !largest || album.memoryCount > largest.memoryCount ? album : largest,
      null,
    );

    return [
      { label: "Total Albums", value: String(albums.length), icon: "A" },
      {
        label: "Memories in Albums",
        value: String(totalMemories),
        icon: "M",
      },
      {
        label: "Most Recent Album",
        value: albums[0]?.name ?? "None",
        icon: "R",
      },
      {
        label: "Largest Album",
        value: largestAlbum?.name ?? "None",
        icon: "L",
      },
    ];
  }, [albums]);

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

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAlbums() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Missing authentication token. Please log in again.");
        }

        const response = await fetch("http://localhost:5000/api/albums", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as
          | AlbumsResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load albums.");
        }

        setAlbums(
          data && "albums" in data ? data.albums.map(mapApiAlbum) : [],
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAlbums([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load albums.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchAlbums();

    return () => controller.abort();
  }, []);

  const closeCreateModal = () => {
    if (!isCreating) {
      setCreateErrorMessage("");
      setAlbumToEdit(null);
      clearSelectedCoverImage();
      setIsModalOpen(false);
    }
  };

  const openCreateModal = () => {
    setCreateErrorMessage("");
    setAlbumToEdit(null);
    clearSelectedCoverImage();
    setIsModalOpen(true);
  };

  const openEditModal = (album: Album) => {
    setOpenMenuId(null);
    setCreateErrorMessage("");
    setAlbumToEdit(album);
    clearSelectedCoverImage();
    setIsModalOpen(true);
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearSelectedCoverImage();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setCreateErrorMessage("Please choose an image file.");
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
    setCreateErrorMessage("");
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
      | CreateAlbumResponse
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

  const openDeleteConfirmation = (album: Album) => {
    setOpenMenuId(null);
    setDeleteErrorMessage("");
    setAlbumToDelete(album);
  };

  const openAlbumDetail = (album: Album) => {
    navigate(`/dashboard/albums/${encodeURIComponent(album.id)}`);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeleting) {
      setDeleteErrorMessage("");
      setAlbumToDelete(null);
    }
  };

  const handleSaveAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isEditing = Boolean(albumToEdit);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    setCreateErrorMessage("");

    if (!name) {
      setCreateErrorMessage("Album name is required.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setCreateErrorMessage("Missing authentication token. Please log in again.");
      return;
    }

    setIsCreating(true);
    const transitionStartedAt = startActionTransition();
    setIsActionTransitioning(true);

    try {
      const response = await fetch(
        albumToEdit
          ? `http://localhost:5000/api/albums/${encodeURIComponent(
              albumToEdit.id,
            )}`
          : "http://localhost:5000/api/albums",
        {
        method: albumToEdit ? "PATCH" : "POST",
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
        | CreateAlbumResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditing ? "Failed to update album." : "Failed to create album."),
        );
      }

      if (data && "album" in data) {
        const finalAlbum = selectedCoverImage
          ? await uploadAlbumCover(data.album.id, token, selectedCoverImage)
          : data.album;
        const savedAlbum = mapApiAlbum(finalAlbum);

        setAlbums((currentAlbums) =>
          isEditing
            ? currentAlbums.map((album) =>
                album.id === savedAlbum.id ? savedAlbum : album,
              )
            : [savedAlbum, ...currentAlbums],
        );
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      form.reset();
      setCreateErrorMessage("");
      setAlbumToEdit(null);
      clearSelectedCoverImage();
      setIsModalOpen(false);
      setFeedback({
        icon: "A",
        title: isEditing ? "Album Updated" : "Album Created",
        message: isEditing
          ? "Your album has been updated."
          : "Your album has been created.",
        type: "success",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setCreateErrorMessage(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update album."
            : "Failed to create album.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!albumToDelete) {
      return;
    }

    setDeleteErrorMessage("");
    const transitionStartedAt = startActionTransition();
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      const message = "Missing authentication token. Please log in again.";
      setDeleteErrorMessage(message);
      setFeedback({
        icon: "!",
        title: "Delete failed",
        message,
        type: "error",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/albums/${encodeURIComponent(
          albumToDelete.id,
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = (await response.json().catch(() => null)) as
        | DeleteAlbumResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete album.");
      }

      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setAlbums((currentAlbums) =>
        currentAlbums.filter((album) => album.id !== albumToDelete.id),
      );
      setAlbumToDelete(null);
      setFeedback({
        icon: "A",
        title: "Album Deleted",
        message: data?.message || "Album deleted successfully 💚",
        type: "success",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      const message =
        error instanceof Error ? error.message : "Failed to delete album.";
      setDeleteErrorMessage(message);
      setFeedback({
        icon: "!",
        title: "Delete failed",
        message,
        type: "error",
      });
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
            Collections
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Albums
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Organize your memories into beautiful collections.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Album
        </button>
      </motion.section>

      {/* Album Stats */}
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

      {featuredAlbum ? (
      <motion.section
        role="button"
        tabIndex={0}
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35 }}
        onClick={() => openAlbumDetail(featuredAlbum)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openAlbumDetail(featuredAlbum);
          }
        }}
        className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      >
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
            {featuredAlbum.image ? (
              <img
                src={featuredAlbum.image}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full min-h-[18rem] w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-5xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105">
                A
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4">
              <ThumbnailStack images={featuredAlbum.thumbnails} />
              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                Featured Album
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {featuredAlbum.count}
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {featuredAlbum.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {featuredAlbum.description}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {featuredAlbum.updated}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {featuredAlbum.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
      ) : null}

      {/* Album Grid */}
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
              <div className="h-44 animate-pulse bg-slate-100" />
              <div className="space-y-4 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
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
            Unable to load albums.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>
        </motion.section>
      ) : albums.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-semibold text-emerald-700">
            A
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No albums yet.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first collection of memories.
          </p>
        </motion.section>
      ) : (
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            openMenuId={openMenuId}
            onToggleMenu={(id) =>
              setOpenMenuId((current) => (current === id ? null : id))
            }
            onOpen={openAlbumDetail}
            onEdit={openEditModal}
            onDelete={openDeleteConfirmation}
          />
        ))}
      </motion.section>
      )}

      {/* New Album Modal */}
      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-album-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            >
              <form
                key={albumToEdit?.id ?? "new-album"}
                onSubmit={handleSaveAlbum}
                className="max-h-[90vh] overflow-y-auto p-5 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      {albumToEdit ? "Edit Collection" : "Create Collection"}
                    </p>
                    <h2
                      id="new-album-title"
                      className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      {albumToEdit ? "Edit Album" : "New Album"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {albumToEdit
                        ? "Update this memory collection."
                        : "Organize a new memory collection."}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close new album modal"
                    onClick={closeCreateModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    ×
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
                        disabled={isCreating}
                        onChange={handleCoverImageChange}
                      />
                      {coverPreviewUrl || albumToEdit?.image ? (
                        <div className="w-full">
                          <img
                            src={coverPreviewUrl || albumToEdit?.image || ""}
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
                        defaultValue={albumToEdit?.name ?? ""}
                        disabled={isCreating}
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Description">
                      <textarea
                        name="description"
                        placeholder="Describe this collection..."
                        rows={5}
                        defaultValue={
                          albumToEdit?.description === "No description yet."
                            ? ""
                            : albumToEdit?.description ?? ""
                        }
                        disabled={isCreating}
                        className={`${inputClasses()} resize-none`}
                      />
                    </FormField>

                    <FormField label="Privacy">
                      <select disabled={isCreating} className={inputClasses()}>
                        <option>Private</option>
                        <option>Shared Later</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                {createErrorMessage ? (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {createErrorMessage}
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isCreating}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
                  >
                    {isCreating
                      ? albumToEdit
                        ? "Updating..."
                        : "Creating..."
                      : albumToEdit
                        ? "Update Album"
                        : "Create Album"}
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

      <AnimatePresence>
        {albumToDelete ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-album-title"
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
                id="delete-album-title"
                className="mt-5 text-2xl font-semibold tracking-tight text-slate-950"
              >
                Delete this album?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will remove{" "}
                <span className="font-semibold text-slate-700">
                  {albumToDelete.name}
                </span>{" "}
                from your albums. Memories inside it will stay saved.
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
                  onClick={handleDeleteAlbum}
                  disabled={isDeleting}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/15 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? "Deleting..." : "Delete Album"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}


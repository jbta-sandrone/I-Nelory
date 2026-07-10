import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { MouseEvent } from "react";
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
import {
  MOOD_OPTIONS,
  formatMoodLabel,
  getMemoryTagNames,
} from "../utils/memoryMetadata";

type FavoriteMemory = {
  id: string;
  title: string;
  date: string;
  caption: string;
  mood: string;
  album: string;
  tags: string[];
  image: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  type: "Photo" | "Video" | "Story";
  favorite: boolean;
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

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function getMemoryType(mediaType?: string | null): FavoriteMemory["type"] {
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

function mapApiMemory(memory: ApiMemory): FavoriteMemory {
  const type = getMemoryType(memory.mediaType);
  const location = memory.location?.trim();
  const album = memory.albumId ? "Album" : "Memory";
  const tags = getMemoryTagNames(memory.tags);

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    date: formatMemoryDate(memory.memoryDate),
    caption: memory.description?.trim() || "No description yet.",
    mood: location || "Neutral",
    album,
    tags,
    image: memory.mediaUrl?.trim() || null,
    mediaUrl: memory.mediaUrl?.trim() || null,
    mediaType: memory.mediaType ?? null,
    type,
    favorite: memory.isFavorite,
  };
}

function getMostLovedAlbum(favorites: FavoriteMemory[]) {
  if (favorites.length === 0) {
    return "None";
  }

  const albumCounts = favorites.reduce<Record<string, number>>(
    (counts, favorite) => ({
      ...counts,
      [favorite.album]: (counts[favorite.album] ?? 0) + 1,
    }),
    {},
  );

  return Object.entries(albumCounts).sort((a, b) => b[1] - a[1])[0][0];
}

function FavoriteHeart({
  label,
  onClick,
}: {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
    >
      {"\u2665"}
    </motion.button>
  );
}

function FavoriteCard({
  favorite,
  openMenuId,
  onToggleMenu,
  onToggleFavorite,
  onArchive,
  onOpen,
}: {
  favorite: FavoriteMemory;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onToggleFavorite: (favorite: FavoriteMemory) => void;
  onArchive: (favorite: FavoriteMemory) => void;
  onOpen: (favorite: FavoriteMemory) => void;
}) {
  const isVideo = favorite.mediaType?.toUpperCase() === "VIDEO";
  const visibleTags = favorite.tags.slice(0, 3);
  const hiddenTagCount = Math.max(favorite.tags.length - visibleTags.length, 0);

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      onClick={() => onOpen(favorite)}
    >
      <div className="relative h-52 overflow-hidden">
        <MemoryMedia
          src={favorite.mediaUrl}
          type={favorite.mediaType ?? favorite.type}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          showPlayOverlay={isVideo}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {favorite.type}
          </span>
          <FavoriteHeart
            label={`Remove ${favorite.title} from favorites`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(favorite);
            }}
          />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {favorite.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{favorite.date}</p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={`Open menu for ${favorite.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu(favorite.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
            >
              &hellip;
            </button>

            <AnimatePresence>
              {openMenuId === favorite.id ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                >
                  {["Remove from Favorites", "View", "Archive"].map(
                    (action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (action === "Remove from Favorites") {
                            onToggleFavorite(favorite);
                          }

                          if (action === "View") {
                            onOpen(favorite);
                          }

                          if (action === "Archive") {
                            onArchive(favorite);
                          }
                        }}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        {action}
                      </button>
                    ),
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {favorite.caption}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatMoodLabel(favorite.mood)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {favorite.album}
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

export default function FavoritesPage() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [favoriteMemories, setFavoriteMemories] = useState<FavoriteMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isActionTransitioning, setIsActionTransitioning] = useState(false);
  const [memoryToView, setMemoryToView] = useState<FavoriteMemory | null>(null);

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setFeedback({ type: "success", ...nextFeedback });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFavorites() {
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

        const data = (await response.json().catch(() => null)) as
          | MemoriesResponse
          | { message?: string }
          | null;

        if (!response.ok || !data || !("memories" in data)) {
          throw new Error(data?.message || "Failed to fetch favorites.");
        }

        setFavoriteMemories(
          data.memories.map(mapApiMemory).filter((memory) => memory.favorite),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setFavoriteMemories([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch favorites.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchFavorites();

    return () => controller.abort();
  }, []);

  const toggleFavorite = async (favorite: FavoriteMemory) => {
    const previousFavorites = favoriteMemories;
    const transitionStartedAt = startActionTransition();

    setFavoriteErrorMessage("");
    setOpenMenuId(null);
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setFavoriteMemories(previousFavorites);
      showFeedback({
        icon: "!",
        title: "Favorite update failed",
        message: "Missing authentication token. Please log in again.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(
          favorite.id,
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
      setFavoriteMemories((currentFavorites) =>
        currentFavorites.filter((memory) => memory.id !== favorite.id),
      );

      if (data?.memory?.isFavorite) {
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
      setFavoriteMemories(previousFavorites);
      showFeedback({
        icon: "!",
        title: "Favorite update failed",
        message:
          error instanceof Error ? error.message : "Failed to update favorite.",
        type: "error",
      });
    }
  };

  const archiveFavorite = async (favorite: FavoriteMemory) => {
    const previousFavorites = favoriteMemories;
    const transitionStartedAt = startActionTransition();

    setFavoriteErrorMessage("");
    setOpenMenuId(null);
    setIsActionTransitioning(true);

    const token = getStoredToken();

    if (!token) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setFavoriteMemories(previousFavorites);
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
          favorite.id,
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
      setFavoriteMemories((currentFavorites) =>
        currentFavorites.filter((memory) => memory.id !== favorite.id),
      );
      showFeedback({
        icon: "\u{1F49A}",
        title: "Memory archived successfully \u{1F49A}",
        message: "This memory was moved to Archive.",
      });
    } catch (error) {
      await waitForActionTransition(transitionStartedAt);
      setIsActionTransitioning(false);
      setFavoriteMemories(previousFavorites);
      showFeedback({
        icon: "!",
        title: "Archive failed",
        message:
          error instanceof Error ? error.message : "Failed to archive memory.",
        type: "error",
      });
    }
  };

  const openMemoryViewer = (favorite: FavoriteMemory) => {
    setOpenMenuId(null);
    setMemoryToView(favorite);
  };

  const stats = [
    {
      label: "Total Favorites",
      value: String(favoriteMemories.length),
      icon: "\u2661",
    },
    {
      label: "Favorite Photos",
      value: String(
        favoriteMemories.filter((favorite) => favorite.type === "Photo").length,
      ),
      icon: "\u25c7",
    },
    {
      label: "Favorite Videos",
      value: String(
        favoriteMemories.filter((favorite) => favorite.type === "Video").length,
      ),
      icon: "\u25b7",
    },
    {
      label: "Most Loved Album",
      value: getMostLovedAlbum(favoriteMemories),
      icon: "\u25a3",
    },
  ];
  const featuredFavorite = favoriteMemories[0] ?? null;

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
            Most Meaningful
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              {"\u2661"}
            </span>
            Favorites
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Revisit the moments you never want to lose.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Memory
        </button>
      </motion.section>

      {favoriteErrorMessage ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {favoriteErrorMessage}
        </motion.div>
      ) : null}

      {/* Favorite Stats */}
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

      {/* Featured Favorite */}
      {featuredFavorite ? (
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.35 }}
          className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
          onClick={() => openMemoryViewer(featuredFavorite)}
        >
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
              <MemoryMedia
                src={featuredFavorite.mediaUrl}
                type={featuredFavorite.mediaType ?? featuredFavorite.type}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                showPlayOverlay={featuredFavorite.mediaType?.toUpperCase() === "VIDEO"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
              <div className="absolute right-5 top-5">
                <FavoriteHeart
                  label={`Remove ${featuredFavorite.title} from favorites`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(featuredFavorite);
                  }}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
              <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Featured Favorite
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {featuredFavorite.title}
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-500">
                {featuredFavorite.date}
              </p>
              <p className="mt-5 text-base leading-7 text-slate-600">
                {featuredFavorite.caption}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {formatMoodLabel(featuredFavorite.mood)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {featuredFavorite.album}
                </span>
                {featuredFavorite.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
                {featuredFavorite.tags.length > 3 ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    +{featuredFavorite.tags.length - 3} more
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}

      {/* Filter Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search favorites"
            className={inputClasses()}
          />

          <select aria-label="Filter by album" className={inputClasses()}>
            <option>All albums</option>
            <option>Memory</option>
            <option>Album</option>
          </select>

          <select aria-label="Filter by mood" className={inputClasses()}>
            <option>All moods</option>
            {MOOD_OPTIONS.map((mood) => (
              <option key={mood.name}>{mood.name}</option>
            ))}
          </select>

          <select aria-label="Sort favorites" className={inputClasses()}>
            <option>Newest</option>
            <option>Oldest</option>
            <option>Recently Favorited</option>
          </select>
        </div>
      </motion.section>

      {/* Favorites Grid */}
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
            Unable to load favorites.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>
        </motion.section>
      ) : favoriteMemories.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-semibold text-emerald-700">
            {"\u2661"}
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No favorite memories yet.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Tap the heart on memories you want to keep close.
          </p>
        </motion.section>
      ) : (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {favoriteMemories.map((favorite) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              openMenuId={openMenuId}
              onToggleMenu={(id) =>
                setOpenMenuId((current) => (current === id ? null : id))
              }
              onToggleFavorite={toggleFavorite}
              onArchive={archiveFavorite}
              onOpen={openMemoryViewer}
            />
          ))}
        </motion.section>
      )}

      <MemoryViewerModal
        memory={memoryToView}
        onClose={() => setMemoryToView(null)}
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
    </motion.div>
  );
}

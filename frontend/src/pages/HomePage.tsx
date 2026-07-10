import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MemoryMedia from "../components/MemoryMedia";
import {
  getDashboardSummary,
  type DashboardAlbum,
  type DashboardMemory,
  type DashboardSummary,
} from "../services/dashboard";
import { formatMoodLabel, getMemoryTagNames } from "../utils/memoryMetadata";

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
      duration: 0.55,
      ease: easeOut,
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const quotes = [
  "Moments pass. Memories stay.",
  "Every memory tells a story.",
  "Your memories deserve a beautiful home.",
];

const quickActions = [
  {
    title: "New Memory",
    description: "Save a photo, video, or story.",
    icon: "+",
    path: "/dashboard/memories",
  },
  {
    title: "Create Album",
    description: "Group meaningful moments.",
    icon: "□",
    path: "/dashboard/albums",
  },
  {
    title: "AI Search",
    description: "Find memories naturally.",
    icon: "✦",
    path: "/dashboard/ai-search",
  },
];

const suggestions = [
  "Show beach trips.",
  "Find birthday memories.",
  "Show graduation photos.",
];

const emptySummary: DashboardSummary = {
  stats: {
    memories: 0,
    albums: 0,
    favorites: 0,
    archived: 0,
  },
  memoryOfTheDay: null,
  recentMemories: [],
  recentAlbums: [],
  onThisDay: [],
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 18) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function getFirstName(authUser?: {
  fullName?: string | null;
  username?: string | null;
} | null) {
  const displayName = authUser?.fullName || authUser?.username;

  if (!displayName?.trim()) {
    return "Memory Keeper";
  }

  return displayName.trim().split(/\s+/)[0] || "Memory Keeper";
}

function formatMemoryDate(date?: string | Date | null) {
  if (!date) {
    return "Undated memory";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Undated memory";
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMediaUrl(memory?: DashboardMemory | null) {
  if (!memory) {
    return "";
  }

  if (memory.mediaUrl) {
    return memory.mediaUrl;
  }

  if (memory.imageUrl) {
    return memory.imageUrl;
  }

  if (Array.isArray(memory.media) && memory.media.length > 0) {
    const firstMedia = memory.media[0];

    if (typeof firstMedia === "string") {
      return firstMedia;
    }

    return firstMedia?.url || "";
  }

  return "";
}

function getMemoryMediaType(memory?: DashboardMemory | null) {
  return memory?.mediaType?.trim().toUpperCase() === "VIDEO" ? "video" : "image";
}

function isVideoDashboardMemory(memory?: DashboardMemory | null) {
  return getMemoryMediaType(memory) === "video";
}

function getAlbumCoverUrl(album?: DashboardAlbum | null) {
  return album?.coverUrl || album?.imageUrl || "";
}

function getMemoryTitle(memory: DashboardMemory) {
  return memory.title || "Untitled memory";
}

function getMemoryMood(memory?: DashboardMemory | null) {
  return memory?.location?.trim() || "Neutral";
}

function getAlbumTitle(album: DashboardAlbum) {
  return album.title || album.name || "Untitled album";
}

function getYearsAgoText(date?: string | Date | null) {
  if (!date) {
    return "On this day";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "On this day";
  }

  const years = new Date().getFullYear() - parsedDate.getFullYear();

  if (years <= 0) {
    return "Today";
  }

  return `${years} ${years === 1 ? "year" : "years"} ago today`;
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-32 rounded-full bg-emerald-100" />
        <div className="h-8 w-2/3 rounded-full bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 rounded-[1.5rem] border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(authUser), [authUser]);

  const stats = useMemo(
    () => [
      { title: "Total Memories", value: summary.stats.memories, icon: "◇" },
      { title: "Albums", value: summary.stats.albums, icon: "□" },
      { title: "Favorites", value: summary.stats.favorites, icon: "♡" },
      { title: "Archived", value: summary.stats.archived, icon: "◫" },
    ],
    [summary.stats],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % quotes.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");
        const dashboardSummary = await getDashboardSummary();

        if (isMounted) {
          setSummary(dashboardSummary);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Dashboard summary could not load.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const openMemory = () => {
    navigate("/dashboard/memories");
  };

  const goToAiSearch = () => {
    navigate("/dashboard/ai-search");
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Welcome Hero */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-slate-100 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-semibold text-emerald-700">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Welcome back to your digital memory.
          </p>

          <div className="mt-5 min-h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={quotes[quoteIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="text-sm font-medium text-slate-500"
              >
                "{quotes[quoteIndex]}"
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {isLoading ? <LoadingCard /> : null}

      {error ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm shadow-rose-950/5 sm:p-6"
        >
          <p className="font-semibold">Dashboard could not load.</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
        </motion.section>
      ) : null}

      {!isLoading ? (
        <>
          {/* Memory of the Day */}
          <motion.section
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.35 }}
            className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
          >
            {summary.memoryOfTheDay ? (
              <button
                type="button"
                onClick={openMemory}
                className="block w-full text-left"
              >
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative min-h-[18rem] overflow-hidden bg-emerald-50 sm:min-h-[22rem] lg:min-h-full">
                    <MemoryMedia
                      key={`${summary.memoryOfTheDay.id}-${summary.memoryOfTheDay.mediaType ?? "image"}-${getMediaUrl(summary.memoryOfTheDay)}`}
                      src={getMediaUrl(summary.memoryOfTheDay)}
                      type={getMemoryMediaType(summary.memoryOfTheDay)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      showPlayOverlay={isVideoDashboardMemory(summary.memoryOfTheDay)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
                  </div>

                  <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
                    <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Memory of the Day
                    </span>
                    <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {getMemoryTitle(summary.memoryOfTheDay)}
                    </h2>
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      {formatMemoryDate(summary.memoryOfTheDay.memoryDate)}
                    </p>
                    <p className="mt-5 line-clamp-4 text-base leading-7 text-slate-600">
                      {summary.memoryOfTheDay.description ||
                        summary.memoryOfTheDay.content ||
                        "A saved moment from your memory collection."}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formatMoodLabel(getMemoryMood(summary.memoryOfTheDay))}
                      </span>
                      {getMemoryTagNames(summary.memoryOfTheDay.tags)
                        .slice(0, 4)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-6 sm:p-8">
                <EmptyState
                  title="No memory of the day yet."
                  description="Save a memory with a photo or video and I-Nelory will feature it here."
                />
              </div>
            )}
          </motion.section>

          {/* Statistics */}
          <motion.section
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.article
                key={stat.title}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ duration: 0.35 }}
                className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-semibold text-emerald-700">
                    {stat.icon}
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
              </motion.article>
            ))}
          </motion.section>

          {/* Recent Memories */}
          <motion.section
            variants={fadeUp}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
          >
            <SectionHeader
              eyebrow="Recent Memories"
              title="Moments you saved lately"
            />

            {summary.recentMemories.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {summary.recentMemories.slice(0, 6).map((memory) => (
                  <motion.article
                    key={memory.id}
                    variants={fadeUp}
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ duration: 0.35 }}
                    className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/70 shadow-sm shadow-slate-950/5 transition duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10"
                  >
                    <button
                      type="button"
                      onClick={openMemory}
                      className="block w-full text-left"
                    >
                      <div className="relative h-44 overflow-hidden bg-emerald-50">
                        <MemoryMedia
                          src={getMediaUrl(memory)}
                          type={getMemoryMediaType(memory)}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          showPlayOverlay={isVideoDashboardMemory(memory)}
                        />
                        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur">
                          {memory.isFavorite ? "♥" : "♡"}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-base font-semibold text-slate-950">
                          {getMemoryTitle(memory)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatMemoryDate(memory.memoryDate)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {formatMoodLabel(getMemoryMood(memory))}
                          </span>
                          {getMemoryTagNames(memory.tags)
                            .slice(0, 2)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </button>
                  </motion.article>
                ))}
              </motion.div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No memories yet."
                  description="Create your first memory and your latest moments will appear here."
                />
              </div>
            )}
          </motion.section>

          {/* Albums and Quick Actions */}
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <motion.section
              variants={fadeUp}
              className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
            >
              <SectionHeader
                eyebrow="Recent Albums"
                title="Collections with a story"
              />

              {summary.recentAlbums.length > 0 ? (
                <motion.div
                  variants={staggerContainer}
                  className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  {summary.recentAlbums.slice(0, 4).map((album) => (
                    <motion.article
                      key={album.id}
                      variants={fadeUp}
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ duration: 0.35 }}
                      className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/70 transition duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/10"
                    >
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard/albums")}
                        className="block w-full text-left"
                      >
                        <div className="h-28 overflow-hidden bg-emerald-50">
                          {getAlbumCoverUrl(album) ? (
                            <img
                              src={getAlbumCoverUrl(album)}
                              alt=""
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : null}
                        </div>
                        <div className="p-4">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            □
                          </div>
                          <h3 className="truncate text-base font-semibold text-slate-950">
                            {getAlbumTitle(album)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {(album.memoryCount ?? album._count?.memories ?? 0)
                              .toLocaleString()}{" "}
                            memories
                          </p>
                        </div>
                      </button>
                    </motion.article>
                  ))}
                </motion.div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="No albums yet."
                    description="Create an album to group your memories into a collection."
                  />
                </div>
              )}
            </motion.section>

            <motion.section
              variants={fadeUp}
              className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
            >
              <SectionHeader eyebrow="Quick Actions" title="Start from here" />

              <motion.div variants={staggerContainer} className="mt-6 space-y-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.title}
                    type="button"
                    onClick={() => navigate(action.path)}
                    variants={fadeUp}
                    whileHover={{ x: 4, scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                    className="flex w-full min-w-0 items-center gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 text-left transition duration-300 hover:border-emerald-200 hover:bg-emerald-50/70 hover:shadow-md hover:shadow-emerald-950/5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-emerald-700 shadow-sm">
                      {action.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-950">
                        {action.title}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {action.description}
                      </span>
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.section>
          </div>

          {/* AI Search and On This Day */}
          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <motion.section
              variants={fadeUp}
              className="relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6"
            >
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  AI Memory Search
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ask for a memory naturally.
                </h2>
                <button
                  type="button"
                  onClick={goToAiSearch}
                  className="mt-6 block w-full rounded-[1.25rem] border border-white/10 bg-white p-3 text-left shadow-2xl shadow-black/20"
                >
                  <span className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-emerald-300 hover:ring-4 hover:ring-emerald-100">
                    Ask AI to find a memory...
                  </span>
                </button>

                <div className="mt-5 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={goToAiSearch}
                      className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              variants={fadeUp}
              className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
            >
              <SectionHeader eyebrow="On This Day" title="Returned memories" />

              {summary.onThisDay.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {summary.onThisDay.slice(0, 3).map((memory) => (
                    <motion.article
                      key={memory.id}
                      variants={fadeUp}
                      className="roup grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 transition duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/10 sm:grid-cols-[6.5rem_1fr]"
                    >
                      <div className="relative h-28 overflow-hidden rounded-2xl bg-emerald-50 sm:h-full">
                        <MemoryMedia
                          src={getMediaUrl(memory)}
                          type={getMemoryMediaType(memory)}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          showPlayOverlay={isVideoDashboardMemory(memory)}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          {getYearsAgoText(memory.memoryDate)}
                        </p>
                        <h3 className="mt-2 truncate text-base font-semibold text-slate-950">
                          {getMemoryTitle(memory)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatMemoryDate(memory.memoryDate)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {formatMoodLabel(getMemoryMood(memory))}
                          </span>
                          {getMemoryTagNames(memory.tags)
                            .slice(0, 2)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                        <button
                          type="button"
                          onClick={openMemory}
                          className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
                        >
                          View Memory
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="No memories from this day yet."
                    description="Create memories today and I-Nelory will bring them back in future years."
                  />
                </div>
              )}
            </motion.section>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

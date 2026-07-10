import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import MemoryMedia from "../components/MemoryMedia";
import { getMemoryTagNames, type ApiTag } from "../utils/memoryMetadata";

type MemoryType = "Photo" | "Video" | "Story";

type ApiMemory = {
  id: string;
  title?: string | null;
  description?: string | null;
  mediaType?: "image" | "video" | "IMAGE" | "VIDEO" | null;
  mediaUrl?: string | null;
  memoryDate?: string | null;
  createdAt: string;
  location?: string | null;
  tags?: ApiTag[];
  isFavorite: boolean;
  isArchived: boolean;
  albumId?: string | null;
};

type TimelineMemory = {
  id: string;
  year: string;
  month: string;
  title: string;
  date: string;
  caption: string;
  location: string;
  type: MemoryType;
  tags: string[];
  image: string | null;
  favorite: boolean;
};

type TimelineYearGroup = {
  year: string;
  memories: TimelineMemory[];
};

type MemoriesResponse = {
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
      duration: 0.55,
      ease: easeOut,
    },
  },
};

const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -28,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: easeOut,
    },
  },
};

const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 28,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
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

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function getMemoryType(mediaType?: string | null): MemoryType {
  const normalizedType = mediaType?.toUpperCase() ?? "";

  if (normalizedType.includes("VIDEO")) {
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

function getMemoryYear(memoryDate?: string | null, createdAt?: string): string {
  const dateToUse = memoryDate ?? createdAt;
  if (!dateToUse) {
    return "Unknown";
  }

  const date = new Date(dateToUse);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.getFullYear().toString();
}

function getMemoryMonth(memoryDate?: string | null, createdAt?: string): string {
  const dateToUse = memoryDate ?? createdAt;
  if (!dateToUse) {
    return "Unknown";
  }

  const date = new Date(dateToUse);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", { month: "long" }).format(date);
}

function mapApiMemory(memory: ApiMemory): TimelineMemory {
  const year = getMemoryYear(memory.memoryDate, memory.createdAt);
  const month = getMemoryMonth(memory.memoryDate, memory.createdAt);
  const type = getMemoryType(memory.mediaType);
  const location = memory.location?.trim() || "Unknown location";
  const tags = getMemoryTagNames(memory.tags);

  return {
    id: memory.id,
    year,
    month,
    title: memory.title?.trim() || "Untitled memory",
    date: formatMemoryDate(memory.memoryDate || memory.createdAt),
    caption: memory.description?.trim() || "No description yet.",
    location,
    type,
    tags,
    image: memory.mediaUrl?.trim() || null,
    favorite: memory.isFavorite,
  };
}

function groupMemoriesByYear(memories: TimelineMemory[]): TimelineYearGroup[] {
  // Group memories by year
  const grouped: Record<string, TimelineMemory[]> = {};

  memories.forEach((memory) => {
    if (!grouped[memory.year]) {
      grouped[memory.year] = [];
    }
    grouped[memory.year].push(memory);
  });

  // Sort each year's memories by date (newest first)
  Object.keys(grouped).forEach((year) => {
    grouped[year].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    });
  });

  // Sort years from newest to oldest
  const sortedYears = Object.keys(grouped).sort((a, b) => {
    return parseInt(b) - parseInt(a);
  });

  return sortedYears.map((year) => ({
    year,
    memories: grouped[year],
  }));
}


const typeStyles: Record<MemoryType, string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function scrollToYear(year: string) {
  document.getElementById(`timeline-${year}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function TimelineCard({
  memory,
  alignRight,
}: {
  memory: TimelineMemory;
  alignRight: boolean;
}) {
  return (
    <motion.article
      variants={alignRight ? slideInRight : slideInLeft}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-56 overflow-hidden">
        <MemoryMedia
          src={memory.image}
          type={memory.type}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          placeholderClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105"
          showPlayOverlay={memory.type === "Video"}
        />
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
            {memory.favorite ? "♥" : "♡"}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{memory.date}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {memory.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {memory.caption}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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

        <div className="grid gap-3 overflow-hidden rounded-2xl bg-slate-50 p-0 text-sm text-slate-600 opacity-0 transition-all duration-300 group-hover:p-4 group-hover:opacity-100 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-950">Mood:</span>{" "}
            {memory.location}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function TimelinePage() {
  const [timelineYears, setTimelineYears] = useState<TimelineYearGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
        
        // Filter out archived memories and map to TimelineMemory
        const activeMemories = data.memories
          .filter((memory) => !memory.isArchived)
          .map(mapApiMemory);

        // Group by year and sort
        const grouped = groupMemoriesByYear(activeMemories);
        setTimelineYears(grouped);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTimelineYears([]);
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

  const years = timelineYears.map((group) => group.year);

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
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Memory Path
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
                ◷
              </span>
              Timeline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Travel through your memories, one moment at a time.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Timeline Controls */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search memories"
            className={inputClasses()}
          />

          <select aria-label="Filter by year" className={inputClasses()}>
            <option>All years</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select aria-label="Filter by month" className={inputClasses()}>
            <option>All months</option>
          </select>

          <select aria-label="Filter by type" className={inputClasses()}>
            <option>All types</option>
            <option>Photos</option>
            <option>Videos</option>
            <option>Stories</option>
          </select>

          <select aria-label="Sort timeline" className={inputClasses()}>
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
        </div>

        <div className="mt-4 lg:hidden">
          <select
            aria-label="Jump to year"
            className={inputClasses()}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                scrollToYear(event.target.value);
              }
            }}
          >
            <option value="" disabled>
              Jump to year
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_8rem]">
        {/* Vertical Timeline */}
        <motion.section
          variants={staggerContainer}
          className="relative min-w-0 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-6 lg:p-8"
        >
          {isLoading ? (
            <motion.article
              variants={fadeUp}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5"
            >
              <div className="h-56 animate-pulse bg-slate-100" />
              <div className="space-y-4 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </motion.article>
          ) : errorMessage ? (
            <motion.section
              variants={fadeUp}
              className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm shadow-red-950/5"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-semibold text-red-600">
                !
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                Unable to load timeline.
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {errorMessage}
              </p>
            </motion.section>
          ) : timelineYears.length === 0 ? (
            <motion.section
              variants={fadeUp}
              className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
                ◷
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                No memories yet.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Start preserving moments to build your timeline.
              </p>
            </motion.section>
          ) : (
            <>
              <motion.div
                aria-hidden="true"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 1.1, ease: easeOut }}
                className="absolute bottom-8 left-8 top-24 w-px origin-top bg-emerald-200 lg:left-1/2"
              />

              {timelineYears.map((yearGroup, yearIndex) => (
                <div
                  key={yearGroup.year}
                  id={`timeline-${yearGroup.year}`}
                  className="scroll-mt-28"
                >
                  <motion.div
                    variants={fadeUp}
                    className={`relative z-10 ${
                      yearIndex === 0 ? "" : "mt-14"
                    } flex justify-start lg:justify-center`}
                  >
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                      {yearGroup.year}
                    </span>
                  </motion.div>

                  <div className="mt-8 space-y-8">
                    {yearGroup.memories.map((memory, memoryIndex) => {
                      const alignRight = (yearIndex + memoryIndex) % 2 === 1;

                      return (
                        <motion.div
                          key={memory.id}
                          variants={staggerContainer}
                          className="relative grid gap-5 pl-10 lg:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] lg:gap-6 lg:pl-0"
                        >
                          <div
                            className={`hidden lg:block ${
                              alignRight ? "" : "lg:col-start-1"
                            }`}
                          >
                            {!alignRight ? (
                              <TimelineCard
                                memory={memory}
                                alignRight={alignRight}
                              />
                            ) : null}
                          </div>

                          <div className="absolute left-[1.1rem] top-3 z-10 flex flex-col items-center lg:static lg:col-start-2">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20">
                              ●
                            </span>
                            <span className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {memory.month}
                            </span>
                          </div>

                          <div
                            className={`min-w-0 lg:hidden ${
                              alignRight ? "lg:col-start-3" : "lg:col-start-1"
                            }`}
                          >
                            <TimelineCard memory={memory} alignRight={false} />
                          </div>

                          <div
                            className={`hidden min-w-0 lg:block ${
                              alignRight ? "lg:col-start-3" : ""
                            }`}
                          >
                            {alignRight ? (
                              <TimelineCard
                                memory={memory}
                                alignRight={alignRight}
                              />
                            ) : null}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </motion.section>

        {/* Timeline Navigation */}
        {timelineYears.length > 0 && (
          <motion.aside
            variants={fadeUp}
            className="hidden lg:block"
            aria-label="Timeline year navigation"
          >
            <div className="sticky top-24 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Years
              </p>
              <div className="space-y-1">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => scrollToYear(year)}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </motion.div>
  );
}

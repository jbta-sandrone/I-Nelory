import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

type MemoryType = "Photo" | "Video" | "Story";

type ApiMemory = {
  id: string;
  title?: string | null;
  description?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  memoryDate?: string | null;
  createdAt: string;
  location?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  albumId?: string | null;
};

type SearchResult = {
  id: string;
  title: string;
  date: string;
  caption: string;
  type: MemoryType;
  location: string;
  image: string;
  matchedFields: string[];
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
      duration: 0.5,
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

const examplePrompts = [
  "Show me every beach trip.",
  "Find memories with my family.",
  "Show birthday celebrations.",
  "Find my college moments.",
  "Show gym progress memories.",
];

const howItWorks = [
  {
    title: "Ask naturally",
    description: "Type the way you remember the moment, not like a database.",
  },
  {
    title: "I-Nelory scans context",
    description: "Captions, tags, albums, dates, and metadata guide the search.",
  },
  {
    title: "Matches appear instantly",
    description: "Relevant memories surface with a simple reason for the match.",
  },
];

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

function formatMemoryDate(memoryDate?: string | null, createdAt?: string) {
  const dateStr = memoryDate || createdAt;

  if (!dateStr) {
    return "No date";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function mapApiMemory(memory: ApiMemory): SearchResult {
  const type = getMemoryType(memory.mediaType);
  const title = memory.title?.trim() || "Untitled memory";
  const description = memory.description?.trim() || "";
  const location = memory.location?.trim() || "Unknown location";
  const date = formatMemoryDate(memory.memoryDate, memory.createdAt);
  const image = memory.mediaUrl?.trim() || "";

  return {
    id: memory.id,
    title,
    date,
    caption: description || "No description yet.",
    type,
    location,
    image,
    matchedFields: [],
  };
}

async function aiSearchMemories(
  query: string,
  token: string
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch("http://localhost:5000/api/ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search memories (${response.status}).`);
    }

    const data = (await response.json()) as MemoriesResponse;

    // Map API memories to SearchResult format
    return data.memories
      .filter((memory) => !memory.isArchived)
      .map(mapApiMemory);
  } catch (error) {
    console.error("AI Search error:", error);
    throw error;
  }
}

export default function AISearchPage() {
  const [searchText, setSearchText] = useState("");
  const [allMemories, setAllMemories] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch memories on mount
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

        // Filter out archived memories and map to SearchResult
        const activeMemories = data.memories
          .filter((memory) => !memory.isArchived)
          .map(mapApiMemory);

        setAllMemories(activeMemories);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAllMemories([]);
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

  // Handle search - only triggered by explicit user action
  const handleSearch = async () => {
    if (!searchText.trim()) {
      return;
    }

    setHasSearched(true);
    setIsSearching(true);
    setSearchError("");

    try {
      const token = getStoredToken();

      if (!token) {
        throw new Error("Missing authentication token. Please log in again.");
      }

      const results = await aiSearchMemories(searchText, token);
      setFilteredResults(results);
    } catch (error) {
      setFilteredResults([]);
      setSearchError(
        error instanceof Error ? error.message : "Search failed. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSearching) {
      e.preventDefault();
      handleSearch();
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
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Natural Memory Search
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <motion.span
              animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700"
            >
              ✦
            </motion.span>
            AI Memory Search
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Ask I-Nelory to find memories the way you remember them.
          </p>
        </div>
      </motion.section>

      {/* AI Search Hero Card */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-7 lg:p-8"
      >
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Search with memory, not folders
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Find moments by describing what you remember.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search across your memories using natural language. Find moments
              by describing what you remember—location, date, feeling, or type.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white p-4 shadow-2xl shadow-black/20">
            <label className="sr-only" htmlFor="ai-memory-search">
              Search memories
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="ai-memory-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ask something like "Show me every beach trip."'
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching..." : "Search Memories"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setSearchText(prompt);
                    setTimeout(() => {
                      // Trigger search with the new text
                      setHasSearched(true);
                      setIsSearching(true);
                      setSearchError("");
                      
                      (async () => {
                        try {
                          const token = getStoredToken();
                          if (!token) {
                            throw new Error("Missing authentication token. Please log in again.");
                          }
                          const results = await aiSearchMemories(prompt, token);
                          setFilteredResults(results);
                        } catch (error) {
                          setFilteredResults([]);
                          setSearchError(
                            error instanceof Error ? error.message : "Search failed. Please try again.",
                          );
                        } finally {
                          setIsSearching(false);
                        }
                      })();
                    }, 0);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSearching}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Search Results */}
      {isLoading ? (
        <motion.section variants={fadeUp} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Loading
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Fetching your memories
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {[...Array(3)].map((_, i) => (
              <motion.article
                key={i}
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
          </motion.div>
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
      ) : searchError ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm shadow-red-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-semibold text-red-600">
            !
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            Search failed.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {searchError}
          </p>
        </motion.section>
      ) : hasSearched && filteredResults.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
            ✦
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No matching memories found.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try searching with another phrase or browse your full library.
          </p>
        </motion.section>
      ) : allMemories.length === 0 && !hasSearched ? (
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
            Start preserving moments to search your timeline.
          </p>
        </motion.section>
      ) : (
        <motion.section variants={fadeUp} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                {hasSearched ? "Search Results" : "Your Memories"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {hasSearched
                  ? isSearching
                    ? "AI is exploring your memories..."
                    : filteredResults.length === 1
                      ? `Found 1 matching memory`
                      : `Found ${filteredResults.length} matching memories`
                  : "Start searching your memories"}
              </h2>
            </div>
          </div>

          {isSearching ? (
            <motion.div className="space-y-5">
              <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-8 text-center shadow-sm shadow-emerald-500/10">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/30">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-2xl text-white"
                  >
                    ✦
                  </motion.div>
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  AI is exploring your memories...
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Searching through your memories using semantic analysis
                </p>
                <div className="mt-6 flex justify-center gap-1">
                  <motion.div
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="h-2 w-2 rounded-full bg-emerald-500"
                  />
                  <motion.div
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                    className="h-2 w-2 rounded-full bg-emerald-400"
                  />
                  <motion.div
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="h-2 w-2 rounded-full bg-emerald-300"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {(hasSearched ? filteredResults : []).map((result) => (
                <motion.article
                  key={result.id}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.35 }}
                  className="group min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
                >
                  <div className="h-52 overflow-hidden">
                    {result.image ? (
                      result.type === "Video" ? (
                        <video
                          src={result.image}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={result.image}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 text-4xl font-semibold text-emerald-700 transition duration-500 group-hover:scale-105">
                        M
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {result.date}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {result.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {result.caption}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {result.type}
                      </span>
                      {result.location && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {result.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Suggested Searches */}
      {!isLoading && !errorMessage && allMemories.length > 0 && (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Suggested Searches
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Try a phrase you would actually say.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setSearchText(prompt);
                    setTimeout(() => {
                      // Trigger search with the new text
                      setHasSearched(true);
                      setIsSearching(true);
                      setSearchError("");
                      
                      (async () => {
                        try {
                          const token = getStoredToken();
                          if (!token) {
                            throw new Error("Missing authentication token. Please log in again.");
                          }
                          const results = await aiSearchMemories(prompt, token);
                          setFilteredResults(results);
                        } catch (error) {
                          setFilteredResults([]);
                          setSearchError(
                            error instanceof Error ? error.message : "Search failed. Please try again.",
                          );
                        } finally {
                          setIsSearching(false);
                        }
                      })();
                    }, 0);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSearching}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* How It Works */}
      {!isLoading && !errorMessage && allMemories.length > 0 && (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 md:grid-cols-3"
        >
          {howItWorks.map((step, index) => (
            <motion.article
              key={step.title}
              variants={fadeUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </motion.article>
          ))}
        </motion.section>
      )}
    </motion.div>
  );
}

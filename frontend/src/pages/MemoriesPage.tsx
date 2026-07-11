import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";
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
  MOOD_OPTIONS,
  formatMoodLabel,
  getMemoryTagNames,
} from "../utils/memoryMetadata";
import { usePrivacyPreferences } from "../context/PrivacyPreferenceContext";

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
  mediaType: string | null;
  mediaUrl: string | null;
  tags: string[];
  image: string | null;
  favorite: boolean;
  albumId: string | null;
  createdAt: string;
  updatedAt: string;
};

type MemoriesResponse = {
  message: string;
  memories: ApiMemory[];
};

type MemoryResponse = {
  message?: string;
  memory?: ApiMemory;
};

type ApiAlbum = {
  id: string;
  name: string;
};

type AlbumsResponse = {
  message: string;
  albums: ApiAlbum[];
};

type MemoryFilters = {
  date: string;
  from: string;
  to: string;
  mood: string;
  tags: string[];
  albumId: string;
  mediaType: string;
  favorite: boolean;
  sort: string;
};

type ActiveFilterChip = {
  key: string;
  label: string;
  value?: string;
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

const FILTER_MODAL_PARAM = "filters";
const DEFAULT_FILTERS: MemoryFilters = {
  date: "",
  from: "",
  to: "",
  mood: "",
  tags: [],
  albumId: "",
  mediaType: "ALL",
  favorite: false,
  sort: "newest",
};

const dateFilterLabels: Record<string, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Custom Range",
};

const mediaTypeLabels: Record<string, string> = {
  ALL: "All",
  IMAGE: "Images",
  VIDEO: "Videos",
};

const sortLabels: Record<string, string> = {
  newest: "Newest",
  oldest: "Oldest",
  updated: "Recently Updated",
  memoryDate: "Memory Date",
  titleAsc: "Title A-Z",
  titleDesc: "Title Z-A",
};

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
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
  const mood = memory.mood?.trim() || memory.location?.trim();
  const location = memory.location?.trim();
  const tags = getMemoryTagNames(memory.tags);

  return {
    id: memory.id,
    title: memory.title?.trim() || "Untitled memory",
    description: memory.description?.trim() || "",
    caption: memory.description?.trim() || "No description yet.",
    date: formatMemoryDate(memory.memoryDate),
    memoryDate: memory.memoryDate ?? null,
    mood: mood || "Neutral",
    location: location ?? null,
    type,
    mediaType: memory.mediaType ?? null,
    mediaUrl: memory.mediaUrl?.trim() || null,
    tags,
    image: memory.mediaUrl?.trim() || null,
    favorite: memory.isFavorite,
    albumId: memory.albumId ?? null,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

function getFiltersFromSearchParams(searchParams: URLSearchParams): MemoryFilters {
  const date = searchParams.get("date") ?? "";
  const mediaType = (searchParams.get("mediaType") ?? "ALL").toUpperCase();
  const sort = searchParams.get("sort") ?? "newest";

  return {
    date: Object.keys(dateFilterLabels).includes(date) ? date : "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    mood: searchParams.get("mood") ?? "",
    tags: (searchParams.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    albumId: searchParams.get("albumId") ?? "",
    mediaType: ["ALL", "IMAGE", "VIDEO"].includes(mediaType)
      ? mediaType
      : "ALL",
    favorite: searchParams.get("favorite") === "true",
    sort: Object.keys(sortLabels).includes(sort) ? sort : "newest",
  };
}

function writeFiltersToSearchParams(
  searchParams: URLSearchParams,
  filters: MemoryFilters,
) {
  const nextParams = new URLSearchParams(searchParams);

  nextParams.delete(FILTER_MODAL_PARAM);

  for (const key of [
    "date",
    "from",
    "to",
    "mood",
    "tags",
    "albumId",
    "mediaType",
    "favorite",
    "sort",
  ]) {
    nextParams.delete(key);
  }

  if (filters.date) {
    nextParams.set("date", filters.date);
  }

  if (filters.date === "custom") {
    if (filters.from) {
      nextParams.set("from", filters.from);
    }

    if (filters.to) {
      nextParams.set("to", filters.to);
    }
  }

  if (filters.mood) {
    nextParams.set("mood", filters.mood);
  }

  if (filters.tags.length > 0) {
    nextParams.set("tags", filters.tags.join(","));
  }

  if (filters.albumId) {
    nextParams.set("albumId", filters.albumId);
  }

  if (filters.mediaType !== "ALL") {
    nextParams.set("mediaType", filters.mediaType);
  }

  if (filters.favorite) {
    nextParams.set("favorite", "true");
  }

  if (filters.sort !== "newest") {
    nextParams.set("sort", filters.sort);
  }

  return nextParams;
}

function getDateForFiltering(memory: Memory) {
  return new Date(memory.memoryDate || memory.createdAt);
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isInDateFilter(memory: Memory, filters: MemoryFilters) {
  if (!filters.date) {
    return true;
  }

  const memoryDate = getDateForFiltering(memory);

  if (Number.isNaN(memoryDate.getTime())) {
    return false;
  }

  const today = new Date();

  if (filters.date === "today") {
    return isSameDate(memoryDate, today);
  }

  if (filters.date === "week") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return memoryDate >= startOfWeek && memoryDate <= today;
  }

  if (filters.date === "month") {
    return (
      memoryDate.getFullYear() === today.getFullYear() &&
      memoryDate.getMonth() === today.getMonth()
    );
  }

  if (filters.date === "year") {
    return memoryDate.getFullYear() === today.getFullYear();
  }

  if (filters.date === "custom") {
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    return (
      (!fromDate || memoryDate >= fromDate) &&
      (!toDate || memoryDate <= toDate)
    );
  }

  return true;
}

function compareDates(first?: string | null, second?: string | null) {
  return new Date(second || 0).getTime() - new Date(first || 0).getTime();
}

export default function MemoriesPage() {
  const { preferences: privacyPreferences } = usePrivacyPreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isActionTransitioning, setIsActionTransitioning] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [memoryToEdit, setMemoryToEdit] = useState<EditableMemory | null>(null);
  const [memoryToView, setMemoryToView] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<MemoryFilters>(DEFAULT_FILTERS);

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setFeedback({ type: "success", ...nextFeedback });
  }, []);

  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const filters = useMemo(
    () => getFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const albumNameById = useMemo(
    () =>
      albums.reduce<Record<string, string>>((albumNames, album) => {
        albumNames[album.id] = album.name;
        return albumNames;
      }, {}),
    [albums],
  );
  const availableTags = useMemo(
    () =>
      Array.from(new Set(memories.flatMap((memory) => memory.tags))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [memories],
  );

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

        try {
          const albumsResponse = await fetch(
            "http://localhost:5000/api/albums",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            },
          );

          if (albumsResponse.ok) {
            const albumsData = (await albumsResponse.json()) as AlbumsResponse;
            setAlbums(albumsData.albums);
          } else {
            setAlbums([]);
          }
        } catch (albumError) {
          if (
            albumError instanceof DOMException &&
            albumError.name === "AbortError"
          ) {
            throw albumError;
          }

          setAlbums([]);
        }
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
    if (searchParams.get(FILTER_MODAL_PARAM) === "1") {
      setDraftFilters(getFiltersFromSearchParams(searchParams));
      setIsFilterModalOpen(true);
    }
  }, [searchParams]);

  const visibleMemories = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    const selectedTags = filters.tags.map((tag) => tag.toLowerCase());

    return memories
      .filter((memory) => {
        const albumName = albumNameById[memory.albumId ?? ""] ?? "";

        if (normalizedQuery) {
          const searchableText = [
            memory.title,
            memory.description,
            memory.caption,
            memory.mood,
            albumName,
            ...memory.tags,
          ]
            .join(" ")
            .toLowerCase();

          if (!searchableText.includes(normalizedQuery)) {
            return false;
          }
        }

        if (!isInDateFilter(memory, filters)) {
          return false;
        }

        if (
          filters.mood &&
          memory.mood.toLowerCase() !== filters.mood.toLowerCase()
        ) {
          return false;
        }

        if (
          selectedTags.length > 0 &&
          !selectedTags.every((tag) =>
            memory.tags.some((memoryTag) => memoryTag.toLowerCase() === tag),
          )
        ) {
          return false;
        }

        if (filters.albumId && memory.albumId !== filters.albumId) {
          return false;
        }

        if (
          filters.mediaType === "VIDEO" &&
          memory.mediaType?.toUpperCase() !== "VIDEO"
        ) {
          return false;
        }

        if (
          filters.mediaType === "IMAGE" &&
          memory.mediaType?.toUpperCase() === "VIDEO"
        ) {
          return false;
        }

        if (filters.favorite && !memory.favorite) {
          return false;
        }

        return true;
      })
      .sort((firstMemory, secondMemory) => {
        switch (filters.sort) {
          case "oldest":
            return compareDates(secondMemory.createdAt, firstMemory.createdAt);
          case "updated":
            return compareDates(firstMemory.updatedAt, secondMemory.updatedAt);
          case "memoryDate":
            return compareDates(firstMemory.memoryDate, secondMemory.memoryDate);
          case "titleAsc":
            return firstMemory.title.localeCompare(secondMemory.title);
          case "titleDesc":
            return secondMemory.title.localeCompare(firstMemory.title);
          case "newest":
          default:
            return compareDates(firstMemory.createdAt, secondMemory.createdAt);
        }
      });
  }, [albumNameById, filters, memories, searchQuery]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(filters.date) ||
    Boolean(filters.mood) ||
    filters.tags.length > 0 ||
    Boolean(filters.albumId) ||
    filters.mediaType !== "ALL" ||
    filters.favorite ||
    filters.sort !== "newest";
  const activeFilterChips: ActiveFilterChip[] = [
    ...(searchQuery
      ? [{ key: "q", label: `Search: ${searchQuery}` }]
      : []),
    ...(filters.date
      ? [
          {
            key: "date",
            label:
              filters.date === "custom"
                ? `Date: ${filters.from || "Any"} to ${filters.to || "Any"}`
                : `Date: ${dateFilterLabels[filters.date]}`,
          },
        ]
      : []),
    ...(filters.mood
      ? [{ key: "mood", label: `Mood: ${filters.mood}` }]
      : []),
    ...filters.tags.map((tag) => ({
      key: "tags",
      value: tag,
      label: `Tag: ${tag}`,
    })),
    ...(filters.albumId
      ? [
          {
            key: "albumId",
            label: `Album: ${albumNameById[filters.albumId] ?? "Album"}`,
          },
        ]
      : []),
    ...(filters.mediaType !== "ALL"
      ? [
          {
            key: "mediaType",
            label: `Type: ${mediaTypeLabels[filters.mediaType]}`,
          },
        ]
      : []),
    ...(filters.favorite
      ? [{ key: "favorite", label: "Favorites only" }]
      : []),
    ...(filters.sort !== "newest"
      ? [{ key: "sort", label: `Sort: ${sortLabels[filters.sort]}` }]
      : []),
  ];

  const closeFilterModal = () => {
    setIsFilterModalOpen(false);

    if (searchParams.get(FILTER_MODAL_PARAM) === "1") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete(FILTER_MODAL_PARAM);
      setSearchParams(nextParams);
    }
  };

  const applyFilters = () => {
    setSearchParams(writeFiltersToSearchParams(searchParams, draftFilters));
    setIsFilterModalOpen(false);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setDraftFilters(DEFAULT_FILTERS);
    setIsFilterModalOpen(false);
  };

  const removeFilter = (key: string, value?: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(FILTER_MODAL_PARAM);

    if (key === "q") {
      nextParams.delete("q");
    }

    if (key === "date") {
      nextParams.delete("date");
      nextParams.delete("from");
      nextParams.delete("to");
    }

    if (key === "tags" && value) {
      const nextTags = filters.tags.filter((tag) => tag !== value);

      if (nextTags.length > 0) {
        nextParams.set("tags", nextTags.join(","));
      } else {
        nextParams.delete("tags");
      }
    }

    if (["mood", "albumId", "mediaType", "favorite", "sort"].includes(key)) {
      nextParams.delete(key);
    }

    setSearchParams(nextParams);
  };

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
      showFeedback({
        icon: "M",
        title: "Memory Created",
        message: "Your memory has been saved.",
      });
    };

    window.addEventListener("i-nelory.memory.created", handleMemoryCreated);

    return () => {
      window.removeEventListener(
        "i-nelory.memory.created",
        handleMemoryCreated,
      );
    };
  }, [showFeedback]);

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
  }, [showFeedback]);

  const openEditModal = (memory: Memory) => {
    setOpenMenuId(null);
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
    setOpenMenuId(null);
    setMemoryToView(memory);
  };

  const closeMemoryViewer = () => {
    setMemoryToView(null);
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

  const archiveMemory = async (memory: Memory) => {
    const previousMemories = memories;
    const transitionStartedAt = startActionTransition();

    setFavoriteErrorMessage("");
    setOpenMenuId(null);
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
          error instanceof Error ? error.message : "Failed to archive memory.",
        type: "error",
      });
    }
  };

  const closeMemoryModal = () => {
    setIsModalOpen(false);
    setMemoryToEdit(null);
  };

  const openDeleteConfirmation = (memory: Memory) => {
    setOpenMenuId(null);
    setDeleteErrorMessage("");

    if (!privacyPreferences.confirmBeforeDelete) {
      void handleDeleteMemory(memory);
      return;
    }

    setMemoryToDelete(memory);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeleting) {
      setDeleteErrorMessage("");
      setMemoryToDelete(null);
    }
  };

  const handleDeleteMemory = async (targetMemory?: Memory | null) => {
    const memory = targetMemory ?? memoryToDelete;

    if (!memory) {
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
      if (!privacyPreferences.confirmBeforeDelete) {
        showFeedback({
          icon: "!",
          title: "Delete failed",
          message,
          type: "error",
        });
      }
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/memories/${encodeURIComponent(
          memory.id,
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
        currentMemories.filter((currentMemory) => currentMemory.id !== memory.id),
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
      setDeleteErrorMessage(message);
      if (!privacyPreferences.confirmBeforeDelete) {
        showFeedback({
          icon: "!",
          title: "Delete failed",
          message,
          type: "error",
        });
      }
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

      {/* Active Filters */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {visibleMemories.length.toLocaleString()} matching memories
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterChips.length > 0 ? (
                activeFilterChips.map((chip) => (
                  <button
                    key={`${chip.key}-${chip.value ?? chip.label}`}
                    type="button"
                    onClick={() => removeFilter(chip.key, chip.value)}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    {chip.label} x
                  </button>
                ))
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  All memories
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setDraftFilters(filters);
                setIsFilterModalOpen(true);
              }}
              className="rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Filter
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Clear All
              </button>
            ) : null}
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
      ) : visibleMemories.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-[2rem] border border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-semibold text-emerald-700">
            M
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No memories match.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Try a different search or remove a filter.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Clear Filters
          </button>
        </motion.section>
      ) : (
        <motion.section
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {visibleMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              openMenuId={openMenuId}
              onToggleMenu={(memoryId) =>
                setOpenMenuId((current) =>
                  current === memoryId ? null : memoryId,
                )
              }
              onToggleFavorite={toggleFavorite}
              onEdit={openEditModal}
              onArchive={archiveMemory}
              onDelete={openDeleteConfirmation}
              onOpen={openMemoryViewer}
            />
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

      <AnimatePresence>
        {isFilterModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFilterModal}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="memory-filter-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.26, ease: easeOut }}
              className="my-auto flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Memory Library
                  </p>
                  <h2
                    id="memory-filter-title"
                    className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                  >
                    Filter memories
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close memory filters"
                  onClick={closeFilterModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                >
                  &times;
                </button>
              </div>

              <div className="grid gap-5 overflow-y-auto p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Date
                    </span>
                    <select
                      value={draftFilters.date}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          date: event.target.value,
                        }))
                      }
                      className={`${inputClasses()} mt-2`}
                    >
                      <option value="">Any date</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Mood
                    </span>
                    <select
                      value={draftFilters.mood}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          mood: event.target.value,
                        }))
                      }
                      className={`${inputClasses()} mt-2`}
                    >
                      <option value="">Any mood</option>
                      {MOOD_OPTIONS.map((mood) => (
                        <option key={mood.name} value={mood.name}>
                          {mood.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {draftFilters.date === "custom" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        From
                      </span>
                      <input
                        type="date"
                        value={draftFilters.from}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            from: event.target.value,
                          }))
                        }
                        className={`${inputClasses()} mt-2`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        To
                      </span>
                      <input
                        type="date"
                        value={draftFilters.to}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            to: event.target.value,
                          }))
                        }
                        className={`${inputClasses()} mt-2`}
                      />
                    </label>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Tags
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => {
                        const isSelected = draftFilters.tags.includes(tag);

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setDraftFilters((current) => ({
                                ...current,
                                tags: isSelected
                                  ? current.tags.filter(
                                      (currentTag) => currentTag !== tag,
                                    )
                                  : [...current.tags, tag],
                              }))
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-300 hover:-translate-y-0.5 ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-sm text-slate-500">
                        No saved tags yet.
                      </span>
                    )}
                  </div>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Album
                    </span>
                    <select
                      value={draftFilters.albumId}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          albumId: event.target.value,
                        }))
                      }
                      className={`${inputClasses()} mt-2`}
                    >
                      <option value="">Any album</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Media Type
                    </span>
                    <select
                      value={draftFilters.mediaType}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          mediaType: event.target.value,
                        }))
                      }
                      className={`${inputClasses()} mt-2`}
                    >
                      <option value="ALL">All</option>
                      <option value="IMAGE">Images</option>
                      <option value="VIDEO">Videos</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        Favorites Only
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={draftFilters.favorite}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          favorite: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 accent-emerald-600"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Sort
                    </span>
                    <select
                      value={draftFilters.sort}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          sort: event.target.value,
                        }))
                      }
                      className={`${inputClasses()} mt-2`}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="updated">Recently Updated</option>
                      <option value="memoryDate">Memory Date</option>
                      <option value="titleAsc">Title A-Z</option>
                      <option value="titleDesc">Title Z-A</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={() => setDraftFilters(DEFAULT_FILTERS)}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <NewMemoryModal
        isOpen={isModalOpen || Boolean(memoryToEdit)}
        onClose={closeMemoryModal}
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
                  onClick={() => void handleDeleteMemory()}
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

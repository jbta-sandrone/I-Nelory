import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStoredAuthToken } from "../services/auth";
import FeedbackDialog from "../components/FeedbackDialog";
import ActionTransitionOverlay from "../components/ActionTransitionOverlay";
import { waitForActionTransition } from "../utils/actionTransition";

type ApiMemory = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  memoryDate: string | null;
  location: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  tags?: Array<string | { id?: string; name: string }>;
  createdAt: string;
};

type ApiAlbum = {
  id: string;
  name: string;
  createdAt: string;
};

type StatsType = {
  totalMemories: number;
  albums: number;
  favorites: number;
  archived: number;
  uniqueTags: number;
};

function generateAvatarInitials(fullName: string, email: string): string {
  if (!fullName.trim()) {
    return email.substring(0, 2).toUpperCase();
  }

  const names = fullName.trim().split(/\s+/);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
}

function formatJoinedDate(createdAt?: string): string {
  if (!createdAt) {
    return "Joined recently";
  }

  try {
    const date = new Date(createdAt);
    return new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Joined recently";
  }
}

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

function countUniqueTags(memories: ApiMemory[]) {
  const tagNames = new Set<string>();

  for (const memory of memories) {
    for (const tag of memory.tags ?? []) {
      const tagName = typeof tag === "string" ? tag : tag.name;
      const normalizedTagName = tagName.trim().toLowerCase();

      if (normalizedTagName) {
        tagNames.add(normalizedTagName);
      }
    }
  }

  return tagNames.size;
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<StatsType>({
    totalMemories: 0,
    albums: 0,
    favorites: 0,
    archived: 0,
    uniqueTags: 0,
  });
  const [allMemories, setAllMemories] = useState<ApiMemory[]>([]);
  const [recentMemories, setRecentMemories] = useState<ApiMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOverlayOpen, setIsLoadingOverlayOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [actionStartTime, setActionStartTime] = useState<number | null>(null);
  // avatar upload state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    bio: "",
    location: "",
  });

  // User data with fallbacks
  const fullName = authUser?.fullName || authUser?.username || "Memory Keeper";
  const email = authUser?.email || "user@example.com";
  const username = `@${(authUser?.username || email.split("@")[0]).toLowerCase()}`;
  const bio = authUser?.bio || "Preserving meaningful memories in I-Nelory.";
  const joinedDate = `Joined ${formatJoinedDate(authUser?.createdAt)}`;
  const location = authUser?.location || "Not set";
  const avatarInitials = generateAvatarInitials(fullName, email);

  const bioDetails = [
    {
      label: "Short bio",
      value: bio,
    },
    {
      label: "Email",
      value: email,
    },
    {
      label: "Joined date",
      value: joinedDate,
    },
    {
      label: "Location",
      value: location,
    },
  ];

  // Format time for recent memories
  const formatTimeAgo = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return "Recently";
    }
  }, []);

  // Fetch stats and recent memories
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setIsLoading(true);

      try {
        const token = getStoredAuthToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch all memories
        const memoriesResponse = await fetch(
          "http://localhost:5000/api/memories",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        if (!memoriesResponse.ok) {
          throw new Error("Failed to fetch memories");
        }

        const memoriesData = (await memoriesResponse.json()) as {
          memories: ApiMemory[];
        };
        const normalMemories = memoriesData.memories || [];
        setAllMemories(normalMemories);

        // Fetch archived memories
        const archivedResponse = await fetch(
          "http://localhost:5000/api/memories/archive",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        const archivedData = archivedResponse.ok
          ? ((await archivedResponse.json()) as { memories: ApiMemory[] })
          : { memories: [] };
        const archived = archivedData.memories || [];

        // Fetch albums
        const albumsResponse = await fetch("http://localhost:5000/api/albums", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const albumsData = albumsResponse.ok
          ? ((await albumsResponse.json()) as { albums: ApiAlbum[] })
          : { albums: [] };
        const albums = albumsData.albums || [];

        // Calculate stats
        const favorites = normalMemories.filter((m) => m.isFavorite).length;
        const uniqueTags = countUniqueTags([...normalMemories, ...archived]);

        setStats({
          totalMemories: normalMemories.length,
          albums: albums.length,
          favorites,
          archived: archived.length,
          uniqueTags,
        });

        // Set recent memories (latest 4 by createdAt)
        const sorted = [...normalMemories].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentMemories(sorted.slice(0, 4));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching profile data:", error);
        // Keep default state on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, []);

  // Sync form when modal opens or user data changes
  useEffect(() => {
    if (isModalOpen) {
      setProfileForm({
        fullName: authUser?.fullName || "",
        bio: authUser?.bio || "Preserving meaningful memories in I-Nelory.",
        location: authUser?.location || "Not set",
      });
    }
  }, [isModalOpen, authUser?.fullName, authUser?.bio, authUser?.location]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsModalOpen(false);
    setIsLoadingOverlayOpen(true);
    const startedAt = Date.now();
    setActionStartTime(startedAt);

    try {
      const token = getStoredAuthToken();
      if (!token) {
        throw new Error("Missing authentication token");
      }

      // Step A: update bio/location
      const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          bio: profileForm.bio,
          location: profileForm.location,
        }),
      });

      if (!profileRes.ok) {
        const data = (await profileRes.json()) as { message?: string };
        throw new Error(data.message || "Failed to update profile");
      }

      const profileData = (await profileRes.json()) as { user: typeof authUser };
      let latestUser = profileData.user;

      // Step B: if avatar selected, upload it and prefer its returned user
      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append("avatar", selectedAvatarFile);

        const avatarRes = await fetch(
          "http://localhost:5000/api/auth/profile/avatar",
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!avatarRes.ok) {
          const data = await avatarRes.json().catch(() => null);
          throw new Error((data && (data.message || data.error)) || "Failed to upload avatar");
        }

        const avatarData = (await avatarRes.json()) as { user: typeof authUser };
        if (avatarData.user) latestUser = avatarData.user;
      }

      // Use the latest user and update context
      if (latestUser) {
        setUser(latestUser);
      }

      // Cleanup preview and selected file
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setSelectedAvatarFile(null);

      if (actionStartTime !== null) {
        await waitForActionTransition(actionStartTime, 900);
      }

      setIsLoadingOverlayOpen(false);
      setFeedback({
        title: "Profile updated",
        message: "Your profile details were saved successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      setIsLoadingOverlayOpen(false);
      setFeedback({
        title: "Could not update profile",
        message: error instanceof Error ? error.message : "Please try again.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSaving(false);
      setActionStartTime(null);
    }
  };

  // Calculate memory insights
  const getEarliestMemory = (): { title: string; date: string } => {
    if (allMemories.length === 0) {
      return { title: "No memories yet", date: "" };
    }

    let earliest = allMemories[0];
    for (const memory of allMemories) {
      if (memory.memoryDate) {
        if (
          !earliest.memoryDate ||
          new Date(memory.memoryDate) < new Date(earliest.memoryDate)
        ) {
          earliest = memory;
        }
      }
    }

    if (!earliest.memoryDate && !earliest.createdAt) {
      return { title: earliest.title || "First memory", date: "" };
    }

    const date = new Date(earliest.memoryDate || earliest.createdAt);
    const formatted = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);

    return {
      title: earliest.title || "First memory",
      date: formatted,
    };
  };

  const getLatestMemory = (): string => {
    if (allMemories.length === 0) return "No memories yet";
    const latest = allMemories.reduce((prev, current) =>
      new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev,
    );
    return latest.title || "Latest memory";
  };

  const getFavoriteRate = (): string => {
    if (stats.totalMemories === 0) return "0%";
    const rate = Math.round((stats.favorites / stats.totalMemories) * 100);
    return `${rate}%`;
  };

  const getArchiveBalance = (): string => {
    const total = stats.totalMemories + stats.archived;
    if (total === 0) return "0%";
    const rate = Math.round((stats.archived / total) * 100);
    return `${rate}%`;
  };

  const insights = [
    {
      title: "Earliest Memory",
      value: getEarliestMemory().title,
      detail: "Your first preserved moment in I-Nelory.",
      icon: "⏰",
    },
    {
      title: "Latest Memory",
      value: getLatestMemory(),
      detail: "Your newest added memory.",
      icon: "✨",
    },
    {
      title: "Favorite Rate",
      value: getFavoriteRate(),
      detail: "Of your memories are marked as favorites.",
      icon: "♡",
    },
    {
      title: "Archive Balance",
      value: getArchiveBalance(),
      detail: "Of your memories are resting in Archive.",
      icon: "◫",
    },
  ];

  const statsList = [
    {
      label: "Total Memories",
      value: stats.totalMemories.toString(),
      icon: "◇",
      route: "/dashboard/memories",
    },
    {
      label: "Albums",
      value: stats.albums.toString(),
      icon: "▣",
      route: "/dashboard/albums",
    },
    {
      label: "Favorites",
      value: stats.favorites.toString(),
      icon: "♡",
      route: "/dashboard/favorites",
    },
    {
      label: "Archived",
      value: stats.archived.toString(),
      icon: "◫",
      route: "/dashboard/archive",
    },
    {
      label: "__removed_stat",
      value: "0",
      icon: "✎",
      route: null,
    },
    {
      label: "Unique Tags",
      value: stats.uniqueTags.toString(),
      icon: "#",
      route: "/dashboard/memories",
    },
  ];

  const visibleStatsList = statsList.filter(
    (stat) => stat.label !== "__removed_stat",
  );

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Loading overlay */}
      <ActionTransitionOverlay
        isOpen={isLoadingOverlayOpen}
        title="Updating your profile..."
        subtitle="Saving your latest changes."
      />

      {/* Feedback Dialog */}
      <AnimatePresence>
        {feedback && (
          <FeedbackDialog
            isOpen={Boolean(feedback)}
            title={feedback.title}
            message={feedback.message}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
            onDismiss={() => setFeedback(null)}
            duration={4000}
          />
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.section
        variants={fadeUp}
        className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Personal Space
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Manage your personal memory space.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          Edit Profile
        </button>
      </motion.section>

      {/* Profile Overview Card */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-emerald-100/80 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-slate-950 text-3xl font-semibold text-white shadow-xl shadow-slate-950/15 overflow-hidden">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950 text-3xl font-semibold text-white">
                {avatarInitials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {fullName}
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {stats.totalMemories} memories
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {username}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              {bio}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {email}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {joinedDate}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {location}
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5 lg:w-56">
            <p className="text-sm font-semibold text-emerald-800">
              Profile customization
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-2 rounded-full bg-white">
                <div className="h-2 w-[45%] rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs leading-5 text-emerald-800/80">
                Add cover art and favorite themes later to complete your memory
                identity.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Memory Statistics */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        {visibleStatsList.map((stat) => {
          const isClickable = stat.route !== null;

          return (
            <motion.button
              type="button"
              key={stat.label}
              onClick={() => {
                if (stat.route) {
                  navigate(stat.route);
                }
              }}
              aria-disabled={!isClickable}
              variants={fadeUp}
              whileHover={{ y: -5, scale: 1.015 }}
              transition={{ duration: 0.3 }}
              className={`min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 text-left ${
                isClickable
                  ? "cursor-pointer hover:shadow-lg hover:bg-black/8"
                  : "cursor-default hover:shadow-lg hover:bg-black/8"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-semibold text-emerald-700">
                {stat.icon}
              </span>
              <p className="mt-5 truncate text-2xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {stat.label}
              </p>
            </motion.button>
          );
        })}
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        {/* About / Bio Section */}
        <motion.section
          variants={fadeUp}
          className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            About
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            A small preview of your memory identity.
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {bioDetails.map((detail) => (
              <motion.article
                key={detail.label}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 transition duration-300 hover:bg-white hover:shadow-md hover:shadow-slate-950/5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {detail.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {detail.value}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Recent Memories */}
        <motion.section
          variants={fadeUp}
          className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Recent Activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Latest moments in your memory space.
          </h2>

          <div className="mt-6 space-y-1">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : recentMemories.length > 0 ? (
              recentMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  variants={fadeUp}
                  className="relative flex gap-4 rounded-[1.25rem] p-3 transition duration-300 hover:bg-slate-50"
                >
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
                    {index < recentMemories.length - 1 ? (
                      <span className="mt-2 h-full min-h-8 w-px bg-slate-200" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-3">
                    <p className="text-sm font-semibold text-slate-950 truncate">
                      {memory.title || "Untitled Memory"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {memory.description || "No description"} ·{" "}
                      {formatTimeAgo(memory.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">
                  No memories yet. Start creating your first memory!
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* Memory Insights */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={fadeUp} className="sm:col-span-2 xl:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Memory Insights
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Patterns from your memory space.
          </h2>
        </motion.div>

        {insights.map((insight) => (
          <motion.article
            key={insight.title}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.35 }}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-semibold text-emerald-700">
              {insight.icon}
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {insight.title}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {insight.value}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {insight.detail}
            </p>
          </motion.article>
        ))}
      </motion.section>

      {/* Edit Profile Modal */}
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
              aria-labelledby="edit-profile-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            >
              <form
                onSubmit={handleSaveChanges}
                className="max-h-[90vh] overflow-y-auto p-5 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Profile Details
                    </p>
                    <h2
                      id="edit-profile-title"
                      className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      Edit Profile
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Update your bio and location details.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close edit profile modal"
                    onClick={() => setIsModalOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.25rem] border border-white bg-white/80 p-5 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] overflow-hidden bg-slate-950 text-2xl font-semibold text-white shadow-lg shadow-slate-950/15">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : authUser?.avatarUrl ? (
                          <img
                            src={authUser.avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-2xl font-semibold text-white">
                            {avatarInitials}
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-950">
                        Avatar upload
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Upload a new avatar image (max 5MB). Accepted formats:
                      </p>
                      

                      <div className="mt-4 flex w-full flex-col items-center gap-2 text-slate-500">
                        <input
                          id="avatar-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;

                            if (!file) {
                              setSelectedAvatarFile(null);
                              if (avatarPreview) {
                                URL.revokeObjectURL(avatarPreview);
                                setAvatarPreview(null);
                              }
                              return;
                            }

                            // Basic client-side validation
                            const maxSize = 5 * 1024 * 1024;
                            if (!file.type.startsWith("image/")) {
                              setFeedback({
                                title: "Invalid file",
                                message: "Please select an image file.",
                              });
                              setTimeout(() => setFeedback(null), 3000);
                              return;
                            }

                            if (file.size > maxSize) {
                              setFeedback({
                                title: "File too large",
                                message: "Image must be 5MB or smaller.",
                              });
                              setTimeout(() => setFeedback(null), 3000);
                              return;
                            }

                            setSelectedAvatarFile(file);
                            const url = URL.createObjectURL(file);
                            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                            setAvatarPreview(url);
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar-upload-input"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                        >
                          <span className="text-lg">📷</span>
                          <span className="truncate">
                            {selectedAvatarFile?.name ?? "Upload Avatar"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    
                      <FormField label="Full name">
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              fullName: e.target.value,
                            })
                          }
                          className={inputClasses()}
                          placeholder="Your full name"
                        />
                      </FormField>
                    

                    <FormField label="Bio">
                      <textarea
                        rows={4}
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            bio: e.target.value,
                          })
                        }
                        className={`${inputClasses()} resize-none`}
                        placeholder="Share something about your memory journey..."
                      />
                    </FormField>

                    <FormField label="Location">
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            location: e.target.value,
                          })
                        }
                        className={inputClasses()}
                        placeholder="Where are you from?"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import NewMemoryModal from "../components/NewMemoryModal";
import iNeloryLogo from "../assets/images/I-Nelory-logo.png";
import { useAuth } from "../context/AuthContext";
import { getStoredAuthToken } from "../services/auth";
import {
  getNotifications,
  markNotificationRead,
  type NotificationItem,
} from "../services/notifications";
import { formatRelativeTime, getNotificationRoute } from "./NotificationPage";

type NavIconName =
  | "home"
  | "memories"
  | "timeline"
  | "albums"
  | "favorites"
  | "archive"
  | "ai"
  | "profile"
  | "settings";

const navItems: Array<{ label: string; icon: NavIconName; to: string }> = [
  { label: "Home", icon: "home", to: "/dashboard" },
  { label: "Memories", icon: "memories", to: "/dashboard/memories" },
  { label: "Timeline", icon: "timeline", to: "/dashboard/timeline" },
  { label: "Albums", icon: "albums", to: "/dashboard/albums" },
  { label: "Favorites", icon: "favorites", to: "/dashboard/favorites" },
  { label: "Archive", icon: "archive", to: "/dashboard/archive" },
  { label: "AI Search", icon: "ai", to: "/dashboard/ai-search" },
  { label: "Profile", icon: "profile", to: "/dashboard/profile" },
  { label: "Settings", icon: "settings", to: "/dashboard/settings" },
];

const DROPDOWN_NOTIFICATION_LIMIT = 5;
const MEMORY_FILTER_MODAL_PARAM = "filters";

function HamburgerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function FilterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
    >
      <path d="M4 5h16l-7 8v5l-2 1v-6z" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function getAvatarInitials(name?: string | null, username?: string | null) {
  const source = name?.trim() || username?.trim();

  if (!source) {
    return "IU";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    const firstInitial = parts[0]?.charAt(0) ?? "";
    const lastInitial = parts[parts.length - 1]?.charAt(0) ?? "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function NavIcon({ name }: { name: NavIconName }) {
  const iconProps = {
    "aria-hidden": true,
    className: "h-4.5 w-4.5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...iconProps}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "memories":
      return (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="m7 15 3.5-3.5L14 15l2-2 1 1" />
          <circle cx="15.5" cy="9.5" r="1.3" />
        </svg>
      );
    case "timeline":
      return (
        <svg {...iconProps}>
          <path d="M12 5v14" />
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      );
    case "albums":
      return (
        <svg {...iconProps}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H9l2 2h6.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        </svg>
      );
    case "favorites":
      return (
        <svg {...iconProps}>
          <path d="M20.5 8.8c0 5.1-8.5 10-8.5 10s-8.5-4.9-8.5-10A4.7 4.7 0 0 1 12 5.9a4.7 4.7 0 0 1 8.5 2.9Z" />
        </svg>
      );
    case "archive":
      return (
        <svg {...iconProps}>
          <path d="M4 7h16" />
          <path d="M5 7v12h14V7" />
          <path d="M8 4h8l1 3H7z" />
          <path d="M10 12h4" />
        </svg>
      );
    case "ai":
      return (
        <svg {...iconProps}>
          <path d="m12 3 1.5 5L18 10l-4.5 2L12 17l-1.5-5L6 10l4.5-2z" />
          <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
        </svg>
      );
    case "profile":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...iconProps}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.5-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.3h-5.4v-.3a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3.5.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.5.2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V2h5.4v.3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3.5-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [newMemoryOpen, setNewMemoryOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState("");
  const [searchEdited, setSearchEdited] = useState(false);
  const displayName =
    authUser?.fullName?.trim() ||
    authUser?.username?.trim() ||
    "I-Nelory User";
  const displayEmail = authUser?.email || "No email available";
  const avatarInitials = getAvatarInitials(
    authUser?.fullName,
    authUser?.username,
  );

  const loadDropdownNotifications = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotificationsLoading(true);
    try {
      const data = await getNotifications(token, "All");
      setNotifications(data.notifications.slice(0, DROPDOWN_NOTIFICATION_LIMIT));
      setUnreadCount(data.unreadCount);
    } catch {
      // Fail silently in the dropdown; the full notifications page will surface errors.
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    void loadDropdownNotifications();

    const intervalId = window.setInterval(() => {
      void loadDropdownNotifications();
    }, 20000);

    const handleRefreshEvent = () => {
      void loadDropdownNotifications();
    };
    window.addEventListener("notifications:refresh", handleRefreshEvent);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("notifications:refresh", handleRefreshEvent);
    };
  }, []);

  useEffect(() => {
    if (notificationOpen) {
      void loadDropdownNotifications();
    }
  }, [notificationOpen]);

  useEffect(() => {
    if (location.pathname === "/dashboard/memories") {
      setTopbarSearch(new URLSearchParams(location.search).get("q") ?? "");
    } else {
      setTopbarSearch("");
    }

    setSearchEdited(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!searchEdited) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params =
        location.pathname === "/dashboard/memories"
          ? new URLSearchParams(location.search)
          : new URLSearchParams();

      const nextSearch = topbarSearch.trim();

      if (nextSearch) {
        params.set("q", nextSearch);
      } else {
        params.delete("q");
      }

      params.delete(MEMORY_FILTER_MODAL_PARAM);

      const search = params.toString();
      navigate({
        pathname: "/dashboard/memories",
        search: search ? `?${search}` : "",
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search, navigate, searchEdited, topbarSearch]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setNotificationOpen(false);

    if (!notification.isRead) {
      const token = getStoredAuthToken();
      if (token) {
        try {
          await markNotificationRead(token, notification.id);
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id ? { ...item, isRead: true } : item
            )
          );
          setUnreadCount((current) => Math.max(0, current - 1));
          window.dispatchEvent(new Event("notifications:refresh"));
        } catch {
          // Ignore mark-as-read failures; still navigate the user.
        }
      }
    }

    navigate(getNotificationRoute(notification.actionType));
  };

  const navigateFromAvatar = (path: string) => {
    setAvatarOpen(false);
    navigate(path);
  };

  const openLogoutModal = () => {
    setAvatarOpen(false);
    setLogoutOpen(true);
  };

  const openNewMemoryModal = () => {
    setNewMemoryOpen(true);
  };

  const openMemoryFilters = () => {
    const params =
      location.pathname === "/dashboard/memories"
        ? new URLSearchParams(location.search)
        : new URLSearchParams();

    if (topbarSearch.trim()) {
      params.set("q", topbarSearch.trim());
    }

    params.set(MEMORY_FILTER_MODAL_PARAM, "1");

    navigate({
      pathname: "/dashboard/memories",
      search: `?${params.toString()}`,
    });
  };

  const confirmLogout = () => {
    setIsLoggingOut(true);
    window.setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl shadow-slate-950/10 transition-all duration-300 ease-in-out lg:translate-x-0 lg:px-3 lg:shadow-none ${
          isSidebarHovered ? "lg:w-64" : "lg:w-20"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex items-center justify-between px-2 transition-all duration-300 ease-in-out ${
            isSidebarHovered ? "lg:px-2" : "lg:px-0"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={iNeloryLogo}
              alt="I-Nelory"
              className="h-10 w-10 shrink-0 rounded-2xl object-contain"
            />
            <div
              className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
                isSidebarHovered
                  ? "lg:max-w-40 lg:opacity-100"
                  : "lg:max-w-0 lg:opacity-0"
              }`}
            >
              <p className="whitespace-nowrap text-xl font-semibold tracking-tight">
                I-Nelory
              </p>
              <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                Your memory space
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${
                  isSidebarHovered
                    ? "lg:justify-start"
                    : "lg:justify-center lg:px-2"
                } ${
                  isActive
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border border-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`
              }
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-current transition">
                <NavIcon name={item.icon} />
              </span>
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isSidebarHovered
                    ? "lg:max-w-36 lg:opacity-100"
                    : "lg:max-w-0 lg:opacity-0"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`pointer-events-none absolute left-full ml-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 transition duration-200 ${
                  isSidebarHovered
                    ? "lg:hidden"
                    : "hidden lg:block lg:group-hover:opacity-100"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div
          className={`overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 ease-in-out ${
            isSidebarHovered
              ? "lg:max-h-40 lg:opacity-100"
              : "lg:max-h-0 lg:border-transparent lg:p-0 lg:opacity-0"
          }`}
        >
          <p className="text-sm font-semibold text-slate-950">
            Memory archive
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Dashboard v1 shell is ready. Pages come next.
          </p>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarHovered ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-4 py-4 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <HamburgerIcon className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search memories..."
                value={topbarSearch}
                onChange={(event) => {
                  setTopbarSearch(event.target.value);
                  setSearchEdited(true);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="button"
              aria-label="Filter memories"
              onClick={openMemoryFilters}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-100 bg-white text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:w-auto sm:px-5"
            >
              <FilterIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>

            <button
              type="button"
              onClick={openNewMemoryModal}
              className="hidden rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:inline-flex"
            >
              + New Memory
            </button>

            <button
              type="button"
              aria-label="New Memory"
              onClick={openNewMemoryModal}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold leading-none text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:hidden"
            >
              +
            </button>

            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setAvatarOpen(false);
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {notificationOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/10"
                  >
                    <div className="flex items-center justify-between px-2 py-2">
                      <p className="text-sm font-semibold text-slate-950">
                        Notifications
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
                      </span>
                    </div>
                    <div className="mt-1 max-h-80 space-y-1 overflow-y-auto">
                      {notificationsLoading && notifications.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-slate-400">
                          Loading notifications...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-slate-400">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => void handleNotificationClick(notification)}
                            className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-emerald-50/70 ${
                              notification.isRead ? "opacity-70" : ""
                            }`}
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                              {notification.icon || notification.category?.charAt(0) || "N"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {notification.category} - {formatRelativeTime(notification.updatedAt)}
                              </p>
                            </span>
                            {!notification.isRead ? (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/dashboard/notifications");
                      }}
                      className="mt-2 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      View all notifications
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Open profile menu"
                onClick={() => {
                  setAvatarOpen((open) => !open);
                  setNotificationOpen(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 dark:border-white/20 dark:bg-white/90 dark:text-slate-950 dark:hover:bg-white"
              >
                {avatarInitials}
              </button>

              <AnimatePresence>
                {avatarOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10"
                  >
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-950">
                        {displayName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {displayEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateFromAvatar("/dashboard/profile")}
                      className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateFromAvatar("/dashboard/settings")}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={openLogoutModal}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <NewMemoryModal
        isOpen={newMemoryOpen}
        onClose={() => setNewMemoryOpen(false)}
      />

      <AnimatePresence>
        {logoutOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
            >
              {isLoggingOut ? (
                <div className="py-4 text-center">
                  <motion.div
                    className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-600"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="mt-5 text-sm font-semibold text-slate-950">
                    Returning to I-Nelory...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {avatarInitials}
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    Are you sure you want to log out?
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    You will return to the I-Nelory landing page. Real
                    authentication logout will be connected later.
                  </p>
                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setLogoutOpen(false)}
                      className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                    >
                      Yes, Log out
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

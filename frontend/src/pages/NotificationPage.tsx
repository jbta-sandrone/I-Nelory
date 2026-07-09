import { motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackDialog, { type FeedbackState } from "../components/FeedbackDialog";
import { getStoredAuthToken } from "../services/auth";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../services/notifications";

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

const filters = ["All", "Unread", "Memories", "Albums", "Favorites", "Archive", "AI", "Account", "Security", "Reminder", "Storage"];

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

export function getNotificationRoute(actionType?: string | null) {
  switch (actionType) {
    case "memory":
      return "/dashboard/memories";
    case "album":
      return "/dashboard/albums";
    case "archive":
      return "/dashboard/archive";
    case "favorites":
      return "/dashboard/favorites";
    case "ai-search":
      return "/dashboard/ai-search";
    case "profile":
      return "/dashboard/profile";
    case "settings":
      return "/dashboard/settings";
    case "create-memory":
      return "/dashboard/memories";
    case "storage":
      return "/dashboard/settings";
    default:
      return "/dashboard/notifications";
  }
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async (filter = activeFilter) => {
    const token = getStoredAuthToken();

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await getNotifications(token, filter);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not load notifications",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications(activeFilter);
  }, [activeFilter]);

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const token = getStoredAuthToken();
    if (!token) {
      return;
    }

    try {
      await markNotificationRead(token, notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not update notification",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    const token = getStoredAuthToken();
    if (!token) {
      return;
    }

    try {
      await deleteNotification(token, notificationId);
      const deleted = notifications.find((notification) => notification.id === notificationId);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
      if (deleted && !deleted.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not delete notification",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    }
  };

  const handleClearAll = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      return;
    }

    try {
      await clearAllNotifications(token);
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications:refresh"));
      setFeedback({
        icon: "✓",
        title: "Notifications cleared",
        message: "Your notification list is empty.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not clear notifications",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    }
  };

  const handleMarkAllRead = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      return;
    }

    try {
      await markAllNotificationsRead(token);
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications:refresh"));
      setFeedback({
        icon: "✓",
        title: "All notifications marked as read",
        message: "You are up to date.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not update notifications",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    const destination = getNotificationRoute(notification.actionType);
    if (destination !== "/dashboard/notifications") {
      navigate(destination);
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
        className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Updates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Stay updated with your memory activity.
          </p>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        className="rounded-4xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                  activeFilter === filter
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
            >
              Clear all
            </button>
          </div>
        </div>
      </motion.section>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <p>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
      </div>

      {isLoading ? (
        <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm shadow-slate-950/5">
          Loading notifications...
        </div>
      ) : null}

      {!isLoading && visibleNotifications.length === 0 ? (
        <motion.section
          variants={fadeUp}
          className="rounded-4xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
            N
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            No notifications yet.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your memory activity will appear here.
          </p>
        </motion.section>
      ) : null}

      <motion.section variants={staggerContainer} className="space-y-4">
        {visibleNotifications.map((notification) => (
          <motion.article
            key={notification.id}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={{ duration: 0.3 }}
            className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10 ${
              notification.isRead ? "opacity-80" : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                className="flex min-w-0 flex-1 gap-4 text-left"
              >
                <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                  {notification.icon || notification.category?.charAt(0) || "N"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      {notification.title}
                    </h2>
                    {!notification.isRead ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {notification.category}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {formatRelativeTime(notification.updatedAt)}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId((current) => (current === notification.id ? null : notification.id))}
                    className="rounded-full border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                    aria-label="Notification actions"
                  >
                    ⋯
                  </button>
                  {menuOpenId === notification.id ? (
                    <div className="absolute right-0 z-10 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-950/10">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleMarkAsRead(notification.id);
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Mark as read
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(notification.id);
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.section>

      {feedback ? (
        <FeedbackDialog
          isOpen={Boolean(feedback)}
          icon={feedback.icon}
          title={feedback.title}
          message={feedback.message}
          type={feedback.type}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}
    </motion.div>
  );
}
import { motion, type Variants } from "framer-motion";
import { useState } from "react";

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

const filters = ["All", "Unread", "Memories", "Albums", "AI"];

const notifications = [
  {
    title: "3 memories uploaded",
    description: "Your new beach and family memories are ready to browse.",
    time: "Just now",
    category: "Memories",
    unread: true,
  },
  {
    title: "Today in your memories",
    description: "You saved a birthday celebration on this day last year.",
    time: "2 hours ago",
    category: "Memories",
    unread: true,
  },
  {
    title: "Family album updated",
    description: "New photos were added to your Family album preview.",
    time: "Yesterday",
    category: "Albums",
    unread: false,
  },
  {
    title: "AI Search found related memories",
    description: "I-Nelory found matches for beach, summer, and travel.",
    time: "2 days ago",
    category: "AI",
    unread: false,
  },
  {
    title: "Archive reminder",
    description: "You have 3 archived memories that can be restored anytime.",
    time: "4 days ago",
    category: "Memories",
    unread: false,
  },
];

export default function NotificationPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const visibleNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") {
      return true;
    }

    if (activeFilter === "Unread") {
      return notification.unread;
    }

    return notification.category === activeFilter;
  });

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

      {/* Filters */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"
      >
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
      </motion.section>

      {/* Notification List */}
      <motion.section variants={staggerContainer} className="space-y-4">
        {visibleNotifications.map((notification) => (
          <motion.article
            key={notification.title}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={{ duration: 0.3 }}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                  {notification.category === "AI"
                    ? "AI"
                    : notification.category.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      {notification.title}
                    </h2>
                    {notification.unread ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.description}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {notification.category}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {notification.time}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.section>

      {/* Empty State - keep hidden until there are no notifications.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
          N
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          No notifications yet.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Memory updates will appear here.
        </p>
      </motion.section>
      */}
    </motion.div>
  );
}

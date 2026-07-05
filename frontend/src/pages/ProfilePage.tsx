import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

const user = {
  fullName: "Jonel Bryan Ablog",
  username: "@jonelmemory",
  email: "jonel@example.com",
  bio: "Preserving ordinary days, family stories, and the small moments that become meaningful later.",
  joinedDate: "Joined March 2026",
  location: "Philippines",
  completion: "86% complete",
  avatarInitials: "JA",
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

const stats = [
  { label: "Total Memories", value: "248", icon: "◇" },
  { label: "Albums", value: "18", icon: "▣" },
  { label: "Favorites", value: "31", icon: "♡" },
  { label: "Archived", value: "18", icon: "◫" },
  { label: "Stories", value: "46", icon: "✎" },
  { label: "Tags Used", value: "72", icon: "#" },
];

const bioDetails = [
  {
    label: "Short bio",
    value: user.bio,
  },
  {
    label: "Favorite quote",
    value: "Moments pass. Memories stay.",
  },
  {
    label: "Memory theme preference",
    value: "Calm emerald, soft light, and clean album layouts.",
  },
  {
    label: "Most active album",
    value: "Travel",
  },
];

const activities = [
  { title: "Added a new memory", detail: "Beach Morning", time: "Today" },
  { title: "Updated profile photo", detail: "Profile overview", time: "Yesterday" },
  { title: "Created Travel album", detail: "58 memories collected", time: "2 days ago" },
  { title: "Favorited Family Morning", detail: "Saved close", time: "4 days ago" },
];

const highlights = [
  {
    title: "Most Loved Memory",
    value: "Family Morning",
    detail: "A quiet breakfast memory you revisit often.",
    icon: "♡",
  },
  {
    title: "Favorite Album",
    value: "Travel",
    detail: "58 moments from weekends, roads, and sunsets.",
    icon: "▣",
  },
  {
    title: "Most Used Tag",
    value: "#family",
    detail: "Used across 42 memories.",
    icon: "#",
  },
  {
    title: "Memory Streak",
    value: "14 days",
    detail: "A gentle rhythm of preserving moments.",
    icon: "◷",
  },
];

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-slate-950 text-3xl font-semibold text-white shadow-xl shadow-slate-950/15">
            {user.avatarInitials}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {user.fullName}
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {user.completion}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {user.username}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              {user.bio}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {user.email}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {user.joinedDate}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {user.location}
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5 lg:w-56">
            <p className="text-sm font-semibold text-emerald-800">
              Profile customization
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-2 rounded-full bg-white">
                <div className="h-2 w-[86%] rounded-full bg-emerald-500" />
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
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
      >
        {stats.map((stat) => (
          <motion.article
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ duration: 0.3 }}
            className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
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
          </motion.article>
        ))}
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

        {/* Recent Profile Activity */}
        <motion.section
          variants={fadeUp}
          className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Recent Activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Profile changes and memory moments.
          </h2>

          <div className="mt-6 space-y-1">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.title}
                variants={fadeUp}
                className="relative flex gap-4 rounded-[1.25rem] p-3 transition duration-300 hover:bg-slate-50"
              >
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
                  {index < activities.length - 1 ? (
                    <span className="mt-2 h-full min-h-8 w-px bg-slate-200" />
                  ) : null}
                </div>
                <div className="min-w-0 pb-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activity.detail} · {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Personal Highlights */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {highlights.map((highlight) => (
          <motion.article
            key={highlight.title}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.35 }}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-semibold text-emerald-700">
              {highlight.icon}
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {highlight.title}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {highlight.value}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {highlight.detail}
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
                onSubmit={(event) => event.preventDefault()}
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
                      Update the profile preview. Saving will be connected later.
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
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-slate-950 text-2xl font-semibold text-white shadow-lg shadow-slate-950/15">
                        {user.avatarInitials}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-950">
                        Avatar upload
                      </p>
                      <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                        Placeholder only. Real uploads will be added later.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Full name">
                        <input
                          type="text"
                          defaultValue={user.fullName}
                          className={inputClasses()}
                        />
                      </FormField>

                      <FormField label="Username">
                        <input
                          type="text"
                          defaultValue={user.username}
                          className={inputClasses()}
                        />
                      </FormField>
                    </div>

                    <FormField label="Email">
                      <input
                        type="email"
                        defaultValue={user.email}
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Bio">
                      <textarea
                        rows={4}
                        defaultValue={user.bio}
                        className={`${inputClasses()} resize-none`}
                      />
                    </FormField>

                    <FormField label="Location">
                      <input
                        type="text"
                        defaultValue={user.location}
                        className={inputClasses()}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
                  >
                    Save Changes
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

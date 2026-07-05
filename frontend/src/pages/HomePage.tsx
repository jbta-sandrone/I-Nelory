import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const user = {
  firstName: "Jonel",
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

const memoryOfTheDay = {
  title: "Sunset Walk by the Shore",
  date: "July 5, 2026",
  description:
    "A quiet evening saved with soft waves, warm light, and the kind of calm that stays with you.",
  image:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
};

const stats = [
  { title: "Memories", value: "248", icon: "◇" },
  { title: "Albums", value: "12", icon: "▣" },
  { title: "Favorites", value: "31", icon: "♡" },
  { title: "Archived", value: "18", icon: "◫" },
];

const recentMemories = [
  {
    title: "Beach Trip",
    date: "Today",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Family Breakfast",
    date: "Yesterday",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Journal Notes",
    date: "2 days ago",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Mountain Air",
    date: "June 28, 2026",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Birthday Candles",
    date: "June 18, 2026",
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "City Evening",
    date: "June 8, 2026",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  },
];

const albums = [
  {
    title: "Family",
    count: "64 memories",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Travel",
    count: "48 memories",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Friends",
    count: "37 memories",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "School",
    count: "21 memories",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
  },
];

const quickActions = [
  {
    title: "New Memory",
    description: "Save a photo, video, or story.",
    icon: "+",
  },
  {
    title: "Create Album",
    description: "Group meaningful moments.",
    icon: "▣",
  },
  {
    title: "AI Search",
    description: "Find memories naturally.",
    icon: "✦",
  },
];

const suggestions = [
  "Show beach trips.",
  "Find birthday memories.",
  "Show graduation photos.",
];

const activities = [
  { title: "Added 8 memories", time: "Today" },
  { title: "Created Family Album", time: "Yesterday" },
  { title: "Favorited Beach Trip", time: "2 days ago" },
  { title: "Archived Old Photos", time: "2 days ago" },
];

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

export default function HomePage() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % quotes.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

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
            {greeting}, {user.firstName} 👋
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

      {/* Memory of the Day */}
      <motion.section
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35 }}
        className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      >
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
            <img
              src={memoryOfTheDay.image}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
          </div>

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Memory of the Day
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {memoryOfTheDay.title}
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {memoryOfTheDay.date}
            </p>
            <p className="mt-5 text-base leading-7 text-slate-600">
              {memoryOfTheDay.description}
            </p>
          </div>
        </div>
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
              {stat.value}
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
        <SectionHeader eyebrow="Recent Memories" title="Moments you saved lately" />

        <motion.div
          variants={staggerContainer}
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {recentMemories.map((memory) => (
            <motion.article
              key={memory.title}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ duration: 0.35 }}
              className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/70 shadow-sm shadow-slate-950/5 transition duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={memory.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <button
                  type="button"
                  aria-label={`Favorite ${memory.title}`}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  ♡
                </button>
              </div>
              <div className="p-4">
                <h3 className="truncate text-base font-semibold text-slate-950">
                  {memory.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{memory.date}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {/* Albums and Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <motion.section
          variants={fadeUp}
          className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6"
        >
          <SectionHeader eyebrow="Recent Albums" title="Collections with a story" />

          <motion.div
            variants={staggerContainer}
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {albums.map((album) => (
              <motion.article
                key={album.title}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ duration: 0.35 }}
                className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/70 transition duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/10"
              >
                <div className="h-28 overflow-hidden">
                  <img
                    src={album.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    ▣
                  </div>
                  <h3 className="truncate text-base font-semibold text-slate-950">
                    {album.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{album.count}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
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

      {/* AI Search and Recent Activity */}
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
            <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white p-3 shadow-2xl shadow-black/20">
              <input
                type="text"
                placeholder="Ask AI to find a memory..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
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
          <SectionHeader eyebrow="Recent Activity" title="What changed lately" />

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
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

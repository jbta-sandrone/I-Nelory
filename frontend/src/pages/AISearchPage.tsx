import { motion, type Variants } from "framer-motion";
import { useState } from "react";

type SearchResult = {
  id: number;
  title: string;
  date: string;
  caption: string;
  tags: string[];
  reason: string;
  image: string;
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

const searchResults: SearchResult[] = [
  {
    id: 1,
    title: "Coastal Weekend",
    date: "June 21, 2026",
    caption:
      "A slow weekend by the shore with warm sunlight, soft waves, and quiet mornings.",
    tags: ["Beach", "Trip", "Summer"],
    reason:
      'Matched because this memory includes "beach", "trip", and "summer".',
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    title: "Family Morning",
    date: "April 12, 2026",
    caption:
      "Breakfast at home, familiar voices, and the kind of ordinary moment that stays.",
    tags: ["Family", "Home", "Morning"],
    reason:
      'Matched because this memory includes "family", "home", and people tags.',
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    title: "Birthday Candles",
    date: "June 12, 2026",
    caption:
      "A room full of laughter right before the candles went out and everyone cheered.",
    tags: ["Birthday", "Celebration", "Family"],
    reason:
      'Matched because this memory includes "birthday" and celebration details.',
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    title: "Graduation Day",
    date: "May 18, 2026",
    caption:
      "The proud walk, the photos after, and the hugs that made everything feel real.",
    tags: ["College", "Milestone", "Family"],
    reason:
      'Matched because this memory includes "college", "school", and milestone tags.',
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    title: "Gym Progress",
    date: "May 28, 2026",
    caption:
      "A steady progress check from a month of showing up and feeling stronger.",
    tags: ["Gym", "Progress", "Growth"],
    reason:
      'Matched because this memory includes "gym", "progress", and growth notes.',
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    title: "Friends at Sunset",
    date: "May 10, 2026",
    caption:
      "A golden hour that made a regular day with friends feel unforgettable.",
    tags: ["Friends", "Sunset", "Weekend"],
    reason:
      'Matched because this memory includes "friends", "sunset", and weekend context.',
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
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

export default function AISearchPage() {
  const [searchText, setSearchText] = useState("");

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
              This is a mock search experience for now. Later, Gemini can help
              match your natural language with saved memory context.
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
                placeholder='Ask something like "Show me every beach trip."'
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15"
              />
              <button
                type="button"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
              >
                Search Memories
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setSearchText(prompt)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Mock AI Results */}
      <motion.section variants={fadeUp} className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Mock AI Results
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Memories I-Nelory would surface
            </h2>
          </div>
          <p className="text-sm text-slate-500">6 sample matches</p>
        </div>

        <motion.div
          variants={staggerContainer}
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {searchResults.map((result) => (
            <motion.article
              key={result.id}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="group min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
            >
              <div className="h-52 overflow-hidden">
                <img
                  src={result.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
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
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Why it matched
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {result.reason}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {/* Suggested Searches */}
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
                onClick={() => setSearchText(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
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

      {/* Empty State - keep hidden until no search results match.
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
          Try searching with another phrase.
        </p>
      </motion.section>
      */}
    </motion.div>
  );
}

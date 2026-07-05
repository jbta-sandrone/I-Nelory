import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";

type FavoriteMemory = {
  id: number;
  title: string;
  date: string;
  caption: string;
  mood: string;
  album: string;
  tags: string[];
  image: string;
  type: "Photo" | "Video" | "Story";
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
  { label: "Total Favorites", value: "31", icon: "♡" },
  { label: "Favorite Photos", value: "24", icon: "◇" },
  { label: "Favorite Videos", value: "5", icon: "▶" },
  { label: "Most Loved Album", value: "Family", icon: "▣" },
];

const favorites: FavoriteMemory[] = [
  {
    id: 1,
    title: "Beach Morning",
    date: "July 5, 2026",
    caption: "Soft waves, quiet sand, and the first light after sunrise.",
    mood: "Peaceful",
    album: "Travel",
    tags: ["Beach", "Sunrise", "Weekend"],
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
  {
    id: 2,
    title: "Family Breakfast",
    date: "July 3, 2026",
    caption: "A slow morning at home with warm coffee and familiar voices.",
    mood: "Loved",
    album: "Family",
    tags: ["Home", "Family"],
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
  {
    id: 3,
    title: "Mountain Weekend",
    date: "June 18, 2026",
    caption: "A cool morning above the trees with the whole view opening up.",
    mood: "Inspired",
    album: "Travel",
    tags: ["Nature", "Roadtrip"],
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    type: "Video",
  },
  {
    id: 4,
    title: "Birthday Candles",
    date: "June 12, 2026",
    caption: "A room full of laughter right before the candles went out.",
    mood: "Joyful",
    album: "Birthdays",
    tags: ["Cake", "Celebration"],
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
    type: "Video",
  },
  {
    id: 5,
    title: "Friends at Sunset",
    date: "May 10, 2026",
    caption: "A golden hour that made a regular day feel unforgettable.",
    mood: "Warm",
    album: "Friends",
    tags: ["Friends", "Sunset"],
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
  {
    id: 6,
    title: "Graduation Day",
    date: "May 18, 2026",
    caption: "The proud walk, the photos after, and the hugs that followed.",
    mood: "Proud",
    album: "College",
    tags: ["School", "Milestone"],
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
  {
    id: 7,
    title: "Quiet Journal",
    date: "April 24, 2026",
    caption: "A small note from a day that taught me something important.",
    mood: "Reflective",
    album: "Journal",
    tags: ["Notes", "Growth"],
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
    type: "Story",
  },
  {
    id: 8,
    title: "Garden Afternoon",
    date: "April 3, 2026",
    caption: "Green corners, soft light, and a quiet pause worth keeping.",
    mood: "Calm",
    album: "Family",
    tags: ["Nature", "Home"],
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
  {
    id: 9,
    title: "Coding Night",
    date: "March 20, 2026",
    caption: "A late build session that finally clicked after hours of trying.",
    mood: "Focused",
    album: "Coding",
    tags: ["Projects", "Learning"],
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
    type: "Story",
  },
  {
    id: 10,
    title: "City Evening",
    date: "March 8, 2026",
    caption: "Lights, open streets, and a walk that made the week lighter.",
    mood: "Curious",
    album: "Travel",
    tags: ["City", "Evening"],
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    type: "Photo",
  },
];

const featuredFavorite = favorites[1];

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function FavoriteHeart({ label }: { label: string }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
    >
      ♥
    </motion.button>
  );
}

function FavoriteCard({
  favorite,
  openMenuId,
  onToggleMenu,
}: {
  favorite: FavoriteMemory;
  openMenuId: number | null;
  onToggleMenu: (id: number) => void;
}) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={favorite.image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {favorite.type}
          </span>
          <FavoriteHeart label={`Remove ${favorite.title} from favorites`} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {favorite.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{favorite.date}</p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={`Open menu for ${favorite.title}`}
              onClick={() => onToggleMenu(favorite.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
            >
              ⋯
            </button>

            <AnimatePresence>
              {openMenuId === favorite.id ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                >
                  {["Remove from Favorites", "View", "Archive"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {action}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {favorite.caption}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {favorite.mood}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {favorite.album}
          </span>
          {favorite.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export default function FavoritesPage() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
            Most Meaningful
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              ♡
            </span>
            Favorites
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Revisit the moments you never want to lose.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Memory
        </button>
      </motion.section>

      {/* Favorite Stats */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.article
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ duration: 0.3 }}
            className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-lg hover:shadow-slate-950/10"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
                {stat.icon}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-5 truncate text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {stat.label}
            </p>
          </motion.article>
        ))}
      </motion.section>

      {/* Featured Favorite */}
      <motion.section
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35 }}
        className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      >
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
            <img
              src={featuredFavorite.image}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
            <div className="absolute right-5 top-5">
              <FavoriteHeart
                label={`Remove ${featuredFavorite.title} from favorites`}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Featured Favorite
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {featuredFavorite.title}
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {featuredFavorite.date}
            </p>
            <p className="mt-5 text-base leading-7 text-slate-600">
              {featuredFavorite.caption}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {featuredFavorite.mood}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {featuredFavorite.album}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filter Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search favorites"
            className={inputClasses()}
          />

          <select aria-label="Filter by album" className={inputClasses()}>
            <option>All albums</option>
            <option>Family</option>
            <option>Travel</option>
            <option>Friends</option>
            <option>Birthdays</option>
          </select>

          <select aria-label="Filter by mood" className={inputClasses()}>
            <option>All moods</option>
            <option>Loved</option>
            <option>Peaceful</option>
            <option>Joyful</option>
            <option>Warm</option>
          </select>

          <select aria-label="Sort favorites" className={inputClasses()}>
            <option>Newest</option>
            <option>Oldest</option>
            <option>Recently Favorited</option>
          </select>
        </div>
      </motion.section>

      {/* Favorites Grid */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {favorites.map((favorite) => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            openMenuId={openMenuId}
            onToggleMenu={(id) =>
              setOpenMenuId((current) => (current === id ? null : id))
            }
          />
        ))}
      </motion.section>

      {/* Empty State - keep hidden until there are no favorite memories.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
          ♡
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          No favorite memories yet.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Tap the heart on memories you want to keep close.
        </p>
      </motion.section>
      */}
    </motion.div>
  );
}

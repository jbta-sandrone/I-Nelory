import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

type Album = {
  id: number;
  name: string;
  description: string;
  count: string;
  updated: string;
  image: string;
  tags: string[];
  thumbnails: string[];
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

const albumImages = {
  family:
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
  travel:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  college:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
  gym:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  coding:
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  friends:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  pets:
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80",
  birthdays:
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
  events:
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  journal:
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
};

const stats = [
  { label: "Total Albums", value: "18", icon: "▣" },
  { label: "Memories in Albums", value: "412", icon: "◇" },
  { label: "Most Recent Album", value: "Events", icon: "◷" },
  { label: "Favorite Album", value: "Travel", icon: "♡" },
];

const featuredAlbum: Album = {
  id: 0,
  name: "Summer Escape",
  description: "A collection of warm sunsets, beaches, and slow weekends.",
  count: "42 memories",
  updated: "Updated 2 days ago",
  image: albumImages.travel,
  tags: ["Beach", "Sunset", "Travel"],
  thumbnails: [albumImages.travel, albumImages.friends, albumImages.journal],
};

const albums: Album[] = [
  {
    id: 1,
    name: "Family",
    description: "Everyday moments, birthdays, dinners, and home traditions.",
    count: "64 memories",
    updated: "Updated today",
    image: albumImages.family,
    tags: ["Home", "Love"],
    thumbnails: [albumImages.family, albumImages.birthdays, albumImages.pets],
  },
  {
    id: 2,
    name: "Travel",
    description: "Places visited, views saved, and little discoveries.",
    count: "58 memories",
    updated: "Updated yesterday",
    image: albumImages.travel,
    tags: ["Trips", "Nature"],
    thumbnails: [albumImages.travel, albumImages.friends, albumImages.college],
  },
  {
    id: 3,
    name: "College",
    description: "Campus days, milestones, friends, and proud endings.",
    count: "37 memories",
    updated: "Updated 4 days ago",
    image: albumImages.college,
    tags: ["School", "Milestone"],
    thumbnails: [albumImages.college, albumImages.friends, albumImages.journal],
  },
  {
    id: 4,
    name: "Gym",
    description: "Progress photos, routines, small wins, and stronger days.",
    count: "22 memories",
    updated: "Updated last week",
    image: albumImages.gym,
    tags: ["Fitness", "Growth"],
    thumbnails: [albumImages.gym, albumImages.journal, albumImages.coding],
  },
  {
    id: 5,
    name: "Coding",
    description: "Late-night builds, project notes, and learning snapshots.",
    count: "31 memories",
    updated: "Updated May 28",
    image: albumImages.coding,
    tags: ["Projects", "Learning"],
    thumbnails: [albumImages.coding, albumImages.journal, albumImages.college],
  },
  {
    id: 6,
    name: "Friends",
    description: "Hangouts, road trips, laughs, and golden-hour photos.",
    count: "45 memories",
    updated: "Updated May 20",
    image: albumImages.friends,
    tags: ["Weekend", "People"],
    thumbnails: [albumImages.friends, albumImages.travel, albumImages.birthdays],
  },
  {
    id: 7,
    name: "Pets",
    description: "Tiny chaos, soft moments, and the photos nobody deletes.",
    count: "26 memories",
    updated: "Updated May 12",
    image: albumImages.pets,
    tags: ["Home", "Cute"],
    thumbnails: [albumImages.pets, albumImages.family, albumImages.journal],
  },
  {
    id: 8,
    name: "Birthdays",
    description: "Candles, cakes, wishes, and the people gathered around.",
    count: "33 memories",
    updated: "Updated April 30",
    image: albumImages.birthdays,
    tags: ["Celebration", "Family"],
    thumbnails: [albumImages.birthdays, albumImages.family, albumImages.friends],
  },
  {
    id: 9,
    name: "Events",
    description: "Special days, gatherings, and moments that only happen once.",
    count: "29 memories",
    updated: "Updated April 12",
    image: albumImages.events,
    tags: ["Gatherings", "Milestones"],
    thumbnails: [albumImages.events, albumImages.birthdays, albumImages.friends],
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

function ThumbnailStack({ images }: { images: string[] }) {
  return (
    <div className="flex -space-x-3">
      {images.map((image) => (
        <img
          key={image}
          src={image}
          alt=""
          className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
        />
      ))}
    </div>
  );
}

function AlbumCard({
  album,
  openMenuId,
  onToggleMenu,
}: {
  album: Album;
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
      <div className="relative h-44 overflow-hidden">
        <img
          src={album.image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
        <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-lg text-emerald-700 shadow-sm backdrop-blur">
          ▣
        </div>
        <div className="absolute right-3 top-3">
          <button
            type="button"
            aria-label={`Open menu for ${album.name}`}
            onClick={() => onToggleMenu(album.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-slate-500 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-emerald-700"
          >
            ⋯
          </button>

          <AnimatePresence>
            {openMenuId === album.id ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
              >
                {["Rename", "Archive", "Delete"].map((action) => (
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

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {album.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-emerald-700">
              {album.count}
            </p>
          </div>
          <ThumbnailStack images={album.thumbnails} />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {album.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {album.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
          {album.updated}
        </p>
      </div>
    </motion.article>
  );
}

export default function AlbumsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            Collections
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Albums
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Organize your memories into beautiful collections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Album
        </button>
      </motion.section>

      {/* Album Stats */}
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

      {/* Featured Album */}
      <motion.section
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35 }}
        className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      >
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
            <img
              src={featuredAlbum.image}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4">
              <ThumbnailStack images={featuredAlbum.thumbnails} />
              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                Featured Album
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {featuredAlbum.count}
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {featuredAlbum.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {featuredAlbum.description}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {featuredAlbum.updated}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {featuredAlbum.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Album Grid */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            openMenuId={openMenuId}
            onToggleMenu={(id) =>
              setOpenMenuId((current) => (current === id ? null : id))
            }
          />
        ))}
      </motion.section>

      {/* Empty State - keep hidden until there are no albums.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
          ▣
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          No albums yet.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Create your first collection of memories.
        </p>
      </motion.section>
      */}

      {/* New Album Modal */}
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
              aria-labelledby="new-album-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            >
              <form
                onSubmit={(event) => event.preventDefault()}
                className="max-h-[90vh] overflow-y-auto p-5 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Create Collection
                    </p>
                    <h2
                      id="new-album-title"
                      className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      New Album
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Organize a new memory collection. Saving will be wired up
                      later.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close new album modal"
                    onClick={() => setIsModalOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.25rem] border border-white bg-white/80 p-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                        ▣
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-950">
                        Album cover
                      </p>
                      <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                        Placeholder only. Real uploads will be added later.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Album name">
                      <input
                        type="text"
                        placeholder="Family, Travel, Coding..."
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Description">
                      <textarea
                        placeholder="Describe this collection..."
                        rows={5}
                        className={`${inputClasses()} resize-none`}
                      />
                    </FormField>

                    <FormField label="Privacy">
                      <select className={inputClasses()}>
                        <option>Private</option>
                        <option>Shared Later</option>
                      </select>
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
                    Create Album
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

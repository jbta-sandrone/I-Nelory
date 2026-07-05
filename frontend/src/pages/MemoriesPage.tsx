import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

type MemoryType = "Photo" | "Video" | "Story";

type Memory = {
  id: number;
  title: string;
  caption: string;
  date: string;
  mood: string;
  type: MemoryType;
  tags: string[];
  image: string;
  favorite: boolean;
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

const memories: Memory[] = [
  {
    id: 1,
    title: "Beach Morning",
    caption: "Soft waves, quiet sand, and the first light after sunrise.",
    date: "July 5, 2026",
    mood: "Peaceful",
    type: "Photo",
    tags: ["Beach", "Travel", "Sunrise"],
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    favorite: true,
  },
  {
    id: 2,
    title: "Family Breakfast",
    caption: "A slow morning at home with warm coffee and familiar voices.",
    date: "July 3, 2026",
    mood: "Loved",
    type: "Photo",
    tags: ["Family", "Home"],
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
    favorite: true,
  },
  {
    id: 3,
    title: "Journal Entry",
    caption: "Notes from a day that felt small at first, then meaningful.",
    date: "June 29, 2026",
    mood: "Reflective",
    type: "Story",
    tags: ["Journal", "Thoughts"],
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
    favorite: false,
  },
  {
    id: 4,
    title: "City Walk",
    caption: "Evening lights, open streets, and a few photos worth keeping.",
    date: "June 24, 2026",
    mood: "Curious",
    type: "Photo",
    tags: ["City", "Evening"],
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    favorite: false,
  },
  {
    id: 5,
    title: "Mountain Weekend",
    caption: "A cool morning above the trees with the whole view opening up.",
    date: "June 18, 2026",
    mood: "Inspired",
    type: "Video",
    tags: ["Nature", "Travel"],
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    favorite: true,
  },
  {
    id: 6,
    title: "Birthday Candles",
    caption: "A room full of laughter right before the candles went out.",
    date: "June 12, 2026",
    mood: "Joyful",
    type: "Video",
    tags: ["Birthday", "Family"],
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
    favorite: false,
  },
  {
    id: 7,
    title: "Old Photo Box",
    caption: "Printed photos from years ago, finally gathered into one place.",
    date: "June 8, 2026",
    mood: "Nostalgic",
    type: "Story",
    tags: ["Archive", "Photos"],
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
    favorite: false,
  },
  {
    id: 8,
    title: "Quiet Garden",
    caption: "Green corners, soft air, and a moment that asked for nothing.",
    date: "May 30, 2026",
    mood: "Calm",
    type: "Photo",
    tags: ["Nature", "Peace"],
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    favorite: true,
  },
  {
    id: 9,
    title: "Graduation Day",
    caption: "The proud walk, the photos after, and the hugs that followed.",
    date: "May 18, 2026",
    mood: "Proud",
    type: "Photo",
    tags: ["School", "Milestone"],
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    favorite: false,
  },
  {
    id: 10,
    title: "Friends at Sunset",
    caption: "A golden hour that made a regular day feel unforgettable.",
    date: "May 10, 2026",
    mood: "Warm",
    type: "Photo",
    tags: ["Friends", "Sunset"],
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
    favorite: true,
  },
];

const typeStyles: Record<MemoryType, string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

const moods = [
  "All moods",
  "Peaceful",
  "Loved",
  "Reflective",
  "Joyful",
  "Nostalgic",
];

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

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

export default function MemoriesPage() {
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
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 sm:w-auto"
        >
          + New Memory
        </button>
      </motion.section>

      {/* Filters/Search Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search memories..."
            className={inputClasses()}
          />

          <select aria-label="Filter by mood" className={inputClasses()}>
            {moods.map((mood) => (
              <option key={mood}>{mood}</option>
            ))}
          </select>

          <select aria-label="Filter by type" className={inputClasses()}>
            <option>All types</option>
            <option>Photos</option>
            <option>Videos</option>
            <option>Stories</option>
          </select>

          <input
            aria-label="Filter by date"
            type="date"
            className={inputClasses()}
          />

          <select aria-label="Sort memories" className={inputClasses()}>
            <option>Newest first</option>
            <option>Oldest first</option>
          </select>
        </div>
      </motion.section>

      {/* Memory Grid */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {memories.map((memory) => (
          <motion.article
            key={memory.id}
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.35 }}
            className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <div className="relative h-52 overflow-hidden">
              <img
                src={memory.image}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[memory.type]}`}
                >
                  {memory.type}
                </span>
                <button
                  type="button"
                  aria-label={`Favorite ${memory.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  {memory.favorite ? "♥" : "♡"}
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-950">
                    {memory.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{memory.date}</p>
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label={`Open menu for ${memory.title}`}
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === memory.id ? null : memory.id,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    ⋯
                  </button>

                  <AnimatePresence>
                    {openMenuId === memory.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                      >
                        {["Edit", "Archive", "Delete"].map((action) => (
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
                {memory.caption}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {memory.mood}
                </span>
                {memory.tags.map((tag) => (
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
        ))}
      </motion.section>

      {/* Empty State - keep hidden until there are no memories.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
          ◇
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          No memories yet.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Start preserving your first moment.
        </p>
      </motion.section>
      */}

      {/* New Memory Modal */}
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
              aria-labelledby="new-memory-title"
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
                      Create Memory
                    </p>
                    <h2
                      id="new-memory-title"
                      className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                    >
                      New Memory
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Add the details now. Upload and saving will be connected
                      later.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close new memory modal"
                    onClick={() => setIsModalOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.25rem] border border-white bg-white/80 p-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                        +
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-950">
                        Upload image or video
                      </p>
                      <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                        Placeholder only. Real uploads will be added later.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Title">
                      <input
                        type="text"
                        placeholder="Memory title"
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Caption">
                      <textarea
                        placeholder="Write a short caption..."
                        rows={4}
                        className={`${inputClasses()} resize-none`}
                      />
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Date">
                        <input type="date" className={inputClasses()} />
                      </FormField>

                      <FormField label="Mood">
                        <select className={inputClasses()}>
                          <option>Peaceful</option>
                          <option>Joyful</option>
                          <option>Loved</option>
                          <option>Reflective</option>
                          <option>Nostalgic</option>
                        </select>
                      </FormField>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Tags">
                        <input
                          type="text"
                          placeholder="Family, Travel, Beach"
                          className={inputClasses()}
                        />
                      </FormField>

                      <FormField label="Album">
                        <select className={inputClasses()}>
                          <option>Family</option>
                          <option>Travel</option>
                          <option>Friends</option>
                          <option>Archive</option>
                        </select>
                      </FormField>
                    </div>
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
                    Save Memory
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

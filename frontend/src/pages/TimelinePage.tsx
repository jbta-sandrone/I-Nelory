import { motion, type Variants } from "framer-motion";

type MemoryType = "Photo" | "Video" | "Story";

type TimelineMemory = {
  id: number;
  year: string;
  month: string;
  title: string;
  date: string;
  caption: string;
  mood: string;
  album: string;
  location: string;
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
      duration: 0.55,
      ease: easeOut,
    },
  },
};

const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -28,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: easeOut,
    },
  },
};

const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 28,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
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

const timelineYears = [
  {
    year: "2026",
    memories: [
      {
        id: 1,
        year: "2026",
        month: "June",
        title: "Coastal Weekend",
        date: "June 21, 2026",
        caption:
          "A slow weekend by the water with quiet mornings, bright skies, and photos that still feel warm.",
        mood: "Peaceful",
        album: "Travel",
        location: "La Union, Philippines",
        type: "Photo" as MemoryType,
        tags: ["Beach", "Travel", "Sunrise"],
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
        favorite: true,
      },
      {
        id: 2,
        year: "2026",
        month: "April",
        title: "Family Morning",
        date: "April 12, 2026",
        caption:
          "Breakfast, familiar voices, and a small ordinary moment that became one of the good ones.",
        mood: "Loved",
        album: "Family",
        location: "Home",
        type: "Video" as MemoryType,
        tags: ["Family", "Home", "Morning"],
        image:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80",
        favorite: true,
      },
    ],
  },
  {
    year: "2025",
    memories: [
      {
        id: 3,
        year: "2025",
        month: "December",
        title: "Holiday Lights",
        date: "December 24, 2025",
        caption:
          "The room glowed softly, everyone stayed a little longer, and the night felt worth saving.",
        mood: "Joyful",
        album: "Family",
        location: "Quezon City",
        type: "Photo" as MemoryType,
        tags: ["Holiday", "Family", "Night"],
        image:
          "https://images.unsplash.com/photo-1512389098783-66b81f86e199?auto=format&fit=crop&w=1000&q=80",
        favorite: false,
      },
      {
        id: 4,
        year: "2025",
        month: "August",
        title: "Old Journal Pages",
        date: "August 9, 2025",
        caption:
          "A quiet note from a difficult week, kept because it shows how much changed afterward.",
        mood: "Reflective",
        album: "Journal",
        location: "Manila",
        type: "Story" as MemoryType,
        tags: ["Journal", "Growth", "Notes"],
        image:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=80",
        favorite: false,
      },
    ],
  },
  {
    year: "2024",
    memories: [
      {
        id: 5,
        year: "2024",
        month: "October",
        title: "Mountain Air",
        date: "October 3, 2024",
        caption:
          "A cold morning, a long road, and the kind of view that makes the whole day quieter.",
        mood: "Inspired",
        album: "Travel",
        location: "Baguio, Philippines",
        type: "Photo" as MemoryType,
        tags: ["Nature", "Travel", "Mountains"],
        image:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80",
        favorite: true,
      },
      {
        id: 6,
        year: "2024",
        month: "May",
        title: "Graduation Day",
        date: "May 18, 2024",
        caption:
          "The proud walk, the photos afterward, and the hugs that made everything feel real.",
        mood: "Proud",
        album: "School",
        location: "Campus Grounds",
        type: "Video" as MemoryType,
        tags: ["School", "Milestone", "Family"],
        image:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80",
        favorite: true,
      },
    ],
  },
  {
    year: "2023",
    memories: [
      {
        id: 7,
        year: "2023",
        month: "November",
        title: "Friends at Sunset",
        date: "November 7, 2023",
        caption:
          "A simple hangout turned golden for a few minutes, and everyone reached for their camera.",
        mood: "Warm",
        album: "Friends",
        location: "Tagaytay",
        type: "Photo" as MemoryType,
        tags: ["Friends", "Sunset", "Weekend"],
        image:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
        favorite: false,
      },
    ],
  },
];

const years = timelineYears.map((group) => group.year);

const typeStyles: Record<MemoryType, string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function scrollToYear(year: string) {
  document.getElementById(`timeline-${year}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function TimelineCard({
  memory,
  alignRight,
}: {
  memory: TimelineMemory;
  alignRight: boolean;
}) {
  return (
    <motion.article
      variants={alignRight ? slideInRight : slideInLeft}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="group min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative h-56 overflow-hidden">
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
        <div>
          <p className="text-sm font-medium text-slate-500">{memory.date}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {memory.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {memory.caption}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {memory.mood}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {memory.album}
          </span>
        </div>

        <div className="grid gap-3 overflow-hidden rounded-2xl bg-slate-50 p-0 text-sm text-slate-600 opacity-0 transition-all duration-300 group-hover:p-4 group-hover:opacity-100 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-950">Location:</span>{" "}
            {memory.location}
          </p>
          <p>
            <span className="font-semibold text-slate-950">Mood:</span>{" "}
            {memory.mood}
          </p>
          <p>
            <span className="font-semibold text-slate-950">Type:</span>{" "}
            {memory.type}
          </p>
          <p className="min-w-0">
            <span className="font-semibold text-slate-950">Tags:</span>{" "}
            {memory.tags.join(", ")}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function TimelinePage() {
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
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Memory Path
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
                ◷
              </span>
              Timeline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Travel through your memories, one moment at a time.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Timeline Controls */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search memories"
            className={inputClasses()}
          />

          <select aria-label="Filter by year" className={inputClasses()}>
            <option>All years</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select aria-label="Filter by month" className={inputClasses()}>
            <option>All months</option>
            <option>June</option>
            <option>April</option>
            <option>December</option>
            <option>August</option>
            <option>October</option>
            <option>May</option>
          </select>

          <select aria-label="Filter by album" className={inputClasses()}>
            <option>All albums</option>
            <option>Family</option>
            <option>Travel</option>
            <option>Journal</option>
            <option>School</option>
          </select>

          <select aria-label="Sort timeline" className={inputClasses()}>
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
        </div>

        <div className="mt-4 lg:hidden">
          <select
            aria-label="Jump to year"
            className={inputClasses()}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                scrollToYear(event.target.value);
              }
            }}
          >
            <option value="" disabled>
              Jump to year
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_8rem]">
        {/* Vertical Timeline */}
        <motion.section
          variants={staggerContainer}
          className="relative min-w-0 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-6 lg:p-8"
        >
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: easeOut }}
            className="absolute bottom-8 left-8 top-24 w-px origin-top bg-emerald-200 lg:left-1/2"
          />

          {timelineYears.map((yearGroup, yearIndex) => (
            <div
              key={yearGroup.year}
              id={`timeline-${yearGroup.year}`}
              className="scroll-mt-28"
            >
              <motion.div
                variants={fadeUp}
                className={`relative z-10 ${
                  yearIndex === 0 ? "" : "mt-14"
                } flex justify-start lg:justify-center`}
              >
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                  {yearGroup.year}
                </span>
              </motion.div>

              <div className="mt-8 space-y-8">
                {yearGroup.memories.map((memory, memoryIndex) => {
                  const alignRight = (yearIndex + memoryIndex) % 2 === 1;

                  return (
                    <motion.div
                      key={memory.id}
                      variants={staggerContainer}
                      className="relative grid gap-5 pl-10 lg:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] lg:gap-6 lg:pl-0"
                    >
                      <div
                        className={`hidden lg:block ${
                          alignRight ? "" : "lg:col-start-1"
                        }`}
                      >
                        {!alignRight ? (
                          <TimelineCard
                            memory={memory}
                            alignRight={alignRight}
                          />
                        ) : null}
                      </div>

                      <div className="absolute left-[1.1rem] top-3 z-10 flex flex-col items-center lg:static lg:col-start-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20">
                          ●
                        </span>
                        <span className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {memory.month}
                        </span>
                      </div>

                      <div
                        className={`min-w-0 lg:hidden ${
                          alignRight ? "lg:col-start-3" : "lg:col-start-1"
                        }`}
                      >
                        <TimelineCard memory={memory} alignRight={false} />
                      </div>

                      <div
                        className={`hidden min-w-0 lg:block ${
                          alignRight ? "lg:col-start-3" : ""
                        }`}
                      >
                        {alignRight ? (
                          <TimelineCard
                            memory={memory}
                            alignRight={alignRight}
                          />
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty State - keep hidden until timeline filters return no results.
          <motion.section
            variants={fadeUp}
            className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
              ◷
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              No memories found.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Start preserving moments to build your timeline.
            </p>
          </motion.section>
          */}
        </motion.section>

        {/* Timeline Navigation */}
        <motion.aside
          variants={fadeUp}
          className="hidden lg:block"
          aria-label="Timeline year navigation"
        >
          <div className="sticky top-24 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Years
            </p>
            <div className="space-y-1">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => scrollToYear(year)}
                  className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}

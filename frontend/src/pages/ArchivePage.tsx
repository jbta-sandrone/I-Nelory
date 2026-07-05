import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";

type ArchiveAction = "restore" | "delete" | null;

type ArchivedMemory = {
  id: number;
  title: string;
  date: string;
  archivedDate: string;
  caption: string;
  type: "Photo" | "Video" | "Story";
  album: string;
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
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const stats = [
  { label: "Archived Memories", value: "18", icon: "◫" },
  { label: "Archived Photos", value: "12", icon: "◇" },
  { label: "Archived Videos", value: "4", icon: "▶" },
  { label: "Recently Archived", value: "3", icon: "◷" },
];

const archivedMemories: ArchivedMemory[] = [
  {
    id: 1,
    title: "Old Beach Draft",
    date: "July 2, 2026",
    archivedDate: "Archived today",
    caption: "A quiet beach photo saved for later sorting.",
    type: "Photo",
    album: "Travel",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    title: "Blurry Family Shot",
    date: "June 30, 2026",
    archivedDate: "Archived yesterday",
    caption: "A soft, imperfect frame from a family morning.",
    type: "Photo",
    album: "Family",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    title: "Journal Fragment",
    date: "June 22, 2026",
    archivedDate: "Archived 2 days ago",
    caption: "A short reflection that may belong in a different album.",
    type: "Story",
    album: "Journal",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    title: "City Clip",
    date: "June 10, 2026",
    archivedDate: "Archived 4 days ago",
    caption: "A short evening clip from a walk downtown.",
    type: "Video",
    album: "Travel",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    title: "Gym Progress",
    date: "May 28, 2026",
    archivedDate: "Archived last week",
    caption: "A progress photo hidden while the album is being cleaned up.",
    type: "Photo",
    album: "Gym",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    title: "Old Birthday Video",
    date: "May 14, 2026",
    archivedDate: "Archived May 20",
    caption: "A birthday clip kept safe outside the main memories grid.",
    type: "Video",
    album: "Birthdays",
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    title: "Campus Notes",
    date: "April 18, 2026",
    archivedDate: "Archived May 4",
    caption: "A school memory tucked away while organizing college photos.",
    type: "Story",
    album: "College",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    title: "Sunset Duplicate",
    date: "March 26, 2026",
    archivedDate: "Archived April 8",
    caption: "A duplicate sunset frame preserved until review.",
    type: "Photo",
    album: "Friends",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 9,
    title: "Pet Outtake",
    date: "March 3, 2026",
    archivedDate: "Archived March 12",
    caption: "A sweet but messy pet photo hidden from the main album.",
    type: "Photo",
    album: "Pets",
    image:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80",
  },
];

const typeStyles: Record<ArchivedMemory["type"], string> = {
  Photo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Video: "bg-slate-950 text-white border-slate-950",
  Story: "bg-white text-slate-700 border-slate-200",
};

function inputClasses() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15";
}

function ConfirmationModal({
  action,
  memory,
  onClose,
}: {
  action: ArchiveAction;
  memory: ArchivedMemory | null;
  onClose: () => void;
}) {
  if (!action || !memory) {
    return null;
  }

  const isDelete = action === "delete";

  return (
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
        transition={{ duration: 0.25, ease: easeOut }}
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            isDelete
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isDelete ? "!" : "↺"}
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {isDelete ? "Delete this memory permanently?" : "Restore this memory?"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isDelete
            ? "This action cannot be undone."
            : `"${memory.title}" will return to your main memories and timeline.`}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
              isDelete
                ? "bg-red-600 shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/25"
                : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/25"
            }`}
          >
            {isDelete ? "Delete Permanently" : "Restore Memory"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ArchivePage() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<ArchivedMemory | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<ArchiveAction>(null);

  const openModal = (memory: ArchivedMemory, action: ArchiveAction) => {
    setSelectedMemory(memory);
    setModalAction(action);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setModalAction(null);
    setSelectedMemory(null);
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
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Protected Space
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              ◫
            </span>
            Archive
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Hidden memories stay safe here until you restore them.
          </p>
        </div>
      </motion.section>

      {/* Archive Info Banner */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm shadow-emerald-950/5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-emerald-700 shadow-sm">
            ⓘ
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Archived memories are safely tucked away.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Archived memories are hidden from your main timeline and memories
              grid, but they are not permanently deleted.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Archive Stats */}
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

      {/* Filter/Search Row */}
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <input
            type="search"
            placeholder="Search archived memories"
            className={inputClasses()}
          />

          <select aria-label="Filter by type" className={inputClasses()}>
            <option>All types</option>
            <option>Photos</option>
            <option>Videos</option>
            <option>Stories</option>
          </select>

          <select aria-label="Filter by album" className={inputClasses()}>
            <option>All albums</option>
            <option>Family</option>
            <option>Travel</option>
            <option>Journal</option>
            <option>College</option>
          </select>

          <select aria-label="Sort archived memories" className={inputClasses()}>
            <option>Recently Archived</option>
            <option>Oldest Archived</option>
          </select>
        </div>
      </motion.section>

      {/* Archived Memory Grid */}
      <motion.section
        variants={staggerContainer}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {archivedMemories.map((memory) => (
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
                className="h-full w-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[memory.type]}`}
                >
                  {memory.type}
                </span>
                <button
                  type="button"
                  onClick={() => openModal(memory, "restore")}
                  className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  Restore
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
                        className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10"
                      >
                        <button
                          type="button"
                          onClick={() => openModal(memory, "restore")}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(memory, "delete")}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                        >
                          Delete Permanently
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                {memory.caption}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {memory.album}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {memory.archivedDate}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.section>

      {/* Empty State - keep hidden until the archive is empty.
      <motion.section
        variants={fadeUp}
        className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-950/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
          ◫
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          Your archive is empty.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Archived memories will appear here.
        </p>
      </motion.section>
      */}

      <AnimatePresence>
        <ConfirmationModal
          action={modalAction}
          memory={selectedMemory}
          onClose={closeModal}
        />
      </AnimatePresence>
    </motion.div>
  );
}

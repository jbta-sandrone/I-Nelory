import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type NewMemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

export default function NewMemoryModal({
  isOpen,
  onClose,
}: NewMemoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
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
                  onClick={onClose}
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
                  onClick={onClose}
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
  );
}

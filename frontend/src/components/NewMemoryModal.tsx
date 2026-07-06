import { AnimatePresence, motion } from "framer-motion";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type ApiMemory = {
  id: string;
  title: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  memoryDate?: string | null;
  location?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  albumId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type SaveMemoryResponse = {
  message: string;
  memory: ApiMemory;
};

export type EditableMemory = {
  id: string;
  title: string;
  description?: string | null;
  memoryDate?: string | null;
  location?: string | null;
};

type NewMemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memory?: EditableMemory | null;
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

function getStoredToken() {
  return localStorage.getItem("i-nelory.auth.token");
}

function formatDateInputValue(memoryDate?: string | null) {
  if (!memoryDate) {
    return "";
  }

  const date = new Date(memoryDate);

  if (Number.isNaN(date.getTime())) {
    return memoryDate;
  }

  return date.toISOString().slice(0, 10);
}

export default function NewMemoryModal({
  isOpen,
  onClose,
  memory,
}: NewMemoryModalProps) {
  const isEditing = Boolean(memory);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const closeModal = () => {
    if (!isSaving) {
      setErrorMessage("");
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const memoryDate = String(formData.get("memoryDate") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    setErrorMessage("");

    if (!title) {
      setErrorMessage("Please add a memory title before saving.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setErrorMessage("Missing authentication token. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = memory
        ? `http://localhost:5000/api/memories/${encodeURIComponent(memory.id)}`
        : "http://localhost:5000/api/memories";
      const method = memory ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          memory
            ? {
                title,
                description: description || null,
                memoryDate: memoryDate || null,
                location: location || null,
              }
            : {
                title,
                description: description || undefined,
                memoryDate: memoryDate || undefined,
                location: location || undefined,
                mediaType: "IMAGE",
              },
        ),
      });

      const data = (await response.json().catch(() => null)) as
        | SaveMemoryResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (memory ? "Failed to update memory." : "Failed to save memory."),
        );
      }

      if (data && "memory" in data) {
        window.dispatchEvent(
          new CustomEvent<ApiMemory>(
            memory ? "i-nelory.memory.updated" : "i-nelory.memory.created",
            {
            detail: data.memory,
            },
          ),
        );
      }

      form.reset();
      setErrorMessage("");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : memory
            ? "Failed to update memory."
            : "Failed to save memory.";
      console.error(memory ? "Update memory failed:" : "Create memory failed:", error);
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

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
              onSubmit={handleSubmit}
              className="max-h-[90vh] overflow-y-auto p-5 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    {isEditing ? "Edit Memory" : "Create Memory"}
                  </p>
                  <h2
                    id="new-memory-title"
                    className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {isEditing ? "Edit Memory" : "New Memory"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {isEditing
                      ? "Update the details for this saved memory."
                      : "Add the details now. Upload and saving will be connected later."}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close new memory modal"
                  onClick={closeModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                >
                  &times;
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
                      name="title"
                      type="text"
                      placeholder="Memory title"
                      defaultValue={memory?.title ?? ""}
                      className={inputClasses()}
                    />
                  </FormField>

                  <FormField label="Caption">
                    <textarea
                      name="description"
                      placeholder="Write a short caption..."
                      rows={4}
                      defaultValue={memory?.description ?? ""}
                      className={`${inputClasses()} resize-none`}
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Date">
                      <input
                        name="memoryDate"
                        type="date"
                        defaultValue={formatDateInputValue(memory?.memoryDate)}
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Mood">
                      <select
                        name="location"
                        defaultValue={memory ? memory.location ?? "" : "Peaceful"}
                        className={inputClasses()}
                      >
                        {isEditing ? <option value="">No location</option> : null}
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
                        name="tags"
                        type="text"
                        placeholder="Family, Travel, Beach"
                        className={inputClasses()}
                      />
                    </FormField>

                    <FormField label="Album">
                      <select name="album" className={inputClasses()}>
                        <option>Family</option>
                        <option>Travel</option>
                        <option>Friends</option>
                        <option>Archive</option>
                      </select>
                    </FormField>
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
                >
                  {isSaving
                    ? isEditing
                      ? "Updating..."
                      : "Saving..."
                    : isEditing
                      ? "Update Memory"
                      : "Save Memory"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

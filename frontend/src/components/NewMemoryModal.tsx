import { AnimatePresence, motion } from "framer-motion";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ActionTransitionOverlay from "./ActionTransitionOverlay";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type ApiMemory = {
  id: string;
  title: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
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
  albumId?: string | null;
};

type NewMemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  memory?: EditableMemory | null;
};

type ApiAlbum = {
  id: string;
  name: string;
  description?: string | null;
};

type AlbumsResponse = {
  message: string;
  albums: ApiAlbum[];
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [albumErrorMessage, setAlbumErrorMessage] = useState("");
  const imagePreviewUrlRef = useRef("");

  const clearSelectedImage = () => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = "";
    }

    setSelectedImage(null);
    setImagePreviewUrl("");
    setUploadProgress(0);
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();

    async function fetchAlbums() {
      setIsAlbumLoading(true);
      setAlbumErrorMessage("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Missing authentication token. Please log in again.");
        }

        const response = await fetch("http://localhost:5000/api/albums", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as
          | AlbumsResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load albums.");
        }

        setAlbums("albums" in (data ?? {}) ? (data as AlbumsResponse).albums : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAlbums([]);
        setAlbumErrorMessage(
          error instanceof Error ? error.message : "Failed to load albums.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsAlbumLoading(false);
        }
      }
    }

    fetchAlbums();

    return () => controller.abort();
  }, [isOpen]);

  const closeModal = () => {
    if (!isSaving) {
      setErrorMessage("");
      setAlbumErrorMessage("");
      clearSelectedImage();
      onClose();
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearSelectedImage();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file. Video upload is disabled for now.");
      clearSelectedImage();
      return;
    }

    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    imagePreviewUrlRef.current = previewUrl;
    setSelectedImage(file);
    setImagePreviewUrl(previewUrl);
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const memoryDate = String(formData.get("memoryDate") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const albumId = String(formData.get("albumId") ?? "").trim();

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

    const transitionStartedAt = startActionTransition();
    let progressIntervalId: number | null = null;
    setIsSaving(true);
    setIsTransitioning(true);

    if (!isEditing) {
      setUploadProgress(selectedImage ? 12 : 0);
      progressIntervalId = window.setInterval(() => {
        setUploadProgress((current) => (current >= 88 ? current : current + 12));
      }, 220);
    }

    try {
      const endpoint = memory
        ? `http://localhost:5000/api/memories/${encodeURIComponent(memory.id)}`
        : "http://localhost:5000/api/memories";
      const method = memory ? "PATCH" : "POST";
      const createFormData = new FormData();

      createFormData.append("title", title);

      if (description) {
        createFormData.append("description", description);
      }

      if (memoryDate) {
        createFormData.append("memoryDate", memoryDate);
      }

      if (location) {
        createFormData.append("location", location);
      }

      if (albumId) {
        createFormData.append("albumId", albumId);
      }

      if (selectedImage) {
        createFormData.append("image", selectedImage);
      }

      const response = await fetch(endpoint, {
        method,
        headers: memory
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : {
              Authorization: `Bearer ${token}`,
            },
        body: memory
          ? JSON.stringify({
              title,
              description: description || null,
              memoryDate: memoryDate || null,
              location: location || null,
              albumId: albumId || null,
            })
          : createFormData,
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

      if (progressIntervalId) {
        window.clearInterval(progressIntervalId);
        progressIntervalId = null;
      }
      setUploadProgress(selectedImage ? 100 : 0);
      await waitForActionTransition(transitionStartedAt);
      setIsTransitioning(false);
      setIsSaving(false);
      form.reset();
      clearSelectedImage();
      setErrorMessage("");
      onClose();

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
    } catch (error) {
      if (progressIntervalId) {
        window.clearInterval(progressIntervalId);
      }
      await waitForActionTransition(transitionStartedAt);
      const message =
        error instanceof Error
          ? error.message
          : memory
            ? "Failed to update memory."
            : "Failed to save memory.";
      console.error(memory ? "Update memory failed:" : "Create memory failed:", error);
      setIsTransitioning(false);
      setUploadProgress(0);
      setErrorMessage(message);
      setIsSaving(false);
    }
  };

  return (
    <>
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
                  <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border border-white bg-white/80 p-5 text-center transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/5">
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isSaving || isEditing}
                      onChange={handleImageChange}
                    />
                    {imagePreviewUrl ? (
                      <div className="w-full">
                        <img
                          src={imagePreviewUrl}
                          alt=""
                          className="h-52 w-full rounded-[1.1rem] object-cover shadow-lg shadow-slate-950/10"
                        />
                        <p className="mt-4 truncate text-sm font-semibold text-slate-950">
                          {selectedImage?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                          +
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-950">
                          Upload image
                        </p>
                        <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                          Choose a photo from your device. Video upload is disabled for now.
                        </p>
                      </>
                    )}

                    {isEditing ? (
                      <p className="mt-4 text-xs font-medium text-slate-500">
                        Image changes are available when creating a memory.
                      </p>
                    ) : null}

                    {isSaving && selectedImage ? (
                      <div className="mt-4 w-full">
                        <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                          <motion.div
                            className="h-full rounded-full bg-emerald-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.25 }}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                          Uploading image... {uploadProgress}%
                        </p>
                      </div>
                    ) : null}
                  </label>
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
                      <select
                        name="albumId"
                        defaultValue={memory?.albumId ?? ""}
                        disabled={isSaving}
                        className={inputClasses()}
                      >
                        <option value="">No Album</option>
                        {albums.map((album) => (
                          <option key={album.id} value={album.id}>
                            {album.name}
                          </option>
                        ))}
                      </select>
                      {isAlbumLoading ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Loading albums...
                        </p>
                      ) : null}
                      {albumErrorMessage ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {albumErrorMessage}
                        </p>
                      ) : null}
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

      <ActionTransitionOverlay isOpen={isTransitioning} />
    </>
  );
}

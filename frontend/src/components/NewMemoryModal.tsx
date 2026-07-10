import { AnimatePresence, motion } from "framer-motion";
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ActionTransitionOverlay from "./ActionTransitionOverlay";
import FeedbackDialog from "./FeedbackDialog";
import {
  startActionTransition,
  waitForActionTransition,
} from "../utils/actionTransition";
import {
  MOOD_OPTIONS,
  SUGGESTED_TAGS,
  formatMoodLabel,
  getMemoryTagNames,
  type ApiTag,
} from "../utils/memoryMetadata";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type ApiMemory = {
  id: string;
  title: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  mediaType?: "image" | "video" | "IMAGE" | "VIDEO" | null;
  memoryDate?: string | null;
  location?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  albumId?: string | null;
  tags?: ApiTag[];
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
  tags?: ApiTag[] | string[];
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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

function addTagToList(tags: string[], tag: string) {
  const nextTag = tag.trim();

  if (!nextTag) {
    return tags;
  }

  return tags.some(
    (currentTag) => currentTag.toLowerCase() === nextTag.toLowerCase(),
  )
    ? tags
    : [...tags, nextTag];
}

function toggleTagInList(tags: string[], tag: string) {
  return tags.some(
    (currentTag) => currentTag.toLowerCase() === tag.toLowerCase(),
  )
    ? tags.filter(
        (currentTag) => currentTag.toLowerCase() !== tag.toLowerCase(),
      )
    : [...tags, tag];
}

function PickerShell({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-title`}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.26, ease: easeOut }}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <h3
                id={`${title.toLowerCase().replace(/\s+/g, "-")}-title`}
                className="text-2xl font-semibold tracking-tight text-slate-950"
              >
                {title}
              </h3>
              <button
                type="button"
                aria-label={`Close ${title}`}
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6">
              {children}
            </div>
            {footer ? (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MoodPickerModal({
  isOpen,
  selectedMood,
  onSelect,
  onClear,
  onClose,
}: {
  isOpen: boolean;
  selectedMood: string;
  onSelect: (mood: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <PickerShell isOpen={isOpen} title="Choose a mood" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = selectedMood === mood.name;

          return (
            <button
              key={mood.name}
              type="button"
              onClick={() => onSelect(mood.name)}
              className={`min-w-0 rounded-full border px-3 py-2 text-left text-xs font-semibold transition duration-300 hover:-translate-y-0.5 ${
                isSelected
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">
                {mood.emoji}
              </span>
              {mood.name}
            </button>
          );
        })}
      </div>

      {selectedMood ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Clear mood
        </button>
      ) : null}
    </PickerShell>
  );
}

function TagPickerModal({
  isOpen,
  selectedTags,
  customTag,
  onCustomTagChange,
  onToggleTag,
  onAddCustomTag,
  onCancel,
  onDone,
}: {
  isOpen: boolean;
  selectedTags: string[];
  customTag: string;
  onCustomTagChange: (tag: string) => void;
  onToggleTag: (tag: string) => void;
  onAddCustomTag: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const handleCustomTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAddCustomTag();
    }
  };

  return (
    <PickerShell
      isOpen={isOpen}
      title="Choose tags"
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
          >
            Done
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <p className="text-sm font-semibold text-slate-700">Selected tags</p>
          {selectedTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-emerald-50/70 p-3">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white"
                >
                  {tag} x
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No tags selected yet.
            </p>
          )}
        </section>

        <section>
          <p className="text-sm font-semibold text-slate-700">Suggested tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => {
              const isSelected = selectedTags.some(
                (selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase(),
              );

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-300 hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold text-slate-700">Custom tag</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customTag}
              onChange={(event) => onCustomTagChange(event.target.value)}
              onKeyDown={handleCustomTagKeyDown}
              placeholder="Add a custom tag"
              className={inputClasses()}
            />
            <button
              type="button"
              disabled={!customTag.trim()}
              onClick={onAddCustomTag}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </section>
      </div>
    </PickerShell>
  );
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
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [albumErrorMessage, setAlbumErrorMessage] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMoodPickerOpen, setIsMoodPickerOpen] = useState(false);
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [draftCustomTag, setDraftCustomTag] = useState("");
  const mediaPreviewUrlRef = useRef("");
  const selectedMediaType = getSelectedMediaType(selectedMedia);

  const clearSelectedMedia = () => {
    if (mediaPreviewUrlRef.current) {
      URL.revokeObjectURL(mediaPreviewUrlRef.current);
      mediaPreviewUrlRef.current = "";
    }

    setSelectedMedia(null);
    setMediaPreviewUrl("");
    setUploadProgress(0);
  };

  useEffect(() => {
    return () => {
      if (mediaPreviewUrlRef.current) {
        URL.revokeObjectURL(mediaPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedMood(memory?.location?.trim() || "");
    setSelectedTags(getMemoryTagNames(memory?.tags));
    setIsMoodPickerOpen(false);
    setIsTagPickerOpen(false);
    setDraftTags([]);
    setDraftCustomTag("");

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
  }, [isOpen, memory]);

  const openTagPicker = () => {
    setDraftTags(selectedTags);
    setDraftCustomTag("");
    setIsTagPickerOpen(true);
  };

  const addDraftCustomTag = () => {
    setDraftTags((currentTags) => addTagToList(currentTags, draftCustomTag));
    setDraftCustomTag("");
  };

  const closeTagPicker = () => {
    setIsTagPickerOpen(false);
    setDraftTags([]);
    setDraftCustomTag("");
  };

  const applyTagPicker = () => {
    setSelectedTags(addTagToList(draftTags, draftCustomTag));
    closeTagPicker();
  };

  const closeModal = () => {
    if (!isSaving) {
      setErrorMessage("");
      setAlbumErrorMessage("");
      setIsMoodPickerOpen(false);
      setIsTagPickerOpen(false);
      clearSelectedMedia();
      onClose();
    }
  };

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearSelectedMedia();
      return;
    }

    const mediaType = getSelectedMediaType(file);

    if (!mediaType) {
      setErrorMessage("Please choose an image or video file.");
      clearSelectedMedia();
      event.target.value = "";
      return;
    }

    if (mediaType === "image" && file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Images must be 5 MB or smaller.");
      clearSelectedMedia();
      event.target.value = "";
      return;
    }

    if (mediaType === "video" && file.size > MAX_VIDEO_SIZE) {
      setErrorMessage("Videos must be 50 MB or smaller.");
      clearSelectedMedia();
      event.target.value = "";
      return;
    }

    if (mediaPreviewUrlRef.current) {
      URL.revokeObjectURL(mediaPreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    mediaPreviewUrlRef.current = previewUrl;
    setSelectedMedia(file);
    setMediaPreviewUrl(previewUrl);
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const memoryDate = String(formData.get("memoryDate") ?? "").trim();
    const location = selectedMood.trim();
    const albumId = String(formData.get("albumId") ?? "").trim();
    const tagsToSave = selectedTags;

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

    if (!isEditing || selectedMedia) {
      setUploadProgress(selectedMedia ? 12 : 0);
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

      createFormData.append("tags", JSON.stringify(tagsToSave));

      if (albumId) {
        createFormData.append("albumId", albumId);
      } else if (memory) {
        createFormData.append("albumId", "");
      }

      if (selectedMedia) {
        createFormData.append("image", selectedMedia);
      }

      const shouldUseMultipart = !memory || Boolean(selectedMedia);

      const response = await fetch(endpoint, {
        method,
        headers: memory && !shouldUseMultipart
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : {
              Authorization: `Bearer ${token}`,
            },
        body: memory && !shouldUseMultipart
          ? JSON.stringify({
              title,
              description: description || null,
              memoryDate: memoryDate || null,
              location: location || null,
              albumId: albumId || null,
              tags: tagsToSave,
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
      setUploadProgress(selectedMedia ? 100 : 0);
      await waitForActionTransition(transitionStartedAt);
      setIsTransitioning(false);
      setIsSaving(false);
      form.reset();
      clearSelectedMedia();
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
                      : "Add the details and upload a photo or video."}
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
                      accept="image/*,video/*"
                      className="sr-only"
                      disabled={isSaving}
                      onChange={handleMediaChange}
                    />
                    {mediaPreviewUrl ? (
                      <div className="w-full">
                        {selectedMediaType === "video" ? (
                          <video
                            src={mediaPreviewUrl}
                            className="h-52 w-full rounded-[1.1rem] object-cover shadow-lg shadow-slate-950/10"
                            controls
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={mediaPreviewUrl}
                            alt=""
                            className="h-52 w-full rounded-[1.1rem] object-cover shadow-lg shadow-slate-950/10"
                          />
                        )}
                        <p className="mt-4 truncate text-sm font-semibold text-slate-950">
                          {selectedMedia?.name}
                        </p>
                        <p className="mt-1 text-xs font-medium capitalize text-emerald-700">
                          {selectedMediaType} selected
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                          +
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-950">
                          Upload photo or video
                        </p>
                        <p className="mt-2 max-w-48 text-xs leading-5 text-slate-500">
                          Photos up to 5 MB. Videos up to 50 MB.
                        </p>
                      </>
                    )}

                    {isEditing ? (
                      <p className="mt-4 text-xs font-medium text-slate-500">
                        Choose a new file only if you want to replace this memory media.
                      </p>
                    ) : null}

                    {isSaving && selectedMedia ? (
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
                          Uploading {selectedMediaType}... {uploadProgress}%
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
                  </div>

                  <FormField label="Mood">
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                      {selectedMood ? (
                        <>
                          <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20">
                            {formatMoodLabel(selectedMood)}
                          </span>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setIsMoodPickerOpen(true)}
                            className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                          >
                            Change Mood
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setSelectedMood("")}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                          >
                            Clear
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => setIsMoodPickerOpen(true)}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700"
                        >
                          + Add Mood
                        </button>
                      )}
                    </div>
                  </FormField>

                  <div className="grid gap-4">
                    <FormField label="Tags">
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
                        {selectedTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={openTagPicker}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                            selectedTags.length > 0
                              ? "border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                          }`}
                        >
                          {selectedTags.length > 0 ? "Edit Tags" : "+ Add Tags"}
                        </button>
                      </div>
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
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

      <MoodPickerModal
        isOpen={isMoodPickerOpen}
        selectedMood={selectedMood}
        onSelect={(mood) => {
          setSelectedMood(mood);
          setIsMoodPickerOpen(false);
        }}
        onClear={() => {
          setSelectedMood("");
          setIsMoodPickerOpen(false);
        }}
        onClose={() => setIsMoodPickerOpen(false)}
      />

      <TagPickerModal
        isOpen={isTagPickerOpen}
        selectedTags={draftTags}
        customTag={draftCustomTag}
        onCustomTagChange={setDraftCustomTag}
        onToggleTag={(tag) =>
          setDraftTags((currentTags) => toggleTagInList(currentTags, tag))
        }
        onAddCustomTag={addDraftCustomTag}
        onCancel={closeTagPicker}
        onDone={applyTagPicker}
      />

      <ActionTransitionOverlay isOpen={isTransitioning} />
      <FeedbackDialog
        isOpen={Boolean(errorMessage)}
        icon="!"
        title="Memory not saved"
        message={errorMessage}
        type="error"
        onDismiss={() => setErrorMessage("")}
      />
    </>
  );
}

function getSelectedMediaType(file?: File | null): "image" | "video" | null {
  if (!file) {
    return null;
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

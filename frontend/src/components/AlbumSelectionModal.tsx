import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredAuthToken } from "../services/auth";
import {
  getAlbumOptions,
  type AlbumOption,
} from "../services/memoryAlbums";

type AlbumSelectionModalProps = {
  isOpen: boolean;
  memoryTitle: string;
  onClose: () => void;
  onSelect: (album: AlbumOption) => Promise<void>;
};

function getAlbumPreview(album: AlbumOption) {
  if (album.coverUrl?.trim()) {
    return album.coverUrl;
  }

  return album.memories?.find(
    (memory) =>
      memory.mediaType?.toUpperCase() !== "VIDEO" && memory.mediaUrl?.trim(),
  )?.mediaUrl ?? null;
}

function getMemoryCount(album: AlbumOption) {
  return album._count?.memories ?? album.memories?.length ?? 0;
}

export default function AlbumSelectionModal({
  isOpen,
  memoryTitle,
  onClose,
  onSelect,
}: AlbumSelectionModalProps) {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingAlbumId, setSavingAlbumId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();
    const token = getStoredAuthToken();

    setAlbums([]);
    setLoadError("");
    setSaveError("");

    if (!token) {
      setLoadError("Your session has expired. Please sign in again.");
      return () => controller.abort();
    }

    setIsLoading(true);
    getAlbumOptions(token, controller.signal)
      .then(setAlbums)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Unable to load albums.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isOpen]);

  const selectAlbum = async (album: AlbumOption) => {
    if (savingAlbumId) {
      return;
    }

    setSavingAlbumId(album.id);
    setSaveError("");

    try {
      await onSelect(album);
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to add this memory to the album.",
      );
    } finally {
      setSavingAlbumId(null);
    }
  };

  const closeModal = () => {
    if (!savingAlbumId) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="album-selection-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Organize memory
                </p>
                <h2
                  id="album-selection-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                >
                  Add to album
                </h2>
                <p className="mt-2 truncate text-sm text-slate-500">
                  Choose an album for "{memoryTitle}".
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(savingAlbumId)}
                aria-label="Close album selection"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="max-h-[58vh] overflow-y-auto p-5 sm:p-6">
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex animate-pulse gap-3 rounded-2xl border border-slate-200 p-3"
                    >
                      <div className="h-16 w-16 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2 py-2">
                        <div className="h-4 w-2/3 rounded-full bg-slate-100" />
                        <div className="h-3 w-1/3 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
                  <p className="text-sm font-semibold text-red-700">
                    Could not load albums
                  </p>
                  <p className="mt-2 text-sm text-red-600">{loadError}</p>
                </div>
              ) : albums.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-semibold text-emerald-700">
                    A
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    No albums yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Create an album first, then return to organize this memory.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/albums")}
                    className="mt-5 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Create an album
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {albums.map((album) => {
                    const preview = getAlbumPreview(album);
                    const count = getMemoryCount(album);
                    const isSaving = savingAlbumId === album.id;

                    return (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => void selectAlbum(album)}
                        disabled={Boolean(savingAlbumId)}
                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {preview ? (
                          <img
                            src={preview}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-slate-100 text-lg font-semibold text-emerald-700">
                            {album.name.charAt(0).toUpperCase() || "A"}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-950">
                            {album.name}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {isSaving
                              ? "Adding..."
                              : `${count} ${count === 1 ? "memory" : "memories"}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {saveError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {saveError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5 sm:p-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(savingAlbumId)}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

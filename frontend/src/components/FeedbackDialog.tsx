import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";

export type FeedbackType = "success" | "error" | "info";

export type FeedbackState = {
  icon: ReactNode;
  title: string;
  message?: string;
  type?: FeedbackType;
};

type FeedbackDialogProps = FeedbackState & {
  isOpen: boolean;
  duration?: number;
  onDismiss: () => void;
};

const feedbackStyles: Record<
  FeedbackType,
  {
    icon: string;
    eyebrow: string;
    ring: string;
  }
> = {
  success: {
    icon: "bg-emerald-50 text-emerald-700",
    eyebrow: "text-emerald-600",
    ring: "ring-emerald-500/10",
  },
  error: {
    icon: "bg-red-50 text-red-600",
    eyebrow: "text-red-600",
    ring: "ring-red-500/10",
  },
  info: {
    icon: "bg-slate-100 text-slate-700",
    eyebrow: "text-slate-500",
    ring: "ring-slate-500/10",
  },
};

export default function FeedbackDialog({
  isOpen,
  icon,
  title,
  message,
  type = "success",
  duration = 1800,
  onDismiss,
}: FeedbackDialogProps) {
  const styles = feedbackStyles[type];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(onDismiss, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [duration, isOpen, onDismiss]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onDismiss}
        >
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 14 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-sm rounded-[2rem] border border-white/80 bg-white p-7 text-center shadow-2xl shadow-slate-950/20 ring-8 ${styles.ring}`}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold ${styles.icon}`}
            >
              {icon}
            </div>
            <p
              className={`mt-5 text-xs font-semibold uppercase tracking-[0.18em] ${styles.eyebrow}`}
            >
              {type}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            {message ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {message}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

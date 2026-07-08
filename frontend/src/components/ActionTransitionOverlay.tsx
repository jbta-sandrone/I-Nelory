import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { defaultActionMessages } from "../utils/actionTransition";

type ActionTransitionOverlayProps = {
  isOpen: boolean;
  messages?: string[];
  title?: string;
  subtitle?: string;
};

export default function ActionTransitionOverlay({
  isOpen,
  messages = defaultActionMessages,
  title,
  subtitle,
}: ActionTransitionOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, messages.length]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-slate-950/45 px-4 py-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_42%)]" />

          {Array.from({ length: 14 }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-emerald-300/70 shadow-[0_0_18px_rgba(52,211,153,0.75)]"
              style={{
                left: `${8 + ((index * 13) % 84)}%`,
                top: `${12 + ((index * 19) % 72)}%`,
              }}
              animate={{
                opacity: [0.25, 0.9, 0.25],
                scale: [0.8, 1.45, 0.8],
                y: [0, -18, 0],
              }}
              transition={{
                duration: 1.8 + (index % 4) * 0.18,
                repeat: Infinity,
                delay: index * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.div
            className="relative w-full max-w-md rounded-[2rem] border border-white/20 bg-white/85 p-7 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative mx-auto h-36 w-44">
              <motion.div
                className="absolute left-3 top-8 h-24 w-20 rounded-2xl border border-white bg-white p-2 shadow-xl shadow-slate-950/15"
                animate={{ y: [0, -9, 0], rotate: [-8, -4, -8] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-full rounded-xl bg-gradient-to-br from-emerald-100 via-white to-slate-100" />
              </motion.div>
              <motion.div
                className="absolute left-16 top-3 h-28 w-24 rounded-2xl border border-white bg-white p-2 shadow-2xl shadow-slate-950/20"
                animate={{ y: [0, 7, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-full rounded-xl bg-[linear-gradient(135deg,#d1fae5_0%,#ffffff_48%,#99f6e4_100%)]" />
              </motion.div>
              <motion.div
                className="absolute right-2 top-12 h-24 w-20 rounded-2xl border border-white bg-white p-2 shadow-xl shadow-slate-950/15"
                animate={{ y: [0, -6, 0], rotate: [8, 4, 8] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-full rounded-xl bg-gradient-to-br from-slate-100 via-white to-emerald-100" />
              </motion.div>
              <motion.div
                className="absolute bottom-5 left-1/2 h-px w-36 -translate-x-1/2 bg-emerald-300/70"
                animate={{ scaleX: [0.4, 1, 0.4], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-4 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.75)]"
                animate={{ x: [-62, 62, -62] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              I-Nelory
            </p>
            <AnimatePresence mode="wait">
              <motion.h2
                key={title ?? messages[messageIndex]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-3 text-xl font-semibold tracking-tight text-slate-950"
              >
                {title ?? messages[messageIndex]}
              </motion.h2>
            </AnimatePresence>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { useEffect, useState } from "react";
  import Lenis from "lenis";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import iNeloryLogo from "../assets/images/I-Nelory-logo.png";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import type { AuthUser } from "../services/auth";
import { useAppearance } from "../context/AppearanceContext";

  const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const fadeUp: Variants = {
    hidden: {
      opacity: 0,
      y: 44,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: easeOut,
      },
    },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const features = [
  {
    title: "Memory Timeline",
    icon: "timeline",
    description:
      "A calm chronological view for photos, videos, notes, and the small details around each moment.",
  },
  {
    title: "Private Albums",
    icon: "albums",
    description:
      "Collect trips, family stories, milestones, and everyday scenes into thoughtful personal spaces.",
  },
  {
    title: "Story Archive",
    icon: "archive",
    description:
      "Pair media with written reflections so every memory keeps its context, not just its timestamp.",
  },
  {
    title: "Favorites",
    icon: "favorites",
    description:
      "Pin the moments that matter most and return to them without searching through noise.",
  },
];

  const memoryCards = [
    {
      title: "Coastal Weekend",
      date: "June 2026",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Family Morning",
      date: "April 2026",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Quiet Notes",
      date: "March 2026",
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const backgroundImages = [
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1800&q=80",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=80",
  ];

  const aiExamples = [
    "Show me every beach trip.",
    "Find memories with my family.",
    "Show birthday celebrations.",
  ];

const timelineItems = [
    {
      year: "2026",
      title: "A summer album begins",
      detail: "38 photos, 4 videos, and a journal entry saved together.",
    },
    {
      year: "2025",
      title: "Family traditions collected",
      detail: "Recurring moments become a private story of people and places.",
    },
    {
      year: "2024",
      title: "First archive imported",
      detail: "Old images and notes find a cleaner long-term home.",
    },
];

const loadingMessages = [
  "Transporting you to your digital world...",
  "Taking you home...",
  "Opening your memory space...",
  "Opening your private archive...",
  "Gathering your favorite moments...",
  "Restoring your memory space...",
  "Hopping in...",
];

const loadingMemoryElements = [
  { icon: "▧", x: "-132%", y: "-70%", rotate: -12, duration: 3.8, delay: 0 },
  { icon: "◫", x: "66%", y: "-82%", rotate: 10, duration: 4.2, delay: 0.2 },
  { icon: "✦", x: "-92%", y: "42%", rotate: 8, duration: 3.6, delay: 0.4 },
  { icon: "◉", x: "112%", y: "28%", rotate: -8, duration: 4.4, delay: 0.1 },
  { icon: "□", x: "-12%", y: "-110%", rotate: 4, duration: 4, delay: 0.3 },
];

  type ScrollBackgroundImageProps = {
    image: string;
    index: number;
    total: number;
    progress: MotionValue<number>;
    reducedMotion: boolean | null;
  };

function ScrollBackgroundImage({
    image,
    index,
    total,
    progress,
    reducedMotion,
  }: ScrollBackgroundImageProps) {
    const center = total === 1 ? 0 : index / (total - 1);
    const start = Math.max(0, center - 0.24);
    const end = Math.min(1, center + 0.24);
    const range: [number, number, number] = [start, center, end];
    const opacity: [number, number, number] =
    index === 0
      ? [1, 1, 0]
      : index === total - 1
      ? [0, 1, 1]
      : [0, 1, 0];
    const imageOpacity = useTransform(progress, range, opacity);
    const y = useTransform(progress, [range[0], range[2]], [70, -70]);
    const scale = useTransform(progress, range, [1.08, 1.02, 1.08]);
    const filter = useTransform(progress, range, [
      "blur(6px)",
      "blur(3px)",
      "blur(6px)",
    ]);

    return (
      <motion.div
        className="fixed inset-[-8%] bg-cover bg-center saturate-75"
        style={{
          backgroundImage: `url(${image})`,
          opacity: reducedMotion ? 0 : imageOpacity,
          y: reducedMotion ? 0 : y,
          scale: reducedMotion ? 1.04 : scale,
          filter: reducedMotion ? "blur(12px)" : filter,
        }}
      />
  );
}

function FeatureIcon({ name }: { name: string }) {
  if (name === "timeline") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M12 4v16M7 6h10M7 12h10M7 18h10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M5 6h.01M5 12h.01M5 18h.01"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </svg>
    );
  }

  if (name === "albums") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M6 7.5V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M4 9.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m5 17 3-3 2.2 2.2L12 14l3 3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "archive") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M5 5.5h14v4H5zM7 9.5h10V20H7z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M10 13h4M10 16h4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="m12 20-7-7a4.2 4.2 0 0 1 0-6 4.2 4.2 0 0 1 6 0l1 1 1-1a4.2 4.2 0 0 1 6 0 4.2 4.2 0 0 1 0 6z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LoadingTransition() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const { resolvedTheme } = useAppearance();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % loadingMessages.length);
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDotCount((current) => (current % 3) + 1);
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 z-[120] flex items-center justify-center px-6 ${
        isDark ? "bg-slate-950" : "bg-white"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_30%_70%,rgba(148,163,184,0.10),transparent_24%)]"
            : "bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_30%_70%,rgba(15,23,42,0.06),transparent_24%)]"
        }`}
      />
      <div
        className={`absolute left-1/4 top-1/4 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-emerald-950/40" : "bg-emerald-100/50"
        }`}
      />
      <div
        className={`absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full blur-3xl ${
          isDark ? "bg-slate-900/80" : "bg-slate-100/80"
        }`}
      />

      <div className="relative w-full max-w-md text-center">
        <div className="relative mx-auto h-40 w-56">
          {loadingMemoryElements.map((element) => (
            <motion.div
              key={`${element.icon}-${element.x}`}
              className={`absolute left-1/2 top-1/2 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg shadow-xl backdrop-blur-sm ${
                isDark
                  ? "border-white/10 bg-slate-900/90 text-emerald-400 shadow-black/25"
                  : "border-slate-200 bg-white/90 text-emerald-600 shadow-slate-950/10"
              }`}
              initial={{
                opacity: 0,
                x: "-50%",
                y: "-50%",
                rotate: element.rotate,
                scale: 0.9,
              }}
              animate={{
                opacity: [0, 0.78, 0.56, 0.78],
                x: [element.x, `calc(${element.x} + 10px)`, element.x],
                y: [element.y, `calc(${element.y} - 12px)`, element.y],
                rotate: [element.rotate, element.rotate + 3, element.rotate],
                scale: [0.96, 1.04, 0.98],
              }}
              transition={{
                duration: element.duration,
                delay: element.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span aria-hidden="true">{element.icon}</span>
            </motion.div>
          ))}

          {[0, 1, 2].map((card) => (
            <motion.div
              key={card}
              className={`absolute left-1/2 top-1/2 h-28 w-24 rounded-[1.25rem] border shadow-xl ${
                isDark
                  ? "border-slate-700 bg-slate-900 shadow-black/25"
                  : "border-slate-200 bg-white shadow-slate-950/10"
              }`}
              initial={{
                opacity: 0,
                x: "-50%",
                y: "-50%",
                rotate: card === 0 ? -10 : card === 1 ? 0 : 10,
                scale: 0.94,
              }}
              animate={{
                opacity: [0.82, 1, 0.86],
                x:
                  card === 0
                    ? ["-92%", "-96%", "-92%"]
                    : card === 1
                    ? ["-50%", "-48%", "-50%"]
                    : ["-8%", "-4%", "-8%"],
                y:
                  card === 1
                    ? ["-58%", "-64%", "-58%"]
                    : ["-42%", "-48%", "-42%"],
                rotate:
                  card === 0
                    ? [-10, -7, -10]
                    : card === 1
                    ? [0, 2, 0]
                    : [10, 7, 10],
                scale: [0.98, 1.03, 0.99],
              }}
              transition={{
                duration: 2.8 + card * 0.35,
                delay: card * 0.12,
                repeat: Infinity,
                ease: easeOut,
              }}
            >
              <div
                className={`m-3 h-16 rounded-2xl ${
                  isDark ? "bg-emerald-950/60" : "bg-emerald-50"
                }`}
              />
              <div
                className={`mx-3 h-2 rounded-full ${
                  isDark ? "bg-slate-700" : "bg-slate-100"
                }`}
              />
              <div
                className={`mx-3 mt-2 h-2 w-2/3 rounded-full ${
                  isDark ? "bg-slate-700" : "bg-slate-100"
                }`}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          I-Nelory
        </motion.p>

        <div className="mt-4 min-h-16">
          <AnimatePresence mode="wait">
            <motion.p
              className={`text-2xl font-semibold tracking-tight ${
                isDark ? "text-slate-100" : "text-slate-950"
              }`}
              key={loadingMessages[messageIndex]}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: easeOut }}
            >
              {loadingMessages[messageIndex].replace(/\.+$/, "")}
              {".".repeat(dotCount)}
            </motion.p>
          </AnimatePresence>
        </div>

        <div
          className={`relative mx-auto mt-8 h-2 max-w-xs overflow-hidden rounded-full shadow-inner ${
            isDark ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <motion.div
            className="relative h-full rounded-full bg-emerald-600 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 7, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-y-0 w-16 bg-white/35 blur-sm"
              animate={{ x: ["-100%", "260%"] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

type LandingPageProps = {
  onLoginSuccess: (user: AuthUser) => void;
};

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -70]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.96]);
    const albumY = useTransform(scrollYProgress, [0, 0.5], [0, -90]);

    useEffect(() => {
      if (prefersReducedMotion) {
        return;
      }

      const lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 0.9,
      });

      let frameId = 0;

      const raf = (time: number) => {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      };

      frameId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(frameId);
        lenis.destroy();
      };
    }, [prefersReducedMotion]);

    const openLoginModal = () => {
        setShowSignup(false);
        setShowLogin(true);
    };

    const openSignupModal = () => {
        setShowLogin(false);
        setShowSignup(true);
    };

    const closeAuthModals = () => {
        setShowLogin(false);
        setShowSignup(false);
    };

    const handleLoginSuccess = (user: AuthUser) => {
        onLoginSuccess(user);
        closeAuthModals();
        setIsLoggingIn(true);

        window.setTimeout(() => {
            navigate("/dashboard");
        }, 8000);
    };

    return (
      <main className="relative isolate min-h-screen overflow-x-hidden bg-white text-slate-950">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          {backgroundImages.map((image, index) => (
            <ScrollBackgroundImage
              key={image}
              image={image}
              index={index}
              total={backgroundImages.length}
              progress={scrollYProgress}
              reducedMotion={prefersReducedMotion}
            />
          ))}
          <div className="absolute inset-0 bg-white/5" />
        </motion.div>

        {/* Navbar */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
          <nav
            aria-label="Primary navigation"
            className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8"
          >
            <a
              href="#"
              className="flex items-center gap-3 text-xl font-semibold tracking-tight"
            >
              <img
                src={iNeloryLogo}
                alt=""
                className="h-10 w-10 rounded-xl object-contain"
                aria-hidden="true"
              />
              <span className="font-serif text-xl">I-Nelory</span>
            </a>

            <div className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
              <a className="transition hover:text-slate-950" href="#journey">
                About
              </a>
              <a className="transition hover:text-slate-950" href="#features">
                Features
              </a>
              <a className="transition hover:text-slate-950" href="#ai-search">
                AI Search
              </a>
              <a className="transition hover:text-slate-950" href="#timeline">
                Timeline
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openLoginModal}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:text-slate-950"
              >
                Login
              </button>
              <button
                type="button"
                onClick={openSignupModal}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition duration-300 hover:-translate-y-1 hover:opacity-90 hover:shadow-lg hover:shadow-emerald-600/25"
              >
                Sign Up
              </button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 pb-28 pt-32 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-36 lg:pt-40">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{
              y: prefersReducedMotion ? 0 : heroY,
              scale: prefersReducedMotion ? 1 : heroScale,
            }}
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
            >
              Your Personal Digital Memory.
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
            >
              Preserve your life&apos;s moments beautifully.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-lg leading-8 text-black-/80 sm:text-xl sm:leading-9"
            >
              I-Nelory is a private digital memory platform for saving photos,
              videos, stories, albums, and meaningful moments — enhanced with
              intelligent memory search.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={openSignupModal}
                className="rounded-full bg-emerald-700 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-xl shadow-slate-950/10 transition duration-300 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-2xl hover:shadow-slate-950/15"
              >
                Sign Up Free
              </button>
              <a
                href="#features"
                className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:opacity-50 hover:shadow-lg hover:bg-white/80"
              >
                Explore Features
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative min-h-[34rem]"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.12 }}
            style={{ y: prefersReducedMotion ? 0 : albumY }}
          >
            <motion.div
              className="absolute left-0 top-10 h-72 w-56 overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-slate-950/15"
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ y: -10, scale: 1.03 }}
            >
              <img
                src={memoryCards[0].image}
                alt=""
                className="h-full w-full rounded-[1.35rem] object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute right-0 top-0 h-80 w-64 overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-slate-950/15"
              animate={prefersReducedMotion ? {} : { y: [0, 14, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ y: -10, scale: 1.03 }}
            >
              <img
                src={memoryCards[1].image}
                alt=""
                className="h-full w-full rounded-[1.35rem] object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute bottom-4 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10"
              animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Memory Album
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Private archive overview
                  </p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  248 saved
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {memoryCards.map((card) => (
                  <div key={card.title}>
                    <img
                      src={card.image}
                      alt=""
                      className="h-24 w-full rounded-2xl object-cover"
                    />
                    <p className="mt-2 truncate text-xs font-medium text-slate-700">
                      {card.title}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Memory Journey / About */}
        <motion.section
          id="journey"
          className="relative z-10 overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.28 }}
          variants={fadeUp}
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Memory Journey
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                A calm place where every chapter can live.
              </h2>
              <p className="mt-6 text-lg leading-8 text-black-900 weight-900">
                I-Nelory turns scattered photos, journals, videos, and albums
                into a private story you can move through with clarity. It feels
                less like storage and more like opening a beautifully organized
                digital photo album.
              </p>
            </div>

            <motion.div
              className="grid gap-4 sm:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.32 }}
            >
              {memoryCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.025 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 p-3 shadow-xl shadow-slate-950/8 backdrop-blur-sm hover:shadow-2xl hover:bg-white/60"
                >
                  <img
                    src={card.image}
                    alt=""
                    className={`h-56 w-full rounded-[1.25rem] object-cover ${
                      index === 1 ? "sm:mt-8" : ""
                    }`}
                  />
                  <div className="px-2 py-4">
                    <p className="text-sm font-semibold text-slate-950">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{card.date}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Features */}
        <section
          id="features"
          className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Features
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything feels organized, personal, and easy to revisit.
            </h2>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.025 }}
                transition={{ duration: 0.35 }}
                className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-950/5 backdrop-blur-sm hover:shadow-xl hover:bg-white/60"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FeatureIcon name={feature.icon} />
                </div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* AI Memory Search */}
        <motion.section
          id="ai-search"
          className="relative z-10 overflow-hidden bg-slate-950/90 text-white backdrop-blur-sm"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
        >
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                AI Memory Search
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Ask for a memory the way you remember it.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                AI is not the product. It is a quiet layer that helps you find
                moments naturally, without manually sorting through years of
                photos and notes.
              </p>
            </div>

            <motion.div
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20"
              variants={staggerContainer}
            >
              <div className="rounded-[1.5rem] bg-white/95 p-4 text-slate-950">
                <p className="text-sm font-semibold">Search your memories</p>
                <div className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                  Show me every beach trip.
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {aiExamples.map((example, index) => (
                  <motion.div
                    key={example}
                    variants={fadeUp}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 hover:bg-white/15"
                  >
                    <div className="h-24 overflow-hidden rounded-xl">
                      <img
                        src={memoryCards[index].image}
                        alt=""
                        className="h-full w-full object-cover opacity-85"
                      />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-100">
                      {example}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Timeline Preview */}
        <section
          id="timeline"
          className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <motion.div
            className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Timeline Preview
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Move through years like pages in a quiet album.
              </h2>
              <p className="mt-6 text-lg leading-8 text-black-600">
                Your timeline keeps moments connected by time, people, places,
                and the stories you attach to them.
              </p>
            </motion.div>

            <div className="space-y-5">
              {timelineItems.map((item) => (
                <motion.article
                  key={item.title}
                  variants={fadeUp}
                  whileHover={{ x: 8, scale: 1.01 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-950/5 backdrop-blur-sm hover:bg-white/60"
                >
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                      {item.year}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <motion.section
          id="cta"
          className="relative z-10 px-6 py-24 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.32 }}
          variants={fadeUp}
        >
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-16 text-center shadow-2xl shadow-slate-950/8 backdrop-blur-sm sm:px-12">
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start preserving the moments that matter.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Build a private memory space that feels calm, beautiful, and made
              to last.
            </p>
            <a
              href="#"
              className="mt-10 inline-flex rounded-full bg-emerald-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-600/20 transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-600/30"
            >
              Start Preserving
            </a>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-100 bg-white/70 px-6 py-10 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl text-sm text-black-500">
            © 2026 I-Nelory. Your Personal Digital Memory.
          </div>
        </footer>

        <LoginPage
          isOpen={showLogin}
          onClose={closeAuthModals}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={openSignupModal}
        />
        <SignupPage
          isOpen={showSignup}
          onClose={closeAuthModals}
          onSwitchToLogin={openLoginModal}
        />
        <AnimatePresence>{isLoggingIn ? <LoadingTransition /> : null}</AnimatePresence>
      </main>
    );
  }

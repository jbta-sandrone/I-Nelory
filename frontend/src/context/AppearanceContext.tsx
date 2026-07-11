import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "i-nelory.appearance.theme";
const COMPACT_STORAGE_KEY = "i-nelory.appearance.compact";
const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
]);

type AppearanceContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (themePreference: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
  compactMode: boolean;
  setCompactMode: (compactMode: boolean) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function canUseDOM() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isThemePreference(value: string | null): value is ThemePreference {
  return Boolean(value && THEME_OPTIONS.includes(value as ThemePreference));
}

function getStoredThemePreference(): ThemePreference {
  if (!canUseDOM()) {
    return "system";
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isThemePreference(storedPreference) ? storedPreference : "system";
}

function getStoredCompactMode() {
  if (!canUseDOM()) {
    return false;
  }

  return window.localStorage.getItem(COMPACT_STORAGE_KEY) === "true";
}

function getSystemTheme(): ResolvedTheme {
  if (!canUseDOM()) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(themePreference: ThemePreference): ResolvedTheme {
  return themePreference === "system" ? getSystemTheme() : themePreference;
}

function isPublicPath() {
  return canUseDOM() && PUBLIC_PATHS.has(window.location.pathname);
}

function isPublicLightThemeActive() {
  return (
    canUseDOM() &&
    document.documentElement.hasAttribute("data-public-light-theme")
  );
}

function setPublicLightThemeActive(isActive: boolean) {
  if (!canUseDOM()) {
    return;
  }

  document.documentElement.toggleAttribute("data-public-light-theme", isActive);

  if (isActive) {
    document.documentElement.classList.remove("dark", "compact");
    document.documentElement.style.colorScheme = "light";
  }
}

function applyThemeClass(resolvedTheme: ResolvedTheme) {
  if (!canUseDOM()) {
    return;
  }

  const appliedTheme = isPublicLightThemeActive() ? "light" : resolvedTheme;

  document.documentElement.classList.toggle("dark", appliedTheme === "dark");
  document.documentElement.style.colorScheme = appliedTheme;
}

function applyCompactClass(compactMode: boolean) {
  if (!canUseDOM()) {
    return;
  }

  document.documentElement.classList.toggle(
    "compact",
    compactMode && !isPublicLightThemeActive(),
  );
}

export function initializeAppearance() {
  setPublicLightThemeActive(isPublicPath());

  const themePreference = getStoredThemePreference();

  applyThemeClass(resolveTheme(themePreference));
  applyCompactClass(getStoredCompactMode());
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [themePreference, updateThemePreference] = useState<ThemePreference>(
    getStoredThemePreference,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredThemePreference()),
  );
  const [compactMode, updateCompactMode] = useState(getStoredCompactMode);

  const setThemePreference = useCallback(
    (nextThemePreference: ThemePreference) => {
      updateThemePreference(nextThemePreference);
    },
    [],
  );

  const setCompactMode = useCallback((nextCompactMode: boolean) => {
    updateCompactMode(nextCompactMode);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);

    const applyResolvedTheme = () => {
      const nextResolvedTheme = resolveTheme(themePreference);
      setResolvedTheme(nextResolvedTheme);
      applyThemeClass(nextResolvedTheme);
    };

    applyResolvedTheme();

    if (themePreference !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyResolvedTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyResolvedTheme);
    };
  }, [themePreference]);

  useEffect(() => {
    window.localStorage.setItem(COMPACT_STORAGE_KEY, String(compactMode));
    applyCompactClass(compactMode);
  }, [compactMode]);

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      resolvedTheme,
      compactMode,
      setCompactMode,
    }),
    [
      compactMode,
      resolvedTheme,
      setCompactMode,
      setThemePreference,
      themePreference,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }

  return context;
}

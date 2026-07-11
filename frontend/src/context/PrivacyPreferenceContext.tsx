import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getStoredAuthToken } from "../services/auth";
import {
  DEFAULT_PRIVACY_PREFERENCES,
  getPrivacyPreferences,
  type PrivacyPreferenceKey,
  type PrivacyPreferences,
  updatePrivacyPreferences,
} from "../services/privacyPreferences";

type PrivacyPreferenceContextValue = {
  preferences: PrivacyPreferences;
  isLoading: boolean;
  loadError: string;
  pendingFields: Set<PrivacyPreferenceKey>;
  savePreferences: (
    updates: Partial<PrivacyPreferences>,
  ) => Promise<void>;
};

const PrivacyPreferenceContext =
  createContext<PrivacyPreferenceContextValue | null>(null);

export function PrivacyPreferenceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(
    DEFAULT_PRIVACY_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingFields, setPendingFields] = useState<
    Set<PrivacyPreferenceKey>
  >(() => new Set());

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      setLoadError("Please sign in again to load privacy preferences.");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    getPrivacyPreferences(token)
      .then(({ preferences: loadedPreferences }) => {
        if (isActive) {
          setPreferences(loadedPreferences);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load privacy preferences.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const savePreferences = useCallback(
    async (updates: Partial<PrivacyPreferences>) => {
      const token = getStoredAuthToken();
      const fields = Object.keys(updates) as PrivacyPreferenceKey[];
      const previousValues = Object.fromEntries(
        fields.map((field) => [field, preferences[field]]),
      ) as Partial<PrivacyPreferences>;

      if (!token) {
        throw new Error("Please sign in again to update privacy preferences.");
      }

      setPreferences((current) => ({ ...current, ...updates }));
      setPendingFields((current) => {
        const next = new Set(current);
        fields.forEach((field) => next.add(field));
        return next;
      });

      try {
        await updatePrivacyPreferences(token, updates);
      } catch (error) {
        setPreferences((current) => {
          const next = { ...current };

          fields.forEach((field) => {
            if (current[field] === updates[field]) {
              next[field] = previousValues[field] ?? true;
            }
          });

          return next;
        });
        throw error;
      } finally {
        setPendingFields((current) => {
          const next = new Set(current);
          fields.forEach((field) => next.delete(field));
          return next;
        });
      }
    },
    [preferences],
  );

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      loadError,
      pendingFields,
      savePreferences,
    }),
    [isLoading, loadError, pendingFields, preferences, savePreferences],
  );

  return (
    <PrivacyPreferenceContext.Provider value={value}>
      {children}
    </PrivacyPreferenceContext.Provider>
  );
}

export function usePrivacyPreferences() {
  const context = useContext(PrivacyPreferenceContext);

  if (!context) {
    throw new Error(
      "usePrivacyPreferences must be used within PrivacyPreferenceProvider",
    );
  }

  return context;
}

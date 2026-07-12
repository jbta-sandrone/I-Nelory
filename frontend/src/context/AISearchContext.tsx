import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ViewableMemory } from "../components/MemoryViewerModal";

export type AISearchResult = ViewableMemory & {
  id: string;
  location: string;
  image: string | null;
  matchedFields: string[];
};

type AISearchContextValue = {
  searchText: string;
  setSearchText: (value: string) => void;
  submittedQuery: string;
  setSubmittedQuery: (value: string) => void;
  responseText: string;
  setResponseText: (value: string) => void;
  results: AISearchResult[];
  setResults: (results: AISearchResult[]) => void;
  isSearching: boolean;
  beginSearch: () => boolean;
  finishSearch: () => void;
  searchError: string;
  setSearchError: (value: string) => void;
  hasSearched: boolean;
  setHasSearched: (value: boolean) => void;
  clearSearch: () => void;
};

const AISearchContext = createContext<AISearchContextValue | null>(null);

export function AISearchProvider({ children }: { children: ReactNode }) {
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [responseText, setResponseText] = useState("");
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInFlightRef = useRef(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSubmittedQuery("");
    setResponseText("");
    setResults([]);
    setSearchError("");
    setHasSearched(false);
  }, []);

  const beginSearch = useCallback(() => {
    if (searchInFlightRef.current) {
      return false;
    }

    searchInFlightRef.current = true;
    setIsSearching(true);
    return true;
  }, []);

  const finishSearch = useCallback(() => {
    searchInFlightRef.current = false;
    setIsSearching(false);
  }, []);

  const value = useMemo(
    () => ({
      searchText,
      setSearchText,
      submittedQuery,
      setSubmittedQuery,
      responseText,
      setResponseText,
      results,
      setResults,
      isSearching,
      beginSearch,
      finishSearch,
      searchError,
      setSearchError,
      hasSearched,
      setHasSearched,
      clearSearch,
    }),
    [
      beginSearch,
      clearSearch,
      finishSearch,
      hasSearched,
      isSearching,
      responseText,
      results,
      searchError,
      searchText,
      submittedQuery,
    ],
  );

  return (
    <AISearchContext.Provider value={value}>
      {children}
    </AISearchContext.Provider>
  );
}

export function useAISearch() {
  const context = useContext(AISearchContext);

  if (!context) {
    throw new Error("useAISearch must be used within AISearchProvider");
  }

  return context;
}

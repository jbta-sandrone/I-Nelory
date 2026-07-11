import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import {
  clearAuthSession,
  getCurrentUser,
  getStoredAuthToken,
  getStoredAuthUser,
  saveAuthUser,
  type AuthUser,
} from "./services/auth";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import MemoriesPage from "./pages/MemoriesPage";
import TimelinePage from "./pages/TimelinePage";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import ArchivePage from "./pages/ArchivePage";
import AISearchPage from "./pages/AISearchPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotificationPage from "./pages/NotificationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AuthGuard from "./components/AuthGuard";
import PublicLightLayout from "./components/PublicLightLayout";
import { PrivacyPreferenceProvider } from "./context/PrivacyPreferenceContext";

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const token = getStoredAuthToken();
    return token ? getStoredAuthUser() : null;
  });
  const [isRestoringUser, setIsRestoringUser] = useState(() =>
    Boolean(getStoredAuthToken())
  );

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      if (authUser) {
        clearAuthSession();
        setAuthUser(null);
      }
      setIsRestoringUser(false);
      return;
    }

    let isActive = true;

    getCurrentUser(token)
      .then(({ user }) => {
        if (!isActive) {
          return;
        }

        setAuthUser(user);
        saveAuthUser(user);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        clearAuthSession();
        setAuthUser(null);
      })
      .finally(() => {
        if (isActive) {
          setIsRestoringUser(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const authContextValue = useMemo(
    () => ({
      user: authUser,
      setUser: setAuthUser,
      isRestoringUser,
    }),
    [authUser, isRestoringUser]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicLightLayout>
                <LandingPage onLoginSuccess={setAuthUser} />
              </PublicLightLayout>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicLightLayout>
                <VerifyEmailPage />
              </PublicLightLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <PrivacyPreferenceProvider>
                  <Dashboard />
                </PrivacyPreferenceProvider>
              </AuthGuard>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:id" element={<AlbumDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="ai-search" element={<AISearchPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path=":section" element={<DashboardHomePlaceholder />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function DashboardHomePlaceholder() {
  const { section } = useParams();
  const title = section
    ? section
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Home";

  return (
    <section className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          This is the first I-Nelory dashboard shell. The content pages will be
          built next.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Saved memories", "248"],
          ["Albums", "18"],
          ["Favorites", "42"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default App;

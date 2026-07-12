import { motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackDialog, { type FeedbackState } from "../components/FeedbackDialog";
import {
  useAppearance,
  type ThemePreference,
} from "../context/AppearanceContext";
import { useAuth } from "../context/AuthContext";
import { usePrivacyPreferences } from "../context/PrivacyPreferenceContext";
import {
  changePassword,
  changeUsername,
  clearAuthSession,
  getStoredAuthToken,
  requestChangeEmail,
  saveAuthUser,
} from "../services/auth";
import { deleteAccount, exportAccountData } from "../services/account";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationPreferenceKey,
  type NotificationPreferences,
  updateNotificationPreferences,
} from "../services/notificationPreferences";
import { getStorageSummary, type StorageSummary } from "../services/storage";
import { formatBytes } from "../utils/formatBytes";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

function cardClasses() {
  return "rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6";
}

function Toggle({
  checked,
  onChange,
  label,
  mixed = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  mixed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-12 min-w-[3rem] flex-none shrink-0 rounded-full transition duration-300 ${
        checked || mixed ? "bg-emerald-600" : "bg-slate-200"
      }`}
    >
      <motion.span
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{ left: mixed ? 14 : checked ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onToggle,
  mixed,
  disabled,
  badge,
}: {
  title: string;
  description: string;
  checked?: boolean;
  onToggle?: () => void;
  mixed?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 transition duration-300 hover:bg-white hover:shadow-md hover:shadow-slate-950/5 sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-slate-950">
          {title}
        </p>
        <p className="mt-1 break-words text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {badge}
        </span>
      ) : (
        <Toggle
          checked={Boolean(checked)}
          onChange={onToggle ?? (() => undefined)}
          label={title}
          mixed={mixed}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuth();
  const {
    themePreference,
    setThemePreference,
    compactMode,
    setCompactMode,
  } = useAppearance();
  const {
    preferences: privacyPreferences,
    isLoading: privacyPreferencesLoading,
    loadError: privacyPreferencesLoadError,
    pendingFields: pendingPrivacyFields,
    savePreferences: savePrivacyPreferences,
  } = usePrivacyPreferences();
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [usernameForm, setUsernameForm] = useState({ username: authUser?.username ?? "" });
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notificationPreferencesReady, setNotificationPreferencesReady] =
    useState(false);
  const [pendingNotificationFields, setPendingNotificationFields] = useState<
    Set<NotificationPreferenceKey>
  >(() => new Set());
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(
    null,
  );
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [deleteAccountForm, setDeleteAccountForm] = useState({
    currentPassword: "",
    confirmationPhrase: "",
  });
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const deleteAccountDialogRef = useRef<HTMLDivElement>(null);

  const loadStorageSummary = useCallback(async () => {
    const token = getStoredAuthToken();

    if (!token) {
      setStorageError("Please sign in again to load storage usage.");
      setStorageLoading(false);
      return;
    }

    setStorageLoading(true);
    setStorageError("");

    try {
      setStorageSummary(await getStorageSummary(token));
    } catch (error) {
      setStorageSummary(null);
      setStorageError(
        error instanceof Error
          ? error.message
          : "Unable to load storage usage.",
      );
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStorageSummary();
  }, [loadStorageSummary]);

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      return;
    }

    let isActive = true;

    getNotificationPreferences(token)
      .then(({ preferences }) => {
        if (isActive) {
          setNotificationPreferences(preferences);
          setNotificationPreferencesReady(true);
        }
      })
      .catch((error) => {
        if (isActive) {
          setNotificationPreferencesReady(true);
          setFeedback({
            icon: "!",
            title: "Could not load notification preferences",
            message:
              error instanceof Error
                ? error.message
                : "Please try opening Settings again.",
            type: "error",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (privacyPreferencesLoadError) {
      setFeedback({
        icon: "!",
        title: "Could not load privacy preferences",
        message: privacyPreferencesLoadError,
        type: "error",
      });
    }
  }, [privacyPreferencesLoadError]);

  const togglePrivacyPreference = async (
    field: "confirmBeforeDelete" | "allowAiSearch",
  ) => {
    try {
      await savePrivacyPreferences({
        [field]: !privacyPreferences[field],
      });
    } catch (error) {
      setFeedback({
        icon: "!",
        title: "Could not save privacy preferences",
        message:
          error instanceof Error
            ? error.message
            : "Your previous privacy preference has been restored.",
        type: "error",
      });
    }
  };

  const saveNotificationPreferences = async (
    updates: Partial<NotificationPreferences>,
  ) => {
    const token = getStoredAuthToken();
    const fields = Object.keys(updates) as NotificationPreferenceKey[];
    const previousValues = Object.fromEntries(
      fields.map((field) => [field, notificationPreferences[field]]),
    ) as Partial<NotificationPreferences>;

    if (!token) {
      setFeedback({
        icon: "!",
        title: "Session expired",
        message: "Please sign in again to update notification preferences.",
        type: "error",
      });
      return;
    }

    setNotificationPreferences((current) => ({ ...current, ...updates }));
    setPendingNotificationFields((current) => {
      const next = new Set(current);
      fields.forEach((field) => next.add(field));
      return next;
    });

    try {
      await updateNotificationPreferences(token, updates);
    } catch (error) {
      setNotificationPreferences((current) => {
        const next = { ...current };

        fields.forEach((field) => {
          if (current[field] === updates[field]) {
            next[field] = previousValues[field] ?? true;
          }
        });

        return next;
      });
      setFeedback({
        icon: "!",
        title: "Could not save notification preferences",
        message:
          error instanceof Error
            ? error.message
            : "Your previous preferences have been restored.",
        type: "error",
      });
    } finally {
      setPendingNotificationFields((current) => {
        const next = new Set(current);
        fields.forEach((field) => next.delete(field));
        return next;
      });
    }
  };

  const toggleNotificationPreference = (field: NotificationPreferenceKey) => {
    void saveNotificationPreferences({
      [field]: !notificationPreferences[field],
    });
  };

  const enabledNotificationCount = NOTIFICATION_PREFERENCE_KEYS.filter(
    (field) => notificationPreferences[field],
  ).length;
  const allNotificationsEnabled =
    enabledNotificationCount === NOTIFICATION_PREFERENCE_KEYS.length;
  const someNotificationsEnabled =
    enabledNotificationCount > 0 && !allNotificationsEnabled;
  const notificationsBusy = pendingNotificationFields.size > 0;

  const toggleAllNotifications = () => {
    const nextValue = !allNotificationsEnabled;
    const updates = Object.fromEntries(
      NOTIFICATION_PREFERENCE_KEYS.map((field) => [field, nextValue]),
    ) as NotificationPreferences;

    void saveNotificationPreferences(updates);
  };

  const handleChangeUsername = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getStoredAuthToken();

    if (!token) {
      setFeedback({
        icon: "⚠️",
        title: "Session expired",
        message: "Please sign in again to change your username.",
        type: "error",
      });
      return;
    }

    setIsChangingUsername(true);

    try {
      const response = await changeUsername(token, usernameForm.username.trim());
      setUser(response.user);
      saveAuthUser(response.user);
      setFeedback({
        icon: "✓",
        title: "Username updated",
        message: response.message,
        type: "success",
      });
      setIsUsernameModalOpen(false);
      setUsernameForm({ username: response.user.username });
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not update username",
        message:
          error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setIsChangingUsername(false);
    }
  };

  const handleChangeEmailRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getStoredAuthToken();

    if (!token) {
      setFeedback({
        icon: "⚠️",
        title: "Session expired",
        message: "Please sign in again to change your email.",
        type: "error",
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      const response = await requestChangeEmail(token, {
        newEmail: emailForm.newEmail.trim(),
        currentPassword: emailForm.currentPassword,
      });

      setFeedback({
        icon: "✉️",
        title: "Verification email sent",
        message: response.message,
        type: "success",
      });
      setIsEmailModalOpen(false);
      setEmailForm({ newEmail: "", currentPassword: "" });
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not update email",
        message:
          error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getStoredAuthToken();

    if (!token) {
      setFeedback({
        icon: "⚠️",
        title: "Session expired",
        message: "Please sign in again to change your password.",
        type: "error",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setFeedback({
        icon: "✓",
        title: "Password updated",
        message: response.message,
        type: "success",
      });
      setIsPasswordModalOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setFeedback({
        icon: "⚠️",
        title: "Could not update password",
        message:
          error instanceof Error ? error.message : "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closeDeleteAccountModal = useCallback(() => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteAccountModalOpen(false);
    setDeleteAccountError("");
    setDeleteAccountForm({ currentPassword: "", confirmationPhrase: "" });
  }, [isDeletingAccount]);

  useEffect(() => {
    if (!isDeleteAccountModalOpen) {
      return;
    }

    const dialog = deleteAccountDialogRef.current;
    dialog?.querySelector<HTMLElement>("input")?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeletingAccount) {
        closeDeleteAccountModal();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled])',
        ),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => window.removeEventListener("keydown", handleDialogKeyDown);
  }, [closeDeleteAccountModal, isDeleteAccountModalOpen, isDeletingAccount]);

  const handleExportData = async () => {
    const token = getStoredAuthToken();

    if (!token) {
      setFeedback({
        icon: "!",
        title: "Session expired",
        message: "Please sign in again before exporting your data.",
        type: "error",
      });
      return;
    }

    setIsExporting(true);

    try {
      const { blob, filename } = await exportAccountData(token);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);

      setFeedback({
        icon: "✓",
        title: "Export ready",
        message: "Your portable I-Nelory data has been downloaded.",
        type: "success",
      });
    } catch (error) {
      setFeedback({
        icon: "!",
        title: "Could not export your data",
        message:
          error instanceof Error ? error.message : "Please try again shortly.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = getStoredAuthToken();

    if (!token) {
      setDeleteAccountError("Your session has expired. Please sign in again.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError("");

    try {
      await deleteAccount(token, {
        currentPassword: deleteAccountForm.currentPassword,
        confirmationPhrase: deleteAccountForm.confirmationPhrase.trim(),
      });
      clearAuthSession();
      setUser(null);
      window.dispatchEvent(new Event("i-nelory.auth.cleared"));
      setIsDeleteAccountModalOpen(false);
      setDeleteAccountForm({ currentPassword: "", confirmationPhrase: "" });
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteAccountError(
        error instanceof Error
          ? error.message
          : "Unable to delete your account. Please try again.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const canDeleteAccount =
    deleteAccountForm.currentPassword.trim().length > 0 &&
    deleteAccountForm.confirmationPhrase.trim() === "DELETE MY ACCOUNT" &&
    !isDeletingAccount;

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Page Header */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
      >
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Preferences
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              ⚙
            </span>
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Customize how your memory space works.
          </p>
        </div>
      </motion.section>

      <motion.div
        variants={staggerContainer}
        className="grid gap-6 xl:grid-cols-2"
      >
        {/* Account Settings */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle
              icon="◌"
              title="Account Settings"
              subtitle="Manage the essentials for signing in and staying connected."
            />
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Username
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {authUser?.username || "No username"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUsernameModalOpen(true)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
                >
                  Change Username
                </button>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {authUser?.email || "No email on file"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
                >
                  Change Email
                </button>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Password
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    ••••••••
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Appearance */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <SectionTitle
            icon="◐"
            title="Appearance"
            subtitle="Shape the visual feel of your memory space."
          />

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Theme</p>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setThemePreference(option.value)}
                    aria-pressed={themePreference === option.value}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition duration-300 ${
                      themePreference === option.value
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <SettingRow
              title="Compact mode"
              description="Use tighter spacing for denser memory views."
              checked={compactMode}
              onToggle={() => setCompactMode(!compactMode)}
            />
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <SectionTitle
            icon="◷"
            title="Notifications"
            subtitle="Choose the reminders that feel useful."
          />

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Master
              </p>
              <SettingRow
                title="Enable All Notifications"
                description={
                  someNotificationsEnabled
                    ? "Some enabled. Quickly enable or disable every optional notification category."
                    : "Quickly enable or disable every optional notification category."
                }
                checked={allNotificationsEnabled}
                mixed={someNotificationsEnabled}
                disabled={!notificationPreferencesReady || notificationsBusy}
                onToggle={toggleAllNotifications}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                In-App Activity
              </p>
              <SettingRow
                title="Memory Activity"
                description="Receive notifications when memories are created, edited, archived, restored, or deleted."
                checked={notificationPreferences.notifyMemoryActivity}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyMemoryActivity")
                }
                onToggle={() =>
                  toggleNotificationPreference("notifyMemoryActivity")
                }
              />
              <SettingRow
                title="Album Activity"
                description="Receive notifications when albums are created, edited, or deleted."
                checked={notificationPreferences.notifyAlbumActivity}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyAlbumActivity")
                }
                onToggle={() =>
                  toggleNotificationPreference("notifyAlbumActivity")
                }
              />
              <SettingRow
                title="Favorite Activity"
                description="Receive notifications when memories are added to or removed from Favorites."
                checked={notificationPreferences.notifyFavoriteActivity}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyFavoriteActivity")
                }
                onToggle={() =>
                  toggleNotificationPreference("notifyFavoriteActivity")
                }
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Smart Features &amp; Reminders
              </p>
              <SettingRow
                title="AI Search"
                description="Receive notifications related to AI-powered memory search."
                checked={notificationPreferences.notifyAiSearch}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyAiSearch")
                }
                onToggle={() => toggleNotificationPreference("notifyAiSearch")}
              />
              <SettingRow
                title="Memory Reminders"
                description="Gentle reminders to capture new memories."
                checked={notificationPreferences.notifyMemoryReminders}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyMemoryReminders")
                }
                onToggle={() =>
                  toggleNotificationPreference("notifyMemoryReminders")
                }
              />
              <SettingRow
                title="On This Day"
                description="Revisit memories from previous years."
                checked={notificationPreferences.notifyOnThisDay}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyOnThisDay")
                }
                onToggle={() => toggleNotificationPreference("notifyOnThisDay")}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                System
              </p>
              <SettingRow
                title="Storage Alerts"
                description="Receive notifications when storage usage or upload limits require your attention."
                checked={notificationPreferences.notifyStorageAlerts}
                disabled={
                  !notificationPreferencesReady ||
                  pendingNotificationFields.has("notifyStorageAlerts")
                }
                onToggle={() =>
                  toggleNotificationPreference("notifyStorageAlerts")
                }
              />
              <SettingRow
                title="Account"
                description="Notifications for email changes, account updates, and verification requests."
                badge="Always enabled"
              />
              <SettingRow
                title="Security"
                description="Notifications for password changes, security events, and important account protection."
                badge="Always enabled"
              />
            </div>
          </div>
        </motion.section>

        {/* Privacy */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <SectionTitle
            icon="◫"
            title="Privacy"
            subtitle="Keep your archive personal and protected."
          />

          <div className="mt-6 space-y-3">
            <SettingRow
              title="Require confirmation before deleting"
              description="Show a confirmation dialog before permanently deleting memories or albums."
              checked={privacyPreferences.confirmBeforeDelete}
              disabled={
                privacyPreferencesLoading ||
                Boolean(privacyPreferencesLoadError) ||
                pendingPrivacyFields.has("confirmBeforeDelete")
              }
              onToggle={() =>
                void togglePrivacyPreference("confirmBeforeDelete")
              }
            />
            <SettingRow
              title="AI Search permission"
              description="Allow AI Search to analyze your memory captions, tags, moods, album names, and dates."
              checked={privacyPreferences.allowAiSearch}
              disabled={
                privacyPreferencesLoading ||
                Boolean(privacyPreferencesLoadError) ||
                pendingPrivacyFields.has("allowAiSearch")
              }
              onToggle={() => void togglePrivacyPreference("allowAiSearch")}
            />
          </div>
        </motion.section>

        {/* Storage */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <SectionTitle
            icon="▣"
            title="Storage"
            subtitle="Preview how your memory space is being used."
          />

          <div className="mt-6">
            {storageLoading ? (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Loading storage usage...
                </p>
              </div>
            ) : storageError ? (
              <div className="rounded-[1.25rem] border border-red-100 bg-red-50 p-5 text-center">
                <p className="text-sm font-semibold text-red-600">
                  Storage usage could not be loaded
                </p>
                <p className="mt-2 text-sm text-slate-500">{storageError}</p>
                <button
                  type="button"
                  onClick={() => void loadStorageSummary()}
                  className="mt-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition duration-300 hover:border-emerald-200 hover:text-emerald-700"
                >
                  Retry
                </button>
              </div>
            ) : storageSummary ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                      {formatBytes(storageSummary.usedBytes)} used
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      of {formatBytes(storageSummary.limitBytes)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-emerald-700">
                      {formatBytes(storageSummary.remainingBytes)} remaining
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/memories?manageStorage=1")
                    }
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
                  >
                    Manage Storage
                  </button>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      storageSummary.usagePercentage >= 90
                        ? "bg-red-500"
                        : storageSummary.usagePercentage >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, storageSummary.usagePercentage))}%`,
                    }}
                  />
                </div>

                {storageSummary.usagePercentage >= 80 ? (
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      storageSummary.usagePercentage >= 90
                        ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                        : "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        storageSummary.usagePercentage >= 90
                          ? "text-red-700"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {storageSummary.usagePercentage >= 100
                        ? "Storage full"
                        : storageSummary.usagePercentage >= 90
                          ? "Storage is almost full"
                          : "Storage is running low"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {storageSummary.usagePercentage >= 100
                        ? "New uploads are blocked until memory media is permanently deleted."
                        : "Review large memory files to keep enough room for new uploads."}
                    </p>
                  </div>
                ) : null}

                {storageSummary.hasUnknownUsage ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Storage metadata synchronization required
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {storageSummary.unknownMediaCount} legacy media file
                      {storageSummary.unknownMediaCount === 1 ? " has" : "s have"} an unknown size. New memory uploads remain blocked until the one-time backfill is run.
                    </p>
                  </div>
                ) : null}

                {storageSummary.totalMemories === 0 ? (
                  <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-950">
                      No memories are using storage yet.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Your photos and videos will appear here after you add them.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Total Memories",
                        value: `${storageSummary.totalMemories} memories`,
                      },
                      {
                        label: "Photos",
                        value: `${storageSummary.imageCount} files • ${formatBytes(storageSummary.imageBytes)}`,
                      },
                      {
                        label: "Videos",
                        value: `${storageSummary.videoCount} files • ${formatBytes(storageSummary.videoBytes)}`,
                      },
                      {
                        label: "Archived",
                        value: `${storageSummary.archivedCount} memories • ${formatBytes(storageSummary.archivedBytes)} included in total`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm leading-5 text-slate-500">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </motion.section>
      </motion.div>

      {isUsernameModalOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Account
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Change your username
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick a new username that is unique to your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUsernameModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleChangeUsername}>
              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={usernameForm.username}
                  onChange={(event) => setUsernameForm({ username: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="yourname"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsUsernameModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingUsername}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {isChangingUsername ? "Saving..." : "Save username"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEmailModalOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Security
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Change your email
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We will send a verification link to the new address before updating your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleChangeEmailRequest}>
              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="newEmail">
                  New email
                </label>
                <input
                  id="newEmail"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(event) => setEmailForm((current) => ({ ...current, newEmail: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="currentPassword">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={emailForm.currentPassword}
                  onChange={(event) => setEmailForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingEmail}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {isChangingEmail ? "Sending..." : "Send verification link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Security
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Change your password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Use a strong password that you have not used before.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleChangePassword}>
              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="currentPassword">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="newPassword">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="Choose a new password"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="confirmPassword">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {isChangingPassword ? "Saving..." : "Save password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <FeedbackDialog
          isOpen={Boolean(feedback)}
          icon={feedback.icon}
          title={feedback.title}
          message={feedback.message}
          type={feedback.type}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      {/* Danger Zone */}
      <motion.section
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="rounded-4xl border border-red-100 bg-white p-5 shadow-sm shadow-red-950/5 sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-lg text-red-600">
              !
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Danger Zone
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Export a portable copy of your data, or permanently delete your
                account and every memory associated with it.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleExportData()}
              disabled={isExporting}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? "Preparing export..." : "Export Data"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError("");
                setIsDeleteAccountModalOpen(true);
              }}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25"
            >
              Delete Account
            </button>
          </div>
        </div>
      </motion.section>

      {isDeleteAccountModalOpen ? (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteAccountModal();
            }
          }}
        >
          <div
            ref={deleteAccountDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-4xl border border-red-100 bg-white p-6 shadow-2xl shadow-slate-950/25 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
                  Permanent action
                </p>
                <h2
                  id="delete-account-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                >
                  Delete your account?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteAccountModal}
                disabled={isDeletingAccount}
                aria-label="Close account deletion dialog"
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div
              id="delete-account-description"
              className="mt-5 rounded-3xl border border-red-100 bg-red-50/70 p-5 text-sm leading-6 text-slate-700 dark:bg-red-950/30"
            >
              <p className="font-semibold text-red-700">
                This cannot be undone. It permanently deletes:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>your account</li>
                <li>all memories and albums</li>
                <li>all uploaded images and videos</li>
                <li>notifications and preferences</li>
              </ul>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleDeleteAccount}>
              <div>
                <label
                  className="text-sm font-semibold text-slate-950"
                  htmlFor="delete-account-password"
                >
                  Current password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={deleteAccountForm.currentPassword}
                  onChange={(event) =>
                    setDeleteAccountForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  disabled={isDeletingAccount}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-slate-950"
                  htmlFor="delete-account-phrase"
                >
                  Type DELETE MY ACCOUNT to confirm
                </label>
                <input
                  id="delete-account-phrase"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={deleteAccountForm.confirmationPhrase}
                  onChange={(event) =>
                    setDeleteAccountForm((current) => ({
                      ...current,
                      confirmationPhrase: event.target.value,
                    }))
                  }
                  disabled={isDeletingAccount}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="DELETE MY ACCOUNT"
                  required
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  The phrase is case-sensitive. Spaces before or after it are
                  ignored.
                </p>
              </div>

              {deleteAccountError ? (
                <p
                  role="alert"
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {deleteAccountError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteAccountModal}
                  disabled={isDeletingAccount}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canDeleteAccount}
                  className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none"
                >
                  {isDeletingAccount
                    ? "Deleting account..."
                    : "Delete my account permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

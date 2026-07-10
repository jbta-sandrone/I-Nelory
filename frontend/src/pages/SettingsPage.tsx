import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import FeedbackDialog, { type FeedbackState } from "../components/FeedbackDialog";
import {
  useAppearance,
  type ThemePreference,
} from "../context/AppearanceContext";
import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  changeUsername,
  getStoredAuthToken,
  requestChangeEmail,
  saveAuthUser,
} from "../services/auth";

type ToggleKey =
  | "memoryReminders"
  | "onThisDay"
  | "emailNotifications"
  | "featureUpdates"
  | "privateProfile"
  | "hideArchived"
  | "confirmDelete"
  | "aiSearchPermission"
  | "twoFactor";

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

const storageItems = [
  { label: "Photos", value: "3.2 GB", width: "w-[48%]" },
  { label: "Videos", value: "2.1 GB", width: "w-[32%]" },
  { label: "Stories", value: "680 MB", width: "w-[12%]" },
  { label: "Archived", value: "420 MB", width: "w-[8%]" },
];

const sessions = [
  { device: "Windows laptop", location: "Manila, PH", active: "Active now" },
  { device: "Mobile browser", location: "Quezon City, PH", active: "2 days ago" },
];

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
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition duration-300 ${
        checked ? "bg-emerald-600" : "bg-slate-200"
      }`}
    >
      <motion.span
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{ left: checked ? 24 : 4 }}
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
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 transition duration-300 hover:bg-white hover:shadow-md hover:shadow-slate-950/5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onToggle} label={title} />
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
  const { user: authUser, setUser } = useAuth();
  const {
    themePreference,
    setThemePreference,
    compactMode,
    setCompactMode,
  } = useAppearance();
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
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    memoryReminders: true,
    onThisDay: true,
    emailNotifications: false,
    featureUpdates: true,
    privateProfile: true,
    hideArchived: true,
    confirmDelete: true,
    aiSearchPermission: true,
    twoFactor: false,
  });

  const toggleSetting = (key: ToggleKey) => {
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
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

          <div className="mt-6 space-y-3">
            <SettingRow
              title="Memory reminders"
              description="Gentle nudges to preserve new moments."
              checked={toggles.memoryReminders}
              onToggle={() => toggleSetting("memoryReminders")}
            />
            <SettingRow
              title="On this day reminders"
              description="Revisit memories from past years."
              checked={toggles.onThisDay}
              onToggle={() => toggleSetting("onThisDay")}
            />
            <SettingRow
              title="Email notifications"
              description="Receive important account updates by email."
              checked={toggles.emailNotifications}
              onToggle={() => toggleSetting("emailNotifications")}
            />
            <SettingRow
              title="New feature updates"
              description="Hear about improvements as I-Nelory grows."
              checked={toggles.featureUpdates}
              onToggle={() => toggleSetting("featureUpdates")}
            />
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
              title="Private profile"
              description="Keep your personal profile hidden from others."
              checked={toggles.privateProfile}
              onToggle={() => toggleSetting("privateProfile")}
            />
            <SettingRow
              title="Hide archived memories"
              description="Keep archived items out of main views."
              checked={toggles.hideArchived}
              onToggle={() => toggleSetting("hideArchived")}
            />
            <SettingRow
              title="Require confirmation before deleting"
              description="Show a safety prompt before permanent actions."
              checked={toggles.confirmDelete}
              onToggle={() => toggleSetting("confirmDelete")}
            />
            <SettingRow
              title="AI search permission"
              description="Allow search UI to use captions, tags, and metadata."
              checked={toggles.aiSearchPermission}
              onToggle={() => toggleSetting("aiSearchPermission")}
            />
          </div>
        </motion.section>

        {/* Security */}
        <motion.section
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className={cardClasses()}
        >
          <SectionTitle
            icon="◇"
            title="Security"
            subtitle="Review sign-in safety and active sessions."
          />

          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
              >
                Change Password
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
              >
                Logout All Devices
              </button>
            </div>

            <SettingRow
              title="Two-factor authentication"
              description="Add an extra step when signing in."
              checked={toggles.twoFactor}
              onToggle={() => toggleSetting("twoFactor")}
            />

            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Active sessions
              </p>
              <div className="mt-3 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.device}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {session.device}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.location}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {session.active}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  6.4 GB
                </p>
                <p className="mt-1 text-sm text-slate-500">of 15 GB used</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
              >
                Manage Storage
              </button>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[43%] rounded-full bg-emerald-500" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {storageItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-500">{item.value}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div
                      className={`${item.width} h-2 rounded-full bg-emerald-400`}
                    />
                  </div>
                </div>
              ))}
            </div>
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
                Export your data whenever you need it. Account deletion is a
                serious action and will require confirmation later.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/5"
            >
              Export Data
            </button>
            <button
              type="button"
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25"
            >
              Delete Account
            </button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

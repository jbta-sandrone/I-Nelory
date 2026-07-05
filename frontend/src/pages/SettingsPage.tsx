import { motion, type Variants } from "framer-motion";
import { useState } from "react";

type ToggleKey =
  | "compactMode"
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

const account = {
  fullName: "Jonel Bryan Ablog",
  email: "jonel@example.com",
  username: "@jonelmemory",
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
  const [theme, setTheme] = useState("Light");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    compactMode: false,
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
        className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-7"
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
              subtitle="Basic details for your personal memory profile."
            />
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md hover:shadow-slate-950/5"
            >
              Edit
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              ["Full name", account.fullName],
              ["Email", account.email],
              ["Username", account.username],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {value}
                </p>
              </div>
            ))}
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
                {["Light", "Dark", "System"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition duration-300 ${
                      theme === option
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Accent color
                </p>
                <p className="mt-1 text-sm text-slate-500">Emerald</p>
              </div>
              <div className="flex gap-2">
                <span className="h-8 w-8 rounded-full bg-emerald-50 ring-1 ring-emerald-100" />
                <span className="h-8 w-8 rounded-full bg-emerald-300" />
                <span className="h-8 w-8 rounded-full bg-emerald-600" />
              </div>
            </div>

            <SettingRow
              title="Compact mode"
              description="Use tighter spacing for denser memory views."
              checked={toggles.compactMode}
              onToggle={() => toggleSetting("compactMode")}
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

      {/* Danger Zone */}
      <motion.section
        variants={fadeUp}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm shadow-red-950/5 sm:p-6"
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

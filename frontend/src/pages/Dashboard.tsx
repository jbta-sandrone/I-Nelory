import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Home", icon: "⌂", to: "/dashboard" },
  { label: "Memories", icon: "◇", to: "/dashboard/memories" },
  { label: "Timeline", icon: "◷", to: "/dashboard/timeline" },
  { label: "Albums", icon: "▣", to: "/dashboard/albums" },
  { label: "Favorites", icon: "♡", to: "/dashboard/favorites" },
  { label: "Archive", icon: "◫", to: "/dashboard/archive" },
  { label: "AI Search", icon: "✦", to: "/dashboard/ai-search" },
  { label: "Profile", icon: "◌", to: "/dashboard/profile" },
  { label: "Settings", icon: "⚙", to: "/dashboard/settings" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl shadow-slate-950/10 transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-xl font-semibold tracking-tight">I-Nelory</p>
            <p className="mt-1 text-xs text-slate-500">
              Your memory space
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5 ${
                  isActive
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border border-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            Memory archive
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Dashboard v1 shell is ready. Pages come next.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>

            <div className="relative flex-1">
              <input
                type="search"
                placeholder="Search memories, albums, places..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="button"
              className="hidden rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:inline-flex"
            >
              + New Memory
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
            >
              •
            </button>

            <div className="relative">
              <button
                type="button"
                aria-label="Open profile menu"
                onClick={() => setAvatarOpen((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                IN
              </button>

              {avatarOpen ? (
                <div className="absolute right-0 mt-3 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10">
                  {["Profile", "Settings", "Logout"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

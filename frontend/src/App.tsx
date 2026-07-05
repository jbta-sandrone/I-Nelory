import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHomePlaceholder />} />
          <Route path=":section" element={<DashboardHomePlaceholder />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
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
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5"
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

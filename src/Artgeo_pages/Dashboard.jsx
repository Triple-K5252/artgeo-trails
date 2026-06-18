import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SAMPLE_VISITS = [
  { location_name: "Bomas of Kenya", category: "Cultural Heritage" },
  { location_name: "Nairobi National Museum", category: "Museum" },
  { location_name: "Nairobi National Museum", category: "Museum" },
  { location_name: "Bomas of Kenya", category: "Cultural Heritage" },
  { location_name: "Nairobi Gallery", category: "Gallery" },
  { location_name: "Bomas of Kenya", category: "Cultural Heritage" },
  { location_name: "Karura Forest", category: "Park" },
  { location_name: "Nairobi National Museum", category: "Museum" },
  { location_name: "Ngong Hills", category: "Park" },
  { location_name: "Village Market", category: "Market" },
];

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [visits, setVisits] = useState(SAMPLE_VISITS);
  const [tab, setTab] = useState("submissions"); // submissions | stats

  useEffect(() => {
    loadSubmissions();

    // Real-time subscription to new submissions
    const channel = supabase
      .channel("art_submissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "art_submissions" }, () => {
        loadSubmissions();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadSubmissions() {
    const { data } = await supabase
      .from("art_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (data) setSubmissions(data);
  }

  async function decide(id, decision) {
    await supabase
      .from("art_submissions")
      .update({ status: decision, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    // In production: trigger email via Supabase Edge Function here
    loadSubmissions();
  }

  // Stats derived from visits
  const categoryCount = visits.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  const locationCount = visits.reduce((acc, v) => {
    acc[v.location_name] = (acc[v.location_name] || 0) + 1;
    return acc;
  }, {});

  const topLocations = Object.entries(locationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1]);

  const pending = submissions.filter(s => s.status === "pending");
  const approved = submissions.filter(s => s.status === "approved");
  const rejected = submissions.filter(s => s.status === "rejected");

  const STATUS_COLORS = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total submissions", value: submissions.length },
            { label: "Pending review", value: pending.length },
            { label: "Approved", value: approved.length },
            { label: "Total visits tracked", value: visits.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {[["submissions", "Art submissions"], ["stats", "Location stats"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px ${
                tab === id
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              {id === "submissions" && pending.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: submissions */}
        {tab === "submissions" && (
          <div className="flex flex-col gap-3">
            {submissions.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">No submissions yet.</p>
            )}
            {submissions.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex gap-4">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.artwork_title}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        onError={e => e.target.style.display = "none"}
                      />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{s.artwork_title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.artist_name} · {s.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.art_type}{s.location ? ` · ${s.location}` : ""}</p>
                      {s.description && (
                        <p className="text-xs text-slate-600 mt-2 max-w-md leading-5">{s.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                    <p className="text-xs text-slate-400">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </p>
                    {s.status === "pending" && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => decide(s.id, "approved")}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(s.id, "rejected")}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: location stats */}
        {tab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top locations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Most visited locations</h2>
              <div className="flex flex-col gap-3">
                {topLocations.map(([name, count], i) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{name}</span>
                      <span className="text-slate-400">{count} visits</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-orange-500 rounded-full"
                        style={{ width: `${(count / topLocations[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Visits by category</h2>
              <div className="flex flex-col gap-3">
                {topCategories.map(([cat, count]) => {
                  const colors = {
                    "Museum": "bg-blue-100 text-blue-700",
                    "Cultural Heritage": "bg-purple-100 text-purple-700",
                    "Gallery": "bg-pink-100 text-pink-700",
                    "Park": "bg-green-100 text-green-700",
                    "Market": "bg-amber-100 text-amber-700",
                  };
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[cat] || "bg-slate-100 text-slate-600"}`}>
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-slate-400 rounded-full"
                            style={{ width: `${(count / visits.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">{count} ({Math.round((count/visits.length)*100)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
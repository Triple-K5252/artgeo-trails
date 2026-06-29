// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import EventPromotionAssistant from "../components/EventPromotionAssistant";

const STATUS_COLORS = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const CATEGORY_ICONS = {
  Museum:            "🏛️",
  Park:              "🌿",
  "Shopping Centre": "🛍️",
  "Art Gallery":     "🖼️",
  Recreation:        "🎯",
  "Sports Facility": "⚽",
  "Historical Site": "🏰",
  Restaurant:        "🍽️",
  Accommodation:     "🏨",
};

const ACTION_LABELS = {
  view_location:       { label: "Viewed a Location",    icon: "📍" },
  view_artwork:        { label: "Viewed Artwork",        icon: "🖼️" },
  contact_artist:      { label: "Contacted an Artist",  icon: "✉️" },
  route_add:           { label: "Added to Route",        icon: "🗺️" },
  navigation_started:  { label: "Started Navigation",   icon: "🧭" },
  visited:             { label: "Visited in Person",     icon: "✅" },
};

const PALETTE = ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

const EXCLUDED_CATEGORIES = ["Cultural Heritage", "Gallery", "Market"];

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState("submissions");
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [promotionState, setPromotionState] = useState({
    activeTab: "planner",
    category: "",
    experienceType: "",
    bestFor: "",
    targetAudience: "",
    suitableAge: "",
    budget: "",
    result: null,
  });

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel("dashboard_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "art_submissions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_visits" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "artist_messages" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_activity" }, loadAll)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadAll() {
    setLoading(true);
    const [subRes, visitRes, msgRes, activityRes] = await Promise.all([
      supabase.from("art_submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("location_visits").select("location_name, category, visited_at").order("visited_at", { ascending: false }),
      supabase.from("artist_messages").select("id, created_at, status").order("created_at", { ascending: false }),
      supabase.from("user_activity").select("*").order("created_at", { ascending: false }),
    ]);

    if (subRes.data)      setSubmissions(subRes.data);
    if (visitRes.data)    setVisits(visitRes.data);
    if (msgRes.data)      setMessages(msgRes.data);
    if (activityRes.data) setActivity(activityRes.data);
    setLoading(false);
  }

  async function decide(id, decision) {
    const submission = submissions.find((s) => s.id === id);
    const { error } = await supabase
      .from("art_submissions")
      .update({ status: decision, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { console.error(error); return; }

    await supabase.functions.invoke("send-artist-message", {
      body: { record: { ...submission, status: decision } },
    });

    loadAll();
  }

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const pending  = submissions.filter((s) => s.status === "pending");
  const approved = submissions.filter((s) => s.status === "approved");
  const totalArtworks = submissions.length;

  const topLocation = visits.reduce((acc, v) => {
    acc[v.location_name] = (acc[v.location_name] || 0) + 1;
    return acc;
  }, {});
  const mostVisited = Object.entries(topLocation).sort((a, b) => b[1] - a[1])[0];

  const weeklyTrend = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-KE", { weekday: "short" });
      const count = submissions.filter((s) => s.submitted_at?.slice(0, 10) === key).length;
      days.push({ day: label, submissions: count });
    }
    return days;
  }, [submissions]);

  // ── Activity-derived Stats ─────────────────────────────────────────────────
  const attractionCounts = useMemo(() => {
    const counts = activity.reduce((acc, row) => {
      if (row.attraction_name) acc[row.attraction_name] = (acc[row.attraction_name] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [activity]);

  const categoryCounts = useMemo(() => {
    const counts = activity.reduce((acc, row) => {
      if (row.category && !EXCLUDED_CATEGORIES.includes(row.category))
        acc[row.category] = (acc[row.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activity]);

  const actionCounts = useMemo(() => {
    const counts = activity.reduce((acc, row) => {
      if (row.action) acc[row.action] = (acc[row.action] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activity]);

  const totalActivity   = activity.length || 1;
  const maxAttraction   = attractionCounts[0]?.[1] || 1;
  const totalCategories = categoryCounts.reduce((s, [, c]) => s + c, 0) || 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-[#F7F4EE]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">

        {/* Welcome Header */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Welcome back</p>
          <h1 className="text-5xl font-bold text-slate-900 mt-2" style={{ fontFamily: "Playfair Display, serif" }}>
            ArtGeo Insights
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-lg">
            A live view of Nairobi's creative community, visitor activity, and cultural engagement.
          </p>
        </div>

        {/* This Week Story */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <p className="uppercase text-sm tracking-widest text-orange-600 font-semibold mb-4">This Week at ArtGeo Trails</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-5xl font-bold text-slate-900">{totalArtworks}</p>
              <p className="text-lg text-slate-600 mt-2">new artworks shared</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-green-600">{approved.length}</p>
              <p className="text-lg text-slate-600 mt-2">artworks welcomed into the collection</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-slate-900">{visits.length}</p>
              <p className="text-lg text-slate-600 mt-2">cultural visits recorded</p>
            </div>
          </div>

          {mostVisited && (
            <p className="mt-8 text-base text-slate-600">
              Most explored place this week:{" "}
              <span className="font-semibold text-slate-900 text-lg">{mostVisited[0]}</span>
            </p>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Artworks Shared",           value: totalArtworks },
            { label: "Awaiting Review",            value: pending.length, highlight: true },
            { label: "Accepted into Collection",   value: approved.length },
            { label: "Cultural Visits",            value: visits.length },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-white rounded-3xl border border-slate-100 p-8">
              <p className="text-base text-slate-500">{label}</p>
              <p className={`text-6xl font-bold mt-4 ${highlight ? "text-amber-600" : "text-slate-900"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Submissions this week</h2>
          <p className="text-base text-slate-500 mt-1">Daily activity — last 7 days</p>

          <div className="mt-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 14, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 14, padding: "12px" }} />
                <Line type="monotone" dataKey="submissions" stroke="#ea580c" strokeWidth={4} dot={{ r: 6, fill: "#ea580c" }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-2">
          {[
            ["submissions", "Artwork Review"],
            ["stats",       "Visitor Insights"],
            ["promotion",   "Promotion Assistant"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-8 py-4 text-lg font-semibold transition border-b-2 -mb-px whitespace-nowrap ${
                tab === id
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              {id === "submissions" && pending.length > 0 && (
                <span className="ml-3 bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1 rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Submissions Tab ──────────────────────────────────────────────── */}
        {tab === "submissions" && (
          <div className="space-y-8">
            {submissions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl">
                <p className="text-7xl mb-6">🎨</p>
                <h3 className="text-3xl font-semibold text-slate-700">No artworks to review yet</h3>
                <p className="text-xl text-slate-500 mt-4 max-w-md mx-auto">
                  When artists submit their work, they will appear here for your review and approval.
                </p>
              </div>
            ) : (
              submissions.map((s) => (
                <div key={s.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="flex flex-col lg:flex-row gap-8 p-8">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.artwork_title}
                        className="w-full lg:w-80 h-80 object-cover rounded-3xl cursor-pointer hover:scale-105 transition"
                        onClick={() => setPreviewImage(s.image_url)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-3xl font-semibold text-slate-900 leading-tight">{s.artwork_title}</h3>
                          <p className="text-2xl text-slate-600 mt-2">by {s.artist_name}</p>
                        </div>
                        <span className={`text-base font-semibold px-6 py-3 rounded-2xl border ${STATUS_COLORS[s.status]}`}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-lg text-slate-600 mt-8 leading-relaxed">
                        {s.description || "No description provided by the artist."}
                      </p>

                      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-base text-slate-500">
                        <span>{s.art_type}</span>
                        {s.location && <span>• {s.location}</span>}
                        <span>• Submitted {new Date(s.submitted_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>

                      {s.status === "pending" && (
                        <div className="mt-10 flex gap-4">
                          <button
                            onClick={() => decide(s.id, "approved")}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-3xl text-xl font-semibold transition"
                          >
                            ✅ Approve & Publish
                          </button>
                          <button
                            onClick={() => decide(s.id, "rejected")}
                            className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 py-5 rounded-3xl text-xl font-semibold transition"
                          >
                            Reject Submission
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Visitor Insights Tab ─────────────────────────────────────────── */}
        {tab === "stats" && (
          <div className="flex flex-col gap-6">

            {/* Places People Love Most */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Playfair Display, serif" }}>
                Places people love most
              </h2>
              <p className="text-slate-400 mt-1 mb-6 text-sm">Where Nairobi's visitors keep coming back to</p>

              {attractionCounts.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No visits recorded yet</p>
              ) : (
                <ul className="space-y-4">
                  {attractionCounts.map(([name, count], i) => (
                    <li key={name} className="flex items-center gap-4">
                      <span className="text-xl w-7 shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-slate-300 text-sm font-bold">{i + 1}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800 truncate">{name}</span>
                          <span className="text-sm text-orange-500 font-semibold ml-3 shrink-0">{count} visits</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div
                            className="h-1.5 bg-orange-400 rounded-full"
                            style={{ width: `${(count / maxAttraction) * 100}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* How Visitors Explore Nairobi */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Playfair Display, serif" }}>
                How visitors explore Nairobi
              </h2>
              <p className="text-slate-400 mt-1 mb-6 text-sm">The kinds of places drawing the most interest</p>

              {categoryCounts.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No data yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {categoryCounts.map(([cat, count]) => (
                    <div key={cat} className="flex flex-col gap-1 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
                      <p className="text-sm font-semibold text-slate-500">{cat}</p>
                      <p className="text-3xl font-bold text-orange-600">{count}</p>
                      <p className="text-xs text-slate-400">
                        {((count / totalCategories) * 100).toFixed(0)}% of all visits
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What Visitors Are Doing */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Playfair Display, serif" }}>
                What visitors are doing
              </h2>
              <p className="text-slate-400 mt-1 mb-6 text-sm">A snapshot of how people interact with the platform</p>

              {actionCounts.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No actions recorded yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {actionCounts.map(([action, count]) => {
                    const meta = ACTION_LABELS[action] || { label: action, icon: "⚡" };
                    return (
                      <div key={action} className="bg-slate-50 rounded-2xl px-4 py-4 flex items-center gap-3">
                        <span className="text-2xl shrink-0">{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-slate-900">{count}</p>
                          <p className="text-xs text-slate-400 truncate">{meta.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Promotion Tab ────────────────────────────────────────────────── */}
        {tab === "promotion" && (
          <EventPromotionAssistant
            promotionState={promotionState}
            setPromotionState={setPromotionState}
          />
        )}

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-3xl shadow-2xl" />
          </div>
        )}

      </div>
    </div>
  );
}

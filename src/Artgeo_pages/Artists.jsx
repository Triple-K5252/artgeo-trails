import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const STATIC_ARTISTS = [
  {
    id: 1,
    name: "Wanjiku Kamau",
    medium: "Oil Painting",
    tags: ["Portraits", "Nairobi life"],
    works: 24,
    rating: "4.8",
    location: "Westlands",
    color: "bg-teal-100 text-teal-700",
    initials: "WK",
    bio: "Nairobi-based painter capturing everyday city scenes with vibrant, expressive strokes.",
    image_url: null,
  },
  {
    id: 2,
    name: "James Odhiambo",
    medium: "Sculpture",
    tags: ["Bronze", "Abstract"],
    works: 15,
    rating: "4.6",
    location: "Karen",
    color: "bg-blue-100 text-blue-700",
    initials: "JO",
    bio: "Award-winning sculptor working in bronze and reclaimed metal. Exhibitions across East Africa.",
    image_url: null,
  },
  {
    id: 3,
    name: "Aisha Mohamed",
    medium: "Textile Art",
    tags: ["Weaving", "Cultural"],
    works: 31,
    rating: "4.7",
    location: "Eastleigh",
    color: "bg-pink-100 text-pink-700",
    initials: "AM",
    bio: "Traditional weaving techniques fused with contemporary design. Available for commissions.",
    image_url: null,
  },
  {
    id: 4,
    name: "Peter Njoroge",
    medium: "Photography",
    tags: ["Urban", "Wildlife"],
    works: 88,
    rating: "4.9",
    location: "Nairobi CBD",
    color: "bg-amber-100 text-amber-700",
    initials: "PN",
    bio: "Documentary photographer covering Nairobi's urban transformation and wildlife at the city edge.",
    image_url: null,
  },
  {
    id: 5,
    name: "Grace Wambua",
    medium: "Glass Art",
    tags: ["Recycled", "Mosaics"],
    works: 19,
    rating: "4.9",
    location: "Kitengela",
    color: "bg-purple-100 text-purple-700",
    initials: "GW",
    bio: "Creates glass sculptures and mosaics from recycled materials at the Kitengela Glass studio.",
    image_url: null,
  },
  {
    id: 6,
    name: "David Otieno",
    medium: "Digital Art",
    tags: ["GIS", "Mapping"],
    works: 42,
    rating: "4.5",
    location: "Kilimani",
    color: "bg-orange-100 text-orange-700",
    initials: "DO",
    bio: "Digital artist blending GIS data visualisation with creative cartography and urban storytelling.",
    image_url: null,
  },
  {
    id: 7,
    name: "Njeri Waweru",
    medium: "Ceramics",
    tags: ["Pottery", "Functional"],
    works: 56,
    rating: "4.7",
    location: "Lavington",
    color: "bg-red-100 text-red-700",
    initials: "NW",
    bio: "Hand-thrown ceramics inspired by Kikuyu traditional patterns. Sold locally and internationally.",
    image_url: null,
  },
  {
    id: 8,
    name: "Kofi Asante",
    medium: "Mural & Street Art",
    tags: ["Public Art", "Pan-African"],
    works: 33,
    rating: "4.8",
    location: "Mathare",
    color: "bg-green-100 text-green-700",
    initials: "KA",
    bio: "Large-scale muralist transforming Nairobi walls into pan-African storytelling canvases.",
    image_url: null,
  },
  {
    id: 9,
    name: "Fatuma Abdullahi",
    medium: "Beadwork & Jewelry",
    tags: ["Maasai", "Wearable Art"],
    works: 127,
    rating: "4.6",
    location: "Ngong",
    color: "bg-sky-100 text-sky-700",
    initials: "FA",
    bio: "Master beadworker producing contemporary jewelry rooted in Maasai tradition and symbolism.",
    image_url: null,
  },
];

const COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
  "bg-green-100 text-green-700",
  "bg-sky-100 text-sky-700",
];

function toInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Artists({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [activeMedium, setActiveMedium] = useState("All");
  const [selected, setSelected] = useState(null);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("art_submissions")
          .select("*")
          .eq("status", "approved")
          .order("reviewed_at", { ascending: false });

        if (error) {
          console.warn("art_submissions error:", error.message);
          return;
        }
        if (data) setApprovedSubmissions(data);
      } catch (e) {
        console.warn("Supabase fetch failed:", e);
      }
    }

    load();

    let channel;
    try {
      channel = supabase
        .channel("approved_art")
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "art_submissions",
        }, () => load())
        .subscribe();
    } catch (e) {
      console.warn("Realtime failed:", e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const submittedArtists = approvedSubmissions.map((s, i) => ({
    id: `sub-${s.id}`,
    name: s.artist_name,
    medium: s.art_type,
    tags: s.art_type ? [s.art_type] : ["Artwork"],
    works: 1,
    rating: "New",
    location: s.location || "Nairobi",
    color: COLORS[i % COLORS.length],
    initials: toInitials(s.artist_name),
    bio: s.description || "No description provided.",
    image_url: s.image_url || null,
    isSubmission: true,
  }));

  const ALL_ARTISTS = [...STATIC_ARTISTS, ...submittedArtists];
  const mediums = [...new Set(ALL_ARTISTS.map((a) => a.medium))];

  const filtered = ALL_ARTISTS.filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      a.medium.toLowerCase().includes(search.toLowerCase());
    const matchMedium =
      activeMedium === "All" || a.medium === activeMedium;
    return matchSearch && matchMedium;
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600 mb-1">
              Marketplace
            </p>
            <h1 className="text-2xl font-bold text-slate-950">Artists</h1>
            <p className="mt-1 text-sm text-slate-500">
              Discover and connect with Nairobi's creative community.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("submit")}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 transition whitespace-nowrap"
              >
                + Submit your art
              </button>
            )}
            <input
              type="search"
              placeholder="Search artists, tags, medium…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 w-full md:w-60 text-slate-700"
            />
          </div>
        </div>

        {/* Medium filter */}
        <div className="flex flex-wrap gap-2">
          {["All", ...mediums].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMedium(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeMedium === m
                  ? "bg-orange-600 text-white border-orange-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Artist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artist) => (
            <div
              key={artist.id}
              onClick={() =>
                setSelected(selected?.id === artist.id ? null : artist)
              }
              className={`bg-white rounded-xl border cursor-pointer transition p-5 ${
                selected?.id === artist.id
                  ? "border-orange-400 ring-2 ring-orange-100"
                  : "border-slate-200 hover:border-orange-200"
              }`}
            >
              {/* Artwork image for approved submissions */}
              {artist.image_url && (
                <img
                  src={artist.image_url}
                  alt={`${artist.name}'s artwork`}
                  className="w-full h-36 object-cover rounded-lg mb-3 border border-slate-100"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}

              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${artist.color}`}
                >
                  {artist.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {artist.name}
                    </p>
                    {artist.isSubmission && (
                      <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{artist.medium}</p>
                </div>
              </div>

              {/* Bio expanded */}
              {selected?.id === artist.id && (
                <p className="text-xs text-slate-600 leading-5 mb-3 bg-slate-50 rounded-lg p-3">
                  {artist.bio}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {artist.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{artist.works} {artist.works === 1 ? "work" : "works"}</span>
                  <span>📍 {artist.location}</span>
                </div>
                <span className="text-xs font-semibold text-amber-600">
                  ★ {artist.rating}
                </span>
              </div>

              {/* Contact button expanded */}
              {selected?.id === artist.id && (
                <button
                  type="button"
                  className="mt-3 w-full rounded-md bg-orange-600 hover:bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition"
                >
                  Contact artist
                </button>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">
            No artists match your search.
          </p>
        )}
      </div>
    </div>
  );
}
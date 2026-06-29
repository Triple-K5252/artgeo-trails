// src/pages/Artists.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
  const [previewImage, setPreviewImage] = useState(null);
  const [contactArtist, setContactArtist] = useState(null);
  const [messageForm, setMessageForm] = useState({
    sender_name: "",
    sender_email: "",
    message: "",
  });

  // Load approved submissions from Supabase
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

    const channel = supabase
      .channel("approved_art")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "art_submissions" },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function sendMessage() {
    if (!messageForm.sender_name || !messageForm.sender_email || !messageForm.message) {
      alert("Please complete all fields.");
      return;
    }

    const { error } = await supabase.from("artist_messages").insert({
      artist_email: contactArtist.email,
      sender_name: messageForm.sender_name,
      sender_email: messageForm.sender_email,
      message: messageForm.message,
    });

    if (error) {
      console.error(error);
      alert("Failed to send message.");
      return;
    }

    // Optional email notification
    await supabase.functions.invoke("send-artist-message", {
      body: {
        artist_email: contactArtist.email,
        sender_name: messageForm.sender_name,
        sender_email: messageForm.sender_email,
        message: messageForm.message,
      },
    });

    alert("Message sent successfully! The artist will get back to you soon.");
    setContactArtist(null);
    setMessageForm({ sender_name: "", sender_email: "", message: "" });
  }

  // Map Supabase submissions to display format
  const ALL_ARTISTS = approvedSubmissions.map((s, i) => ({
    id: `sub-${s.id}`,
    artworkTitle: s.artwork_title || "Untitled Artwork",
    artistName: s.artist_name,
    email: s.email,
    medium: s.art_type,
    tags: s.art_type ? [s.art_type] : ["Artwork"],
    works: 1,
    rating: "New",
    location: s.location || "Nairobi",
    has_public_studio: s.has_public_studio,
    studio_name: s.studio_name,
    studio_address: s.studio_address,
    price: s.price,
    bio: s.description || "No description provided yet.",
    image_url: s.image_url,
    isSubmission: true,
  }));

  const mediums = [...new Set(ALL_ARTISTS.map((a) => a.medium))];

  const filtered = ALL_ARTISTS.filter((a) => {
    const matchSearch =
      !search ||
      a.artworkTitle.toLowerCase().includes(search.toLowerCase()) ||
      a.artistName.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchMedium = activeMedium === "All" || a.medium === activeMedium;
    return matchSearch && matchMedium;
  });

  return (
    <div className="h-full overflow-y-auto bg-[#F7F4EE]">
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.5px] text-orange-600 mb-1">Marketplace</p>
            <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "Playfair Display, serif" }}>
              Art Marketplace
            </h1>
            <p className="mt-3 text-base text-slate-600 max-w-md">
              Discover unique, original artworks by talented Kenyan artists — all carefully reviewed and approved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate("submit")}
                className="px-6 py-3 rounded-2xl border border-orange-300 text-orange-700 hover:bg-orange-50 font-medium transition whitespace-nowrap"
              >
                + Submit Your Artwork
              </button>
            )}
            <input
              type="search"
              placeholder="Search artworks, artists, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm focus:border-orange-400 outline-none w-full sm:w-72"
            />
          </div>
        </div>

        {/* Medium Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["All", ...mediums].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMedium(m)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                activeMedium === m
                  ? "bg-orange-600 text-white border-orange-600"
                  : "border-slate-200 bg-white hover:border-orange-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Artwork Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelected(selected?.id === art.id ? null : art)}
              className={`bg-white rounded-3xl border overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                selected?.id === art.id ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200 hover:border-orange-200"
              }`}
            >
              {/* Artwork Image */}
              {art.image_url ? (
                <img
                  src={art.image_url}
                  alt={art.artworkTitle}
                  className="w-full h-64 object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(art.image_url);
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400">No image yet</span>
                </div>
              )}

              <div className="p-5">
                {/* Title & Price */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg leading-tight text-slate-900">
                    {art.artworkTitle}
                  </h3>
                  {art.price && (
                    <p className="font-bold text-green-600 text-lg">
                      KES {Number(art.price).toLocaleString()}
                    </p>
                  )}
                </div>

                <p className="text-slate-600 text-sm mb-3">by {art.artistName}</p>

                {/* Bio when expanded */}
                {selected?.id === art.id && (
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4 mb-4">
                    {art.bio}
                  </p>
                )}

                {/* Tags & Location */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {art.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    📍 {art.location}
                  </span>
                </div>

                {/* Contact & Studio */}
                {selected?.id === art.id && (
                  <div className="space-y-3 pt-4 border-t">
                    <button
                      onClick={() => setContactArtist(art)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-medium transition"
                    >
                      📧 Message the Artist
                    </button>

                    {art.has_public_studio && (
                      <button
                        onClick={() => alert(`${art.studio_name}\n${art.studio_address}`)}
                        className="w-full border border-orange-300 text-orange-700 hover:bg-orange-50 py-3 rounded-2xl font-medium transition"
                      >
                        📍 Visit Studio
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mb-6">
              🎨
            </div>
            <h3 className="text-2xl font-semibold text-slate-700">No artworks yet</h3>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              We’re working hard to bring beautiful Kenyan art to this marketplace. 
              Be the first to share your work!
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate("submit")}
                className="mt-8 px-8 py-3 bg-orange-600 text-white rounded-2xl font-medium hover:bg-orange-700 transition"
              >
                Submit Your Artwork
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Artwork Preview"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Contact Modal */}
      {contactArtist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-6">Message {contactArtist.artistName}</h3>

            <input
              type="text"
              placeholder="Your full name"
              value={messageForm.sender_name}
              onChange={(e) => setMessageForm({ ...messageForm, sender_name: e.target.value })}
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            />

            <input
              type="email"
              placeholder="Your email address"
              value={messageForm.sender_email}
              onChange={(e) => setMessageForm({ ...messageForm, sender_email: e.target.value })}
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            />

            <textarea
              rows={5}
              placeholder="Tell the artist about your interest..."
              value={messageForm.message}
              onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              className="w-full border rounded-3xl px-4 py-3 mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setContactArtist(null)}
                className="flex-1 py-3 border rounded-2xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-medium hover:bg-orange-700"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
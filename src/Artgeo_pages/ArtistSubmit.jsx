import { useState } from "react";
import { supabase } from "../lib/supabase";

const ART_TYPES = [
  "Oil Painting", "Sculpture", "Textile Art", "Photography",
  "Glass Art", "Digital Art", "Ceramics", "Mural & Street Art",
  "Beadwork & Jewelry", "Watercolor", "Mixed Media", "Other"
];

export default function ArtistSubmit() {
  const [form, setForm] = useState({
    artist_name: "",
    email: "",
    artwork_title: "",
    art_type: "",
    price: "",
    description: "",
    location: "",
    image_url: "",

    has_public_studio: false,
    studio_name: "",
    studio_address: "",
  });

  const [status, setStatus] = useState(null); // null | "sending" | "done" | "error"
  const [uploading, setUploading] = useState(false);

  function update(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  // Uploads an image file to Supabase Storage and stores the public URL
  async function uploadImage(file) {
    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("artworks")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("artworks")
        .getPublicUrl(fileName);

      update("image_url", data.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (
      !form.artist_name ||
      !form.email ||
      !form.artwork_title ||
      !form.art_type ||
      !form.image_url
    ) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    setStatus("sending");

    const { error } = await supabase.from("art_submissions").insert({
      ...form,
      status: "pending",
    });

    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md p-6 sm:p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Submission received!</h2>
          <p className="text-slate-500 text-sm">
            Your artwork has been submitted for review. We'll email you at <strong>{form.email}</strong> once a decision is made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
            Artists
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Submit your artwork</h1>
          <p className="text-sm text-slate-500 mt-1">
            Approved submissions appear in the ArtGeo marketplace.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 flex flex-col gap-4">
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Artist name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={form.artist_name}
                onChange={(e) => update("artist_name", e.target.value)}
                placeholder="Your full name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Email <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Title + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Artwork title <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={form.artwork_title}
                onChange={(e) => update("artwork_title", e.target.value)}
                placeholder="Name of the piece"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Art type <span className="text-orange-500">*</span>
              </label>
              <select
                value={form.art_type}
                onChange={(e) => update("art_type", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">Select type…</option>
                {ART_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Price (KES)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="e.g. 15000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Location / neighbourhood
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Public studio */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">
              Do you have a public studio or gallery?
            </label>

            <select
              value={form.has_public_studio ? "yes" : "no"}
              onChange={(e) => update("has_public_studio", e.target.value === "yes")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {form.has_public_studio && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Studio Name
                </label>
                <input
                  type="text"
                  value={form.studio_name}
                  onChange={(e) => update("studio_name", e.target.value)}
                  placeholder="e.g. Kamande Art Studio"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Studio Address
                </label>
                <input
                  type="text"
                  value={form.studio_address}
                  onChange={(e) => update("studio_address", e.target.value)}
                  placeholder="e.g. Westlands, Nairobi"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Artwork image upload */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Artwork Image <span className="text-orange-500">*</span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />

            {uploading && (
              <p className="text-xs text-orange-600 mt-2">Uploading image...</p>
            )}

            {form.image_url && (
              <img
                src={form.image_url}
                alt="preview"
                className="mt-3 h-40 w-full object-cover rounded-lg border border-slate-200"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="Tell us about your artwork and your practice…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}

          <button
            onClick={submit}
            disabled={status === "sending" || uploading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
          >
            {uploading
              ? "Uploading image..."
              : status === "sending"
              ? "Submitting..."
              : "Submit artwork"}
          </button>
        </div>
      </div>
    </div>
  );
}
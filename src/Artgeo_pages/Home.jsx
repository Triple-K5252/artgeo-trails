const highlights = [
  { label: "Attractions", value: "45" },
  { label: "Categories", value: "9" },
  { label: "GIS Platform", value: "ArcGIS" },
];

const features = [
  {
    num: "01",
    text: "Explore Nairobi's cultural attractions through an interactive GIS map.",
  },
  {
    num: "02",
    text: "Filter locations by museums, galleries, heritage sites, parks, and recreation areas.",
  },
  {
    num: "03",
    text: "View detailed information including descriptions, opening hours, contact details, and visitor information.",
  },
]
;

export default function Home({ onNavigate }) {
  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Hero */}
      <section className="bg-slate-950 text-white px-8 py-14 lg:px-14 flex flex-col gap-4">
           <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
  Nairobi culture map
</p>

<h1 className="max-w-2xl text-4xl md:text-5xl font-bold leading-tight">
  Discover Nairobi through art, heritage, and public spaces.
</h1>

<p className="max-w-xl text-base leading-7 text-slate-300">
  ArtGeo Trails is a GIS-powered platform that connects visitors with Nairobi's cultural attractions, public spaces, artists, galleries, and creative markets through interactive maps and location-based exploration.
</p>
        <div className="flex flex-wrap gap-3 mt-2">
          <button
            type="button"
            onClick={() => onNavigate("explore")}
            className="rounded-md bg-orange-600 hover:bg-orange-700 px-5 py-3 text-sm font-semibold text-white transition"
          >
            Explore Map
          </button>
          <button
            type="button"
            onClick={() => onNavigate("artists")}
            className="rounded-md border border-white/25 hover:bg-white/10 px-5 py-3 text-sm font-semibold text-white transition"
          >
            View Artists
          </button>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
        {highlights.map((item, i) => (
          <div
            key={item.label}
            className={`px-8 py-6 ${
              i < highlights.length - 1 ? "border-b md:border-b-0 md:border-r border-slate-200" : ""
            }`}
          >
            <p className="text-3xl font-bold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-5 px-8 py-10 lg:grid-cols-3 lg:px-14">
        {features.map((f) => (
          <div
            key={f.num}
            className="rounded-lg border border-slate-200 bg-slate-50 p-5"
          >
            <p className="mb-3 text-sm font-bold text-orange-600">{f.num}</p>
            <p className="text-base font-semibold leading-7 text-slate-800">
              {f.text}
            </p>
          </div>
        ))}
      </section>

      {/* CTA band */}
      <section className="mx-8 mb-10 lg:mx-14 rounded-lg bg-slate-950 px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>

        <p className="text-base font-semibold text-white">
  Start Exploring Nairobi County.
</p>

<p className="text-sm text-slate-400 mt-1">
  Discover cultural landmarks, heritage sites, museums, galleries,
  and public spaces across Nairobi County through an interactive GIS experience.
</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("route")}
          className="flex-shrink-0 rounded-md bg-orange-600 hover:bg-orange-700 px-5 py-3 text-sm font-semibold text-white transition"
        >
          Plan a Route →
        </button>
      </section>
    </div>
  );
}
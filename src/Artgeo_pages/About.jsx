const objectives = [
  "Promote tourism attractions through interactive GIS mapping.",
  "Provide artists with a digital platform to increase visibility and market access.",
  "Improve tourist navigation through route planning and location services.",
  "Support tourism planning and decision-making through spatial analytics and dashboards.",
];

const features = [
  {
    icon: "🗺️",
    title: "Interactive tourism map",
    desc: "Promotes Nairobi County's attractions through ArcGIS-powered interactive mapping and location-based services.",
  },
  {
    icon: "🎨",
    title: "Digital marketplace for artists",
    desc: "Provides local artists with a platform to showcase work, increase visibility, and reach wider audiences.",
  },
  {
    icon: "🧭",
    title: "Smart route planning",
    desc: "Enables tourists to navigate attractions using ArcGIS routing services with turn-by-turn directions.",
  },
  {
    icon: "📊",
    title: "Spatial analytics dashboard",
    desc: "Supports tourism planning and decision-making through ArcGIS Dashboards and spatial data reporting.",
  },
];

const beneficiaries = [
  {
    group: "Artists",
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    values: ["Increased exposure", "Promotion of artworks", "Access to wider audiences"],
    tools: ["Art & Gallery Hub", "Artist Profiles", "Events & Exhibitions Module"],
  },
  {
    group: "Tourists",
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    values: ["Attraction discovery", "Route planning", "Tourism information"],
    tools: ["Interactive Map", "Search & Filter", "Route Planner"],
  },
  {
    group: "Businesses",
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    values: ["Increased visibility", "More customers", "Tourism promotion"],
    tools: ["Business Listings", "Attraction Integration", "Event Promotion"],
  },
  {
    group: "Tourism Authorities",
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    values: ["Data-driven planning", "Tourism monitoring", "Visitor trend analysis"],
    tools: ["ArcGIS Dashboard", "Spatial Analytics", "Reporting Tools"],
  },
];

const techStack = [
  { group: "ArcGIS Pro", items: ["Data preparation", "Spatial analysis", "Symbology", "Publishing services"] },
  { group: "ArcGIS Online", items: ["Web maps", "Hosted feature layers", "Cloud GIS services"] },
  { group: "Maps SDK for JS", items: ["Interactive maps", "Search & filtering", "Routing services", "Pop-ups"] },
  { group: "ArcGIS Dashboards", items: ["Analytics", "Monitoring", "Reporting"] },
  { group: "StoryMaps", items: ["Tourism storytelling", "Cultural narratives"] },
  { group: "Survey123", items: ["Data collection", "Visitor feedback", "Artist registration"] },
];

export default function About({ onNavigate }) {
  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="px-6 py-6 max-w-5xl mx-auto flex flex-col gap-8">

        {/* Hero */}
        <div className="bg-slate-950 rounded-xl px-8 py-10 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300 mb-2">
            ArtGeo Trails
          </p>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            GIS-powered art &amp; tourism platform
          </h1>
          <p className="text-base leading-7 text-slate-300 max-w-2xl">
            A GIS-powered web platform that integrates tourism attractions, artists, galleries,
            cultural events, and route planning into a single interactive system for Nairobi County.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("explore")}
                  className="rounded-md bg-orange-600 hover:bg-orange-700 px-5 py-2.5 text-sm font-semibold text-white transition"
                >
                  Explore the map
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("dashboard")}
                  className="rounded-md border border-white/20 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition"
                >
                  View dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Objectives */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 mb-4">Specific objectives</h2>
          <div className="flex flex-col gap-3">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 px-5 py-4">
                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{obj}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core features */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 mb-4">Solution components</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <p className="text-sm font-bold text-slate-900 mb-2">{f.title}</p>
                <p className="text-sm leading-6 text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiaries */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 mb-4">Beneficiaries &amp; value</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beneficiaries.map((b) => (
              <div key={b.group} className={`rounded-xl border p-5 ${b.color}`}>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${b.badge}`}>
                  {b.group}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Value
                    </p>
                    {b.values.map((v) => (
                      <p key={v} className="text-xs text-slate-600 leading-5">• {v}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Tools
                    </p>
                    {b.tools.map((t) => (
                      <p key={t} className="text-xs text-slate-600 leading-5">• {t}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 mb-4">ArcGIS capabilities used</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {techStack.map((t) => (
              <div key={t.group} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-orange-600 mb-2">{t.group}</p>
                {t.items.map((item) => (
                  <p key={item} className="text-xs text-slate-500 leading-5">• {item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <div className="text-center text-xs text-slate-400 pb-4">
          ArtGeo Trails · Nairobi County · Built with ArcGIS &amp; React
        </div>

      </div>
    </div>
  );
}
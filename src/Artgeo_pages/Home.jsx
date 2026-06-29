
const highlights = [
  { value: "45", label: "Attractions" },
  { value: "9", label: "Categories" },
  { value: "ArcGIS", label: "GIS Platform" },
];

export default function Home({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-900 overflow-y-auto">

      {/* HERO */}
      <section className="px-6 py-10 lg:px-14">
        <div className="max-w-7xl mx-auto bg-[#FBF9F4] border border-stone-300 rounded-[28px] p-6 lg:p-10">

          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* LEFT */}
            <div>
              <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#C96A3D] mb-5">
                Nairobi Culture Map
              </p>

              <h1
                className="text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-semibold"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Discover Nairobi Through
                <span className="italic text-[#C96A3D]"> Art</span>,
                <br />
                Culture &
                <span className="italic text-[#C96A3D]"> Location</span>
              </h1>

              <p className="mt-6 max-w-xl text-slate-600 leading-8 text-lg">
                Explore galleries, museums, heritage landmarks, public
                spaces and creative experiences across Nairobi through
                interactive mapping and location intelligence.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <button
                  onClick={() => onNavigate("explore")}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition"
                >
                  Explore the Map
                </button>

                <button
                  onClick={() => onNavigate("route")}
                  className="px-6 py-3 border border-slate-300 rounded-full hover:bg-white transition"
                >
                  Plan a Trail
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-stone-300">
                {highlights.map((item) => (
                  <div key={item.label}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <img
                src="Nairobi_county.webp"
                alt="Nairobi"
                className="w-full h-[520px] object-cover rounded-3xl"
              />

              
            </div>
          </div>
        </div>
      </section>

      {/* CULTURAL LANDSCAPE */}
      <section className="px-6 lg:px-14 py-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 items-center">

          <img
            src="Nairobi_county.webp"
            alt=""
            className="rounded-3xl h-[340px] w-full object-cover"
          />

          <div>
            <p className="uppercase text-xs tracking-[0.2em] text-slate-400 mb-4">
              About ArtGeo Trails
            </p>

            <h2
              className="text-4xl leading-tight mb-5"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Explore Nairobi's
              <br />
              Cultural Landscape
            </h2>

            <p className="text-slate-600 leading-8">
              ArtGeo Trails connects cultural attractions,
              artists, heritage sites and tourism experiences
              through geography. Every destination is part of
              a larger story waiting to be explored.
            </p>
          </div>

          <img
            src="Nairobi county.webp"
            alt=""
            className="rounded-3xl h-[420px] w-full object-cover"
          />
        </div>
      </section>

      {/* WHY ARTGEO */}
      <section className="px-6 lg:px-14 py-12">
        <div className="max-w-7xl mx-auto">

          <h2
            className="text-4xl mb-10"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Why ArtGeo Trails?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="font-semibold text-xl mb-3">Discover</h3>
              <p className="text-slate-600">
                Find museums, galleries, heritage landmarks,
                parks and cultural spaces across Nairobi.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Navigate</h3>
              <p className="text-slate-600">
                Build optimized trails and explore attractions
                through smart route planning.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Connect</h3>
              <p className="text-slate-600">
                Engage with artists, cultural institutions and
                creative communities.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* GIS SECTION */}
      <section className="px-6 lg:px-14 py-12">
        <div className="max-w-7xl mx-auto bg-white border border-stone-200 rounded-3xl p-8">

          <p className="uppercase text-xs tracking-[0.2em] text-slate-400 mb-3">
            Location Intelligence
          </p>

          <h2
            className="text-4xl mb-8"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Powered by GIS Technology
          </h2>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="border rounded-2xl p-5">
              <h3 className="font-semibold mb-2">
                Interactive Mapping
              </h3>
            </div>

            <div className="border rounded-2xl p-5">
              <h3 className="font-semibold mb-2">
                Route Planning
              </h3>
            </div>

            <div className="border rounded-2xl p-5">
              <h3 className="font-semibold mb-2">
                Spatial Analysis
              </h3>
            </div>

            <div className="border rounded-2xl p-5">
              <h3 className="font-semibold mb-2">
                Tourism Insights
              </h3>
            </div>

          </div>
        </div>
      </section>

      {/* ARTISTS */}
      <section className="px-6 lg:px-14 py-12">
        <div className="max-w-7xl mx-auto">

          <h2
            className="text-4xl mb-10"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Meet Nairobi's Creative Community
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-stone-200 rounded-3xl overflow-hidden"
              >
                <div className="h-64 bg-stone-200" />

                <div className="p-5">
                  <h3 className="font-semibold">
                    Featured Artist
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Artwork • Nairobi
                  </p>
                </div>
              </div>
            ))}

          </div>

          <button
            onClick={() => onNavigate("artists")}
            className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-full"
          >
            View Artists
          </button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-14 py-14">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-3xl p-10 text-center">

          <h2
            className="text-white text-5xl mb-4"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Every Place Has a Story
          </h2>

          <p className="text-slate-300 max-w-2xl mx-auto">
            Discover art, heritage and culture through one
            connected geographic experience.
          </p>

          <button
            onClick={() => onNavigate("explore")}
            className="mt-8 px-8 py-3 bg-[#C96A3D] rounded-full text-white"
          >
            Start Exploring
          </button>

        </div>
      </section>

    </div>
  );
}


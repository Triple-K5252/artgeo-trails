// src/pages/Explore.jsx
import { useState, useRef } from "react";
import ArcGISMap from "../components/MapView";
import questionBank from "../data/questionBank";

const CATEGORY_ICONS = {
  Museum: "🏛",
  "Art Gallery": "🎨",
  "Historical Site": "🏺",
  Park: "🌳",
  Restaurant: "🍽",
  "Shopping Centre": "🛍",
  "Sports Facility": "⚽",
  Accommodation: "🏨",
  Recreation: "⚡",
};

const categories = Object.keys(CATEGORY_ICONS);

const subcounties = [
  { value: "All Subcounties", label: "All Subcounties" },
  { value: "Langata Sub County", label: "Langata" },
  { value: "Dagoretti North Sub County", label: "Dagoretti North" },
  { value: "Westlands Sub County", label: "Westlands" },
  { value: "Kibra Sub County", label: "Kibra" },
  { value: "Starehe Sub County", label: "Starehe" },
  { value: "Embakasi South Sub County", label: "Embakasi South" },
  { value: "Kamukunji Sub County", label: "Kamukunji" },
  { value: "Kasarani Sub County", label: "Kasarani" },
  { value: "Makadara Sub County", label: "Makadara" },
  { value: "Roysambu Sub County", label: "Roysambu" },
];

const audienceOptions = [
  { label: "Travelling Solo", value: "Solo Travelers", icon: "🧍" },
  { label: "With Family", value: "Families", icon: "👨‍👩‍👧‍👦" },
  { label: "With Partner / Couple", value: "Couples", icon: "👫" },
  { label: "With Friends / Youth Group", value: "Youth", icon: "👥" },
  { label: "Senior Traveller", value: "Senior Travelers", icon: "🧓" },
  { label: "Remote Worker / Bleisure", value: "Remote Workers", icon: "💻" },
];

// ─── Scoring engine ───────────────────────────────────────────────────────────
function scoreAttraction(attrs, selectedCategory, selectedInterest, bankEntry, selectedAudience) {
  let score = 0;
  const norm = (val) => (val ?? "").toLowerCase();
  const interest = norm(selectedInterest);
  const audience = norm(selectedAudience);

  // Category exact match — highest weight
  if (norm(attrs.Final_Category) === norm(selectedCategory)) score += 20;

  // Audience match — second most important
  if (norm(attrs.Target_Audience).includes(audience)) score += 15;

  // Primary field match (Best_For, Experience_Type, Art_Focus, Main_Attraction)
  if (norm(attrs[bankEntry.field]).includes(interest)) score += 12;

  // Secondary field match
  if (norm(attrs[bankEntry.secondaryField]).includes(interest)) score += 6;

  // Main & Secondary attraction bonus
  if (norm(attrs.Main_Attraction).includes(interest)) score += 5;
  if (norm(attrs.Secondary_Attraction).includes(interest)) score += 3;

  // Photography bonus
  if (interest.includes("photo")) {
    const ps = norm(attrs.Photography_Score);
    if (ps === "very high") score += 5;
    else if (ps === "high") score += 3;
    else if (ps === "medium") score += 1;
  }

  return score;
}

// ─── Step 0: Who are you travelling with? ────────────────────────────────────
function StepAudience({ onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 leading-relaxed">
        Who are you exploring Nairobi with?
      </p>
      <div className="grid grid-cols-1 gap-2">
        {audienceOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value, opt.label)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition"
          >
            <span className="text-lg">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Category ─────────────────────────────────────────────────────────
function StepCategory({ audienceLabel, onSelect, onBack }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600"
      >
        ← Back
      </button>
      <p className="text-sm text-slate-500 leading-relaxed">
        What type of attraction are you interested in,{" "}
        <span className="font-semibold text-slate-700">{audienceLabel}</span>?
      </p>
      <div className="grid grid-cols-1 gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition"
          >
            <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Interest ─────────────────────────────────────────────────────────
function StepInterest({ category, onSelect, onBack }) {
  const bank = questionBank[category];
  if (!bank) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600"
      >
        ← Back
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xl">{CATEGORY_ICONS[category]}</span>
        <span className="font-bold text-slate-900">{category}</span>
      </div>
      <p className="text-sm text-slate-500">{bank.question}</p>
      <div className="grid grid-cols-1 gap-2">
        {bank.options.map((opt) => (
          <button
            key={opt.value + opt.label}
            type="button"
            onClick={() => onSelect(opt.value, opt.label)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────
function RecommendationCards({ results, onReset }) {
  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-500">
          No attractions found for this selection. Try a different interest.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Top Matches ({results.length})
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          New Search
        </button>
      </div>

      {results.map((place, index) => (
        <div
          key={place.name}
          className="rounded-xl border border-orange-100 bg-orange-50 p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <p className="font-bold text-slate-900 text-sm leading-snug">
                {place.name}
              </p>
            </div>
            <span
              className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                place.score >= 40
                  ? "bg-green-100 text-green-700"
                  : place.score >= 25
                  ? "bg-orange-100 text-orange-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {place.score >= 40
                ? "★ Best match"
                : place.score >= 25
                ? "Good match"
                : "Possible match"}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {place.attributes.Description}
          </p>

          <div className="flex flex-wrap gap-2 text-xs">
            {place.attributes.subcounty && (
              <span className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                📍 {place.attributes.subcounty.replace(" Sub County", "")}
              </span>
            )}
            {place.attributes.Budget_Level && (
              <span className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                💰 {place.attributes.Budget_Level}
              </span>
            )}
            {place.attributes.Entry_Category && (
              <span className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                🎟 {place.attributes.Entry_Category}
              </span>
            )}
            {place.attributes.Opening_Hours && (
              <span className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                🕐 {place.attributes.Opening_Hours}
              </span>
            )}
            {place.attributes.Suitable_Age && (
              <span className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                👤 {place.attributes.Suitable_Age}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────
function WizardProgress({ step }) {
  const steps = ["audience", "category", "interest", "results"];
  const labels = ["Who", "Type", "Interest", "Results"];
  const current = steps.indexOf(step);

  if (step === "idle") return null;

  return (
    <div className="flex items-center gap-1 mb-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
              i < current
                ? "bg-orange-600 text-white"
                : i === current
                ? "bg-orange-100 border-2 border-orange-600 text-orange-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`text-[10px] font-semibold ${
              i === current ? "text-orange-600" : "text-slate-400"
            }`}
          >
            {labels[i]}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-3 flex-shrink-0 ${
                i < current ? "bg-orange-400" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Explore Component ───────────────────────────────────────────────────
export default function Explore() {
  // Map filter state
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(new Set());
  const [subcounty, setSubcounty] = useState("All Subcounties");
  const [resultCount, setResultCount] = useState(45);

  // Wizard state
  const [wizardStep, setWizardStep] = useState("idle"); // idle | audience | category | interest | results
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedAudienceLabel, setSelectedAudienceLabel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [selectedInterestLabel, setSelectedInterestLabel] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState("");

  const tourismLayerRef = useRef(null);

  function toggleCat(cat) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function reset() {
    setSearch("");
    setSubcounty("All Subcounties");
    setActive(new Set());
  }

  // ── Wizard handlers ────────────────────────────────────────────────────────
  function startWizard() {
    setWizardStep("audience");
    setRecommendations([]);
    setQueryError("");
  }

  function handleAudienceSelect(audienceValue, audienceLabel) {
    setSelectedAudience(audienceValue);
    setSelectedAudienceLabel(audienceLabel);
    setWizardStep("category");
  }

  function handleCategorySelect(cat) {
    setSelectedCategory(cat);
    setWizardStep("interest");
  }

  async function handleInterestSelect(interestValue, interestLabel) {
    setSelectedInterest(interestValue);
    setSelectedInterestLabel(interestLabel);
    setWizardStep("results");
    setIsQuerying(true);
    setQueryError("");

    try {
      // Wait up to 10 seconds for layer to be ready
      let layer = tourismLayerRef.current;
      if (!layer) {
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (tourismLayerRef.current) {
              clearInterval(interval);
              resolve();
            } else if (attempts > 20) {
              clearInterval(interval);
              reject(new Error("Map layer not yet loaded. Please wait for the map to fully load and try again."));
            }
          }, 500);
        });
        layer = tourismLayerRef.current;
      }

      const result = await layer.queryFeatures({
        where: `Final_Category = '${selectedCategory}'`,
        outFields: ["*"],
        returnGeometry: true,
      });

      const bank = questionBank[selectedCategory];

      const scored = result.features.map((feature) => {
        const attrs = feature.attributes;
        const score = scoreAttraction(
          attrs,
          selectedCategory,
          interestValue,
          bank,
          selectedAudience
        );
        return {
          score,
          name: attrs.Name,
          geometry: feature.geometry,
          attributes: attrs,
        };
      });

      const topResults = scored
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRecommendations(topResults);
    } catch (err) {
      console.error("Recommendation query failed:", err);
      setQueryError(err.message || "Failed to load recommendations.");
    } finally {
      setIsQuerying(false);
    }
  }

  function resetWizard() {
    setWizardStep("idle");
    setSelectedAudience("");
    setSelectedAudienceLabel("");
    setSelectedCategory("");
    setSelectedInterest("");
    setSelectedInterestLabel("");
    setRecommendations([]);
    setQueryError("");
  }

  // Breadcrumb text built from selections so far
  const breadcrumb = [
    selectedAudienceLabel,
    selectedCategory,
    selectedInterestLabel,
  ]
    .filter(Boolean)
    .join(" → ");

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr] bg-slate-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="z-10 flex flex-col border-r border-slate-200 bg-white shadow-sm overflow-y-auto">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600 mb-1">
            Explore
          </p>
          <h1 className="text-xl font-bold text-slate-950">
            Nairobi County Attraction Sites
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Discover museums, galleries, heritage sites, cultural attractions, and
            public spaces across Nairobi County.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 px-5 py-4 border-b border-slate-100">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-orange-600">{resultCount}</p>
            <p className="text-[10px] uppercase text-slate-500">Attractions</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-orange-600">9</p>
            <p className="text-[10px] uppercase text-slate-500">Categories</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-orange-600">GIS</p>
            <p className="text-[10px] uppercase text-slate-500">Platform</p>
          </div>
        </div>

        {/* ── Recommendation Wizard ── */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Find My Perfect Attraction
            </span>
            {wizardStep !== "idle" && (
              <button
                type="button"
                onClick={resetWizard}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Reset
              </button>
            )}
          </div>

          {/* Progress bar */}
          <WizardProgress step={wizardStep} />

          {/* Breadcrumb (shows selections made so far) */}
          {breadcrumb && wizardStep === "results" && (
            <div className="mb-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {breadcrumb}
              </p>
            </div>
          )}

          {wizardStep === "idle" && (
            <button
              type="button"
              onClick={startWizard}
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              ✨ Get Personalised Recommendations
            </button>
          )}

          {wizardStep === "audience" && (
            <StepAudience onSelect={handleAudienceSelect} />
          )}

          {wizardStep === "category" && (
            <StepCategory
              audienceLabel={selectedAudienceLabel}
              onSelect={handleCategorySelect}
              onBack={() => setWizardStep("audience")}
            />
          )}

          {wizardStep === "interest" && (
            <StepInterest
              category={selectedCategory}
              onSelect={handleInterestSelect}
              onBack={() => setWizardStep("category")}
            />
          )}

          {wizardStep === "results" && (
            <div className="space-y-3">
              {isQuerying && (
                <div className="text-center py-6">
                  <div className="inline-block w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-500">Searching attractions...</p>
                </div>
              )}

              {queryError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-600">{queryError}</p>
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!isQuerying && !queryError && (
                <RecommendationCards
                  results={recommendations}
                  onReset={resetWizard}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Map Filters ── */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
            Map Filters
          </p>

          <label className="block mb-3">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Search Attractions
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search attractions..."
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800"
            />
          </label>

          <label className="block mb-3">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Explore by Subcounty
            </span>
            <select
              value={subcounty}
              onChange={(e) => setSubcounty(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              {subcounties.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Filter by Category
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                onClick={reset}
              >
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    active.has(cat)
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Card */}
        <div className="m-5 rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-base font-bold">ArtGeo Trails</p>
          <p className="mt-2 text-sm text-slate-300">
            GIS-powered Art &amp; Tourism Platform connecting cultural attractions,
            heritage sites, artists, galleries, public spaces, and tourism
            experiences across Nairobi County.
          </p>
        </div>
      </aside>

      {/* ── Map ── */}
      <section className="min-h-0 h-full">
        <ArcGISMap
          selectedCategories={[...active]}
          selectedSubcounty={subcounty}
          searchText={search}
          setResultCount={setResultCount}
          recommendations={recommendations}
          onLayerReady={(layer) => {
            tourismLayerRef.current = layer;
          }}
        />
      </section>
    </div>
  );
}
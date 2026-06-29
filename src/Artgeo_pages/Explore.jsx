// src/pages/Explore.jsx
import { useState, useRef } from "react";
import ArcGISMap from "../components/MapView";
import questionBank from "../data/questionBank";
import { supabase } from "../lib/supabase";

const CATEGORY_ICONS = {
  Museum: "🏛", "Art Gallery": "🎨", "Historical Site": "🏺", Park: "🌳",
  Restaurant: "🍽", "Shopping Centre": "🛍", "Sports Facility": "⚽",
  Accommodation: "🏨", Recreation: "⚡",
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

// ─── Scoring & Tracking ─────────────────────────────────────────────────────
function scoreAttraction(attrs, selectedCategory, selectedInterest, bankEntry, selectedAudience) {
  let score = 0;
  const norm = (val) => (val ?? "").toLowerCase();
  const interest = norm(selectedInterest);
  const audience = norm(selectedAudience);

  if (norm(attrs.Final_Category) === norm(selectedCategory)) score += 20;
  if (norm(attrs.Target_Audience).includes(audience)) score += 15;
  if (norm(attrs[bankEntry.field]).includes(interest)) score += 12;
  if (norm(attrs[bankEntry.secondaryField]).includes(interest)) score += 6;
  if (norm(attrs.Main_Attraction).includes(interest)) score += 5;
  if (norm(attrs.Secondary_Attraction).includes(interest)) score += 3;

  if (interest.includes("photo")) {
    const ps = norm(attrs.Photography_Score);
    if (ps === "very high") score += 5;
    else if (ps === "high") score += 3;
    else if (ps === "medium") score += 1;
  }
  return score;
}

async function trackActivity({ attractionName, category, action, visitorType = null, preference = null, score = null, subcounty = null, budgetLevel = null, userId = null }) {
  try {
    await supabase.from("user_activity").insert({
      session_id: sessionStorage.getItem("artgeo_session") || generateSession(),
      user_id: userId,
      attraction_name: attractionName,
      category,
      action,
      visitor_type: visitorType,
      preference,
      score,
      subcounty,
      budget_level: budgetLevel,
    });
  } catch (err) {
    console.warn("Activity tracking failed:", err);
  }
}

function generateSession() {
  const id = crypto.randomUUID();
  sessionStorage.setItem("artgeo_session", id);
  return id;
}

// Step Components (unchanged)
function StepAudience({ onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 leading-relaxed">Who are you exploring Nairobi with today?</p>
      <div className="grid grid-cols-1 gap-2">
        {audienceOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value, opt.label)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all active:scale-[0.985]"
          >
            <span className="text-2xl">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCategory({ audienceLabel, onSelect, onBack }) {
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600">← Back</button>
      <p className="text-sm text-slate-600 leading-relaxed">
        What kind of experience are you looking for, <span className="font-semibold text-slate-700">{audienceLabel}</span>?
      </p>
      <div className="grid grid-cols-1 gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all active:scale-[0.985]"
          >
            <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepInterest({ category, onSelect, onBack }) {
  const bank = questionBank[category];
  if (!bank) return null;

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-600">← Back</button>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
        <span className="font-bold text-slate-900">{category}</span>
      </div>
      <p className="text-sm text-slate-600">{bank.question}</p>
      <div className="grid grid-cols-1 gap-2">
        {bank.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value, opt.label)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all active:scale-[0.985]"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationCards({ results, onReset, visitorType, preference, category }) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
        <p className="text-slate-600 text-lg">No matches found for this combination.</p>
        <p className="text-sm text-slate-500 mt-2">Try changing your interests or area — Nairobi has so much to offer!</p>
        <button type="button" onClick={onReset} className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
          Start a New Discovery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">Recommended For You</p>
        <button type="button" onClick={onReset} className="text-xs font-medium text-orange-600 hover:text-orange-700">New Search</button>
      </div>

      {results.map((place, index) => (
        <div key={place.name} className="rounded-2xl border border-orange-100 bg-white p-5 space-y-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <p className="font-semibold text-slate-900 leading-tight">{place.name}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              place.score >= 40 ? "bg-green-100 text-green-700" : place.score >= 25 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>
              {place.score >= 40 ? "★ Highly Recommended" : place.score >= 25 ? "Popular Choice" : "Worth Exploring"}
            </span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{place.attributes.Description}</p>

          <div className="flex flex-wrap gap-2 text-xs pt-1">
            {place.attributes.subcounty && <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">📍 {place.attributes.subcounty.replace(" Sub County", "")}</span>}
            {place.attributes.Budget_Level && <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">💰 {place.attributes.Budget_Level}</span>}
            {place.attributes.Entry_Category && <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">🎟 {place.attributes.Entry_Category}</span>}
          </div>

          <button type="button" onClick={() => trackActivity({ attractionName: place.name, category, action: "view_location", visitorType, preference, score: place.score, subcounty: place.attributes.subcounty, budgetLevel: place.attributes.Budget_Level })} className="w-full mt-2 py-3 rounded-xl border border-orange-200 bg-white text-orange-700 font-semibold hover:bg-orange-50 transition">
            📍 View on Map
          </button>
        </div>
      ))}
    </div>
  );
}

function WizardProgress({ step }) {
  const steps = ["audience", "category", "interest", "results"];
  const labels = ["Who", "Type", "Interest", "Results"];
  const current = steps.indexOf(step);
  if (step === "idle") return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all ${
            i < current ? "bg-orange-600 text-white" : i === current ? "bg-orange-100 border-2 border-orange-600 text-orange-700" : "bg-slate-100 text-slate-400"
          }`}>{i < current ? "✓" : i + 1}</div>
          <span className={`text-xs font-medium ${i === current ? "text-orange-700" : "text-slate-400"}`}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Explore() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(new Set());
  const [subcounty, setSubcounty] = useState("All Subcounties");
  const [resultCount, setResultCount] = useState(45);

  const [wizardStep, setWizardStep] = useState("idle");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedAudienceLabel, setSelectedAudienceLabel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [selectedInterestLabel, setSelectedInterestLabel] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState("");

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const tourismLayerRef = useRef(null);

  const toggleCat = (cat) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const reset = () => {
    setSearch("");
    setSubcounty("All Subcounties");
    setActive(new Set());
  };

  const startWizard = () => {
    setWizardStep("audience");
    setRecommendations([]);
    setQueryError("");
    setSheetExpanded(true);
  };

  const handleAudienceSelect = (audienceValue, audienceLabel) => {
    setSelectedAudience(audienceValue);
    setSelectedAudienceLabel(audienceLabel);
    setWizardStep("category");
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setWizardStep("interest");
  };

  const handleInterestSelect = async (interestValue, interestLabel) => {
    setSelectedInterest(interestValue);
    setSelectedInterestLabel(interestLabel);
    setWizardStep("results");
    setIsQuerying(true);
    setQueryError("");

    try {
      let layer = tourismLayerRef.current;
      if (!layer) {
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (tourismLayerRef.current) {
              clearInterval(interval);
              resolve();
            } else if (attempts > 30) {
              reject(new Error("Map is still loading. Please try again in a moment."));
            }
          }, 400);
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
        const score = scoreAttraction(attrs, selectedCategory, interestValue, bank, selectedAudience);
        return { score, name: attrs.Name, geometry: feature.geometry, attributes: attrs };
      });

      const topResults = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

      setRecommendations(topResults);

      topResults.forEach((place) => {
        trackActivity({
          attractionName: place.name,
          category: selectedCategory,
          action: "get_recommendation",
          visitorType: selectedAudience,
          preference: interestValue,
          score: place.score,
          subcounty: place.attributes?.subcounty,
          budgetLevel: place.attributes?.Budget_Level,
        });
      });
    } catch (err) {
      console.error(err);
      setQueryError("Something went wrong while finding places. Please try again.");
    } finally {
      setIsQuerying(false);
    }
  };

  const resetWizard = () => {
    setWizardStep("idle");
    setSelectedAudience(""); setSelectedAudienceLabel("");
    setSelectedCategory(""); setSelectedInterest(""); setSelectedInterestLabel("");
    setRecommendations([]); setQueryError("");
  };

  const breadcrumb = [selectedAudienceLabel, selectedCategory, selectedInterestLabel].filter(Boolean).join(" → ");

  return (
    <div className="relative min-h-screen bg-slate-100 lg:grid lg:grid-cols-[450px_1fr]">
      <section className="absolute inset-0 lg:relative lg:order-2 h-full">
        <ArcGISMap
          selectedCategories={[...active]}
          selectedSubcounty={subcounty}
          searchText={search}
          setResultCount={setResultCount}
          recommendations={recommendations}
          onLayerReady={(layer) => { tourismLayerRef.current = layer; }}
        />
      </section>

      <aside className={`
        lg:order-1 lg:relative lg:h-screen lg:border-r
        absolute bottom-0 left-0 right-0 z-30
        flex flex-col bg-[#F7F4EE] border-t lg:border-t-0 border-slate-200
        rounded-t-3xl lg:rounded-none shadow-xl lg:shadow-none
        transition-all duration-300
        ${sheetExpanded ? "h-[92vh]" : "h-[140px]"}
        lg:h-full
      `}>
        <button type="button" onClick={() => setSheetExpanded(!sheetExpanded)} className="lg:hidden w-full pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </button>

        {!sheetExpanded && (
          <div className="lg:hidden px-6 pb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-orange-600">EXPLORE NAIROBI</p>
              <p className="text-sm text-slate-600">{resultCount} places to discover</p>
            </div>
            <button onClick={startWizard} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm active:scale-95">✨ Discover</button>
          </div>
        )}

        {/* FIXED SCROLLABLE CONTENT AREA */}
        <div
          className={`${sheetExpanded ? "flex" : "hidden"} lg:flex flex-col overflow-y-scroll pr-2`}
          style={{
            height: "calc(100vh - 80px)",
            scrollbarWidth: "thin",
          }}
        >
          <div className="px-6 pt-6 pb-8">
            <p className="uppercase text-sm tracking-widest text-orange-600 font-semibold">Welcome to</p>
            <h1 className="text-4xl font-bold text-slate-900 mt-2" style={{ fontFamily: "Playfair Display, serif" }}>
              Discover Nairobi
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-8">
              Your personal guide to the city’s museums, galleries, parks, and hidden cultural gems.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 px-6 mb-8">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-orange-600">{resultCount}</p>
              <p className="text-xs text-slate-500">Places</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-orange-600">9</p>
              <p className="text-xs text-slate-500">Experiences</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-orange-600">Nairobi</p>
              <p className="text-xs text-slate-500">County</p>
            </div>
          </div>

          {/* Wizard */}
          <div className="px-6 pb-8 border-b border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-500">Let’s find your perfect spot</span>
              {wizardStep !== "idle" && <button onClick={resetWizard} className="text-xs text-orange-600 font-medium">Reset</button>}
            </div>

            <WizardProgress step={wizardStep} />

            {breadcrumb && wizardStep === "results" && (
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-600 mb-4">{breadcrumb}</div>
            )}

            {wizardStep === "idle" && (
              <button onClick={startWizard} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-2xl text-base active:scale-[0.985] transition">
                ✨ Help Me Discover Places I’ll Love
              </button>
            )}

            {wizardStep === "audience" && <StepAudience onSelect={handleAudienceSelect} />}
            {wizardStep === "category" && <StepCategory audienceLabel={selectedAudienceLabel} onSelect={handleCategorySelect} onBack={() => setWizardStep("audience")} />}
            {wizardStep === "interest" && <StepInterest category={selectedCategory} onSelect={handleInterestSelect} onBack={() => setWizardStep("category")} />}

            {wizardStep === "results" && (
              <div className="pt-2">
                {isQuerying && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-7 h-7 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 mt-4">Finding the best matches for you...</p>
                  </div>
                )}
                {queryError && <div className="text-red-600 text-sm p-4 bg-red-50 rounded-2xl">{queryError}</div>}
                {!isQuerying && !queryError && <RecommendationCards results={recommendations} onReset={resetWizard} visitorType={selectedAudience} preference={selectedInterest} category={selectedCategory} />}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="px-6 pt-8 pb-12">
            <p className="uppercase text-sm tracking-widest text-slate-400 font-medium mb-5">Browse All Places</p>

            <label className="block mb-6">
              <span className="text-sm font-medium text-slate-500 block mb-2">Search Places</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try museum, park, gallery..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 focus:border-orange-400 outline-none"
              />
            </label>

            <label className="block mb-6">
              <span className="text-sm font-medium text-slate-500 block mb-2">Choose an Area</span>
              <select value={subcounty} onChange={(e) => setSubcounty(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 focus:border-orange-400 outline-none">
                {subcounties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-500">What Interests You?</span>
                <button onClick={reset} className="text-xs text-orange-600">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`rounded-2xl border px-6 py-4 text-base font-semibold transition-all ${
                      active.has(cat) ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-white hover:border-orange-200 text-slate-700"
                    }`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Helpful Tip */}
          <div className="mx-6 mb-8 p-5 bg-white border border-slate-100 rounded-3xl">
            <p className="text-orange-600 text-sm">💡 Pro Tip</p>
            <p className="text-slate-600 mt-1 text-sm">The more honest you are about who you’re travelling with, the better we can match you with places you’ll truly enjoy.</p>
          </div>

          {/* Branding */}
          <div className="mx-6 mt-auto mb-10 bg-slate-900 text-white p-6 rounded-3xl">
            <p className="font-semibold">ArtGeo Trails</p>
            <p className="text-slate-400 text-sm mt-2">Connecting curious travellers with the soul of Nairobi.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
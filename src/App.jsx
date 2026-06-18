import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import ArtistSubmit from "./Artgeo_pages/ArtistSubmit";

import Home from "./Artgeo_pages/Home";
import Explore from "./Artgeo_pages/Explore";
import RoutePlanner from "./Artgeo_pages/RoutePlanner";
import Dashboard from "./Artgeo_pages/Dashboard";
import Artists from "./Artgeo_pages/Artists";
import About from "./Artgeo_pages/About";
import Auth from "./Artgeo_pages/Auth";

const pages = {
  home: Home,
  explore: Explore,
  route: RoutePlanner,
  dashboard: Dashboard,
  artists: Artists,
  about: About,
  submit: ArtistSubmit,  
};

// Pages everyone can see
const publicNav = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
];

// Pages only logged-in users can see
const protectedNav = [
  { id: "explore", label: "Explore" },
  { id: "route", label: "Route Planner" },
  { id: "artists", label: "Artists" },
];

// Pages only admins can see
const adminNav = [
  { id: "dashboard", label: "Dashboard" },
];

// Which page IDs require login
const protectedPageIds = ["explore", "route", "artists", "dashboard", "submit"];

function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

useEffect(() => {
  async function loadSession(session) {
    if (!session) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    setUser(session.user);

    // Try loading role, log exactly what happens
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    console.log("PROFILE DATA:", data);
    console.log("PROFILE ERROR:", error);

    if (data?.role) {
      setUserRole(data.role);
    }

    setLoading(false);
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    loadSession(session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      loadSession(session);
      setShowAuth(false);
    }
  );

  return () => listener.subscription.unsubscribe();
}, []);

  function handleNavClick(id) {
    // If page is protected and user is not logged in, show auth modal
    if (protectedPageIds.includes(id) && !user) {
      setShowAuth(true);
      return;
    }
    // If admin-only page and user is not admin, ignore
    if (id === "dashboard" && userRole !== "admin") return;

    setActiveNav(id);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setActiveNav("home");
  }

  // Build nav: public pages always shown, protected pages shown with lock hint for guests
  const navItems = [
    ...publicNav,
    ...protectedNav,
    ...(userRole === "admin" ? adminNav : []),
  ];

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm font-medium animate-pulse">
          Loading ArtGeo Trails...
        </p>
      </div>
    );
  }

  const ActivePage = pages[activeNav] ?? Home;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      {/* Auth modal */}
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}

      {/* Header */}
      <header className="relative z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveNav("home")}
          className="flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white font-extrabold text-lg shadow-lg">
            AG
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight leading-none">
              <span className="text-slate-900">ArtGeo</span>{" "}
              <span className="text-orange-600">Trails</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-800 font-bold mt-1">
              GIS-Powered Art & Tourism Platform
            </p>
          </div>
        </button>

        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ id, label }) => {
            const isLocked = protectedPageIds.includes(id) && !user;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                  activeNav === id
                    ? "bg-orange-50 text-orange-700"
                    : isLocked
                    ? "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {isLocked && <span>🔒</span>}
                {label}
              </button>
            );
          })}

          {/* Auth controls */}
          {!user ? (
            <button
              onClick={() => setShowAuth(true)}
              className="ml-4 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-md hover:bg-orange-700 transition"
            >
              Sign In
            </button>
          ) : (
         <div className="ml-4 flex items-center gap-3 border-l border-slate-200 pl-4">
  {userRole === "admin" ? (
    <button
      onClick={() => handleNavClick("dashboard")}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-md hover:bg-orange-700 transition"
    >
      ⚡ Dashboard
    </button>
  ) : (
    <span className="text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-full">
      {user.email.split("@")[0]}
    </span>
  )}
  <button
    onClick={handleSignOut}
    className="px-3 py-2 rounded-md text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
  >
    Sign Out
  </button>
</div>
          )}
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <ActivePage onNavigate={handleNavClick} />
      </main>
    </div>
  );
}

export default App;
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
const adminNav = [{ id: "dashboard", label: "Dashboard" }];

// Which page IDs require login
const protectedPageIds = ["explore", "route", "artists", "dashboard", "submit"];

function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Mobile hamburger menu open/closed
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track which pages have been visited at least once.
  // Map pages are pre-mounted only after the user first visits them
  // so we don't load ArcGIS until needed.
  const [mounted, setMounted] = useState(new Set(["home"]));

  useEffect(() => {
    async function loadSession(session) {
      if (!session) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }
      setUser(session.user);
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Failed to load profile role:", error);
      }

      if (data?.role) setUserRole(data.role);
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
    if (protectedPageIds.includes(id) && !user) {
      setShowAuth(true);
      setMobileMenuOpen(false);
      return;
    }
    if (id === "dashboard" && userRole !== "admin") return;

    // Mark this page as mounted so it renders for the first time
    setMounted((prev) => new Set([...prev, id]));
    setActiveNav(id);
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setActiveNav("home");
    setMobileMenuOpen(false);
  }

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      {/* Auth modal */}
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}

      {/* Header */}
      <header className="relative z-30 flex h-16 sm:h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 sm:gap-4 text-left min-w-0"
        >
          <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white font-extrabold text-sm sm:text-lg shadow-lg">
            AG
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-none truncate">
              <span className="text-slate-900">ArtGeo</span>{" "}
              <span className="text-orange-600">Trails</span>
            </h1>
            <p className="hidden sm:block text-xs uppercase tracking-[0.25em] text-slate-800 font-bold mt-1">
              GIS-Powered Art &amp; Tourism Platform
            </p>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
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

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="md:hidden flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? (
            <span className="text-2xl leading-none">✕</span>
          ) : (
            <span className="text-2xl leading-none">☰</span>
          )}
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 top-16 z-20 bg-black/30"
          />

          {/* Drawer panel */}
          <nav className="md:hidden fixed top-16 left-0 right-0 z-20 bg-white border-b border-slate-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col p-3">
              {navItems.map(({ id, label }) => {
                const isLocked = protectedPageIds.includes(id) && !user;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavClick(id)}
                    className={`px-4 py-3 rounded-md text-sm font-semibold text-left transition flex items-center gap-2 ${
                      activeNav === id
                        ? "bg-orange-50 text-orange-700"
                        : isLocked
                        ? "text-slate-400"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isLocked && <span>🔒</span>}
                    {label}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-slate-200">
                {!user ? (
                  <button
                    onClick={() => {
                      setShowAuth(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
                  >
                    Sign In
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {userRole === "admin" && (
                      <button
                        onClick={() => handleNavClick("dashboard")}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
                      >
                        ⚡ Dashboard
                      </button>
                    )}
                    <p className="text-center text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-full">
                      Signed in as {user.email.split("@")[0]}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </>
      )}

      {/* ── Main: all pages rendered, shown/hidden via CSS ── */}
      <main className="flex-1 overflow-hidden relative">
        {/* Pages WITHOUT maps — only mount when first visited, unmount is fine */}
        <div className={activeNav === "home" ? "h-full" : "hidden"}>
          <Home onNavigate={handleNavClick} />
        </div>

        <div className={activeNav === "about" ? "h-full" : "hidden"}>
          <About onNavigate={handleNavClick} />
        </div>

        <div className={activeNav === "artists" ? "h-full" : "hidden"}>
          {mounted.has("artists") && <Artists onNavigate={handleNavClick} />}
        </div>

        <div className={activeNav === "dashboard" ? "h-full" : "hidden"}>
          {mounted.has("dashboard") && <Dashboard onNavigate={handleNavClick} />}
        </div>

        <div className={activeNav === "submit" ? "h-full" : "hidden"}>
          {mounted.has("submit") && <ArtistSubmit onNavigate={handleNavClick} />}
        </div>

        {/* ── MAP PAGES — always mounted once visited, never unmounted ── */}
        {/* This keeps the ArcGIS MapView alive across navigation          */}

        <div
          className={activeNav === "explore" ? "h-full" : "hidden"}
          style={{ contain: "strict" }}
        >
          {mounted.has("explore") && <Explore onNavigate={handleNavClick} />}
        </div>

        <div className={activeNav === "route" ? "h-full min-h-0" : "hidden"}>
          {mounted.has("route") && <RoutePlanner onNavigate={handleNavClick} />}
        </div>
      </main>
    </div>
  );
}

export default App;
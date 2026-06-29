// src/pages/RoutePlanner.jsx
import { useState, useEffect, useRef } from "react";
import WebMap from "@arcgis/core/WebMap";
import Point from "@arcgis/core/geometry/Point";

import RouteMap from "../components/RouteMap";
import { getORSRoute } from "../services/openRouteService";
import { getTravelMatrix } from "../services/orsMatrix";
import { distanceToRoute, flattenSteps, getCurrentStepIndex } from "../services/geoUtils";

const OFF_ROUTE_THRESHOLD_METERS = 40;
const MIN_REROUTE_INTERVAL_MS = 15000;

export default function RoutePlanner() {
  const [attractions, setAttractions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStops, setSelectedStops] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [optimizationInfo, setOptimizationInfo] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [travelMode, setTravelMode] = useState("driving-car");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const watchIdRef = useRef(null);
  const lastRerouteRef = useRef(0);

  // Location Tracking
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
        });
      },
      (error) => console.error("LOCATION ERROR:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!isNavigating) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading,
      }),
      (error) => console.error("TRACKING ERROR:", error),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isNavigating]);

  // Load Attractions
  useEffect(() => {
    async function loadAttractions() {
      try {
        const webmap = new WebMap({ portalItem: { id: "937b4e8d66fc42bda0509eb3bbcd30e7" } });
        await webmap.load();
        const groupLayer = webmap.layers.getItemAt(0);
        const tourismLayer = groupLayer.layers.find(l => l.title === "Tourism Subcounty Final");

        const result = await tourismLayer.queryFeatures({
          where: "1=1",
          outFields: ["*"],
          returnGeometry: true,
        });

        setAttractions(result.features.map(f => ({
          objectId: f.attributes.OBJECTID,
          name: f.attributes.Name,
          category: f.attributes.Final_Category,
          geometry: f.geometry,
        })));
      } catch (error) {
        console.error("Loading attractions failed:", error);
      }
    }
    loadAttractions();
  }, []);

  // Build stops with current location
  function buildStopsFromCurrentLocation() {
    if (!currentLocation) return null;
    const startStop = {
      objectId: "current-location",
      name: "Your Current Location",
      geometry: new Point({
        longitude: currentLocation.longitude,
        latitude: currentLocation.latitude,
        spatialReference: { wkid: 4326 },
      }),
    };
    return [startStop, ...selectedStops];
  }

  // Real-time Route Building
  useEffect(() => {
    async function buildRoute() {
      const routeStops = buildStopsFromCurrentLocation();
      if (!routeStops || routeStops.length < 2) {
        setRoutePath([]);
        setOptimizationInfo(null);
        return;
      }

      // Avoid too frequent rerouting
      if (isNavigating && routePath.length > 0 && currentLocation) {
        const distMeters = distanceToRoute(
          [currentLocation.longitude, currentLocation.latitude],
          routePath
        );
        if (distMeters < OFF_ROUTE_THRESHOLD_METERS || 
            Date.now() - lastRerouteRef.current < MIN_REROUTE_INTERVAL_MS) {
          return;
        }
      }

      try {
        const routeData = await getORSRoute(routeStops, travelMode);
        if (!routeData?.features?.length) return;

        const route = routeData.features[0];
        setRoutePath(route.geometry.coordinates);
        setRouteSteps(flattenSteps(route));
        setCurrentStepIndex(0);
        lastRerouteRef.current = Date.now();

        setOptimizationInfo({
          distanceKm: (route.properties.summary.distance / 1000).toFixed(2),
          durationMin: Math.round(route.properties.summary.duration / 60),
        });
      } catch (error) {
        console.error("Routing Error:", error);
      }
    }

    buildRoute();
  }, [selectedStops, currentLocation, travelMode, isNavigating]);

  // Advance navigation step
  useEffect(() => {
    if (!isNavigating || !currentLocation || routeSteps.length === 0) return;
    const point = [currentLocation.longitude, currentLocation.latitude];
    setCurrentStepIndex((prev) => getCurrentStepIndex(point, routeSteps, prev));
  }, [currentLocation, isNavigating, routeSteps]);

  const filteredAttractions = attractions.filter((place) =>
    place.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Add / Remove Stops
  const addStop = (place) => {
    if (!selectedStops.find(s => s.objectId === place.objectId)) {
      setSelectedStops(prev => [...prev, place]);
    }
  };

  const removeStop = (objectId) => {
    setSelectedStops(prev => prev.filter(s => s.objectId !== objectId));
  };

  // Optimize Route
  const optimizeRoute = async () => {
    if (!currentLocation) {
      alert("Please wait for location access");
      return;
    }
    if (selectedStops.length < 2) {
      alert("Please select at least 2 attractions to optimize");
      return;
    }

    try {
      const routeStops = buildStopsFromCurrentLocation();
      const matrix = await getTravelMatrix(routeStops);
      const durations = matrix.durations;

      const optimized = [routeStops[0]];
      const visited = new Set([0]);
      let currentIndex = 0;

      while (optimized.length < routeStops.length) {
        let nextIndex = null;
        let shortest = Infinity;

        durations[currentIndex].forEach((time, index) => {
          if (!visited.has(index) && time < shortest) {
            shortest = time;
            nextIndex = index;
          }
        });

        if (nextIndex === null) break;
        visited.add(nextIndex);
        optimized.push(routeStops[nextIndex]);
        currentIndex = nextIndex;
      }

      setSelectedStops(optimized.slice(1));
      alert("✅ Route optimized based on travel time!");
    } catch (error) {
      console.error(error);
      alert("Optimization failed. Please try again.");
    }
  };

  const startNavigation = () => {
    if (!currentLocation) {
      alert("Waiting for your location...");
      return;
    }
    if (selectedStops.length === 0) {
      alert("Add some attractions first!");
      return;
    }
    setIsNavigating(true);
    lastRerouteRef.current = Date.now();
  };

  const stopNavigation = () => setIsNavigating(false);

  const clearRoute = () => {
    setIsNavigating(false);
    setSelectedStops([]);
    setRoutePath([]);
    setOptimizationInfo(null);
    setRouteSteps([]);
    setCurrentStepIndex(0);
  };

  const currentStep = isNavigating ? routeSteps[currentStepIndex] : null;

  return (
    <div className="relative min-h-screen bg-slate-100 lg:grid lg:grid-cols-[450px_1fr]">
      <section className="absolute inset-0 lg:relative lg:order-2 h-full">
        <RouteMap
          stops={selectedStops}
          routePath={routePath}
          currentLocation={currentLocation}
          isNavigating={isNavigating}
        />
      </section>

      {/* Mobile Floating Navigation Banner */}
      {isNavigating && currentStep && (
        <div className="lg:hidden absolute top-4 left-4 right-4 z-20 rounded-3xl bg-blue-600 shadow-xl p-5 text-white">
          <p className="uppercase text-xs tracking-widest opacity-75">Right Now</p>
          <p className="font-semibold text-lg mt-1 leading-tight">{currentStep.instruction}</p>
          <p className="text-sm opacity-75 mt-1">{Math.round(currentStep.distance)} meters ahead</p>
        </div>
      )}

      <aside className={`
        lg:order-1 lg:relative lg:h-screen lg:border-r
        absolute bottom-0 left-0 right-0 z-30
        flex flex-col bg-white border-t lg:border-t-0 border-slate-200
        rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none
        transition-all duration-300
        ${sheetExpanded ? "h-[92vh]" : "h-[160px]"}
      `}>
        <button
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="lg:hidden w-full pt-4 pb-2 flex justify-center"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </button>

        {!sheetExpanded && (
          <div className="lg:hidden px-6 pb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-orange-600">ROUTE PLANNER</p>
              <p className="text-sm text-slate-600">
                {selectedStops.length} {selectedStops.length === 1 ? "stop" : "stops"} chosen
              </p>
            </div>
            <button
              onClick={startNavigation}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm"
            >
              ▶ Go
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`${sheetExpanded ? "flex" : "hidden"} lg:flex flex-col overflow-y-scroll pr-3`}
          style={{ height: "calc(100vh - 85px)", scrollbarWidth: "thin" }}
        >
          <div className="px-6 pt-7 pb-8">
            <p className="uppercase tracking-[0.5px] text-sm text-orange-600 font-medium">Let's make today unforgettable</p>
            <h1 className="text-4xl font-bold text-slate-900 mt-2" style={{ fontFamily: "Playfair Display, serif" }}>
              Plan Your Perfect Day
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Pick the places you want to visit and we'll help you create the smartest route across Nairobi.
            </p>
          </div>

          {/* Travel Mode */}
          <div className="px-6 pb-8 border-b">
            <p className="text-sm font-medium text-slate-500 mb-3">How are you moving today?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTravelMode("foot-walking")} disabled={isNavigating}
                className={`rounded-2xl py-4 text-base font-medium border transition-all ${travelMode === "foot-walking" ? "bg-orange-600 text-white" : "bg-white border-slate-200"}`}>
                🚶 Walking
              </button>
              <button onClick={() => setTravelMode("driving-car")} disabled={isNavigating}
                className={`rounded-2xl py-4 text-base font-medium border transition-all ${travelMode === "driving-car" ? "bg-orange-600 text-white" : "bg-white border-slate-200"}`}>
                🚗 Driving
              </button>
            </div>
          </div>

          {/* Search & Attractions */}
          <div className="px-6 pt-8 pb-8 border-b">
            <p className="text-sm font-medium text-slate-500 mb-2">Search Attractions</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try 'National Park' or 'Museum'..."
              className="w-full rounded-2xl border border-slate-200 px-5 py-4 focus:border-orange-400 outline-none"
            />

            <div className="mt-6 max-h-[340px] overflow-y-auto pr-2 space-y-2">
              {filteredAttractions.map((place) => (
                <button
                  key={place.objectId}
                  onClick={() => addStop(place)}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-slate-900">{place.name}</p>
                  <p className="text-sm text-slate-500">{place.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Stops */}
          <div className="px-6 pt-8 pb-8 border-b">
            <p className="font-semibold text-lg mb-4">Your Journey ({selectedStops.length})</p>
            {selectedStops.length === 0 ? (
              <p className="text-slate-400 italic">Your selected places will appear here...</p>
            ) : (
              <div className="space-y-3">
                {selectedStops.map((stop, i) => (
                  <div key={stop.objectId} className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-orange-600">
                          {i === selectedStops.length - 1 ? "FINAL STOP" : `STOP ${i + 1}`}
                        </p>
                        <p className="font-medium mt-1">{stop.name}</p>
                      </div>
                      <button onClick={() => removeStop(stop.objectId)} className="text-red-500 text-sm">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Route Summary */}
          <div className="px-6 pt-8 pb-12">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-6">
              <p className="font-semibold text-orange-900">Your Route Summary</p>
              <div className="mt-5 space-y-3 text-sm">
                <p className="flex justify-between"><span className="text-slate-600">Stops</span> <span className="font-medium">{selectedStops.length}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Distance</span> <span className="font-medium">{optimizationInfo?.distanceKm || "—"} km</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Est. Time</span> <span className="font-medium">{optimizationInfo?.durationMin || "—"} min</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-white space-y-3 flex-shrink-0">
          <button
            onClick={optimizeRoute}
            disabled={isNavigating || selectedStops.length < 2}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-2xl font-semibold transition"
          >
            ✨ Optimize My Route
          </button>

          {!isNavigating ? (
            <button onClick={startNavigation} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition">
              ▶ Start Navigation
            </button>
          ) : (
            <button onClick={stopNavigation} className="w-full py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-semibold transition">
              ⏹ End Navigation
            </button>
          )}

          <button onClick={clearRoute} className="w-full py-4 border border-slate-300 hover:bg-slate-50 rounded-2xl font-medium text-slate-700 transition">
            Clear Everything
          </button>
        </div>
      </aside>
    </div>
  );
}
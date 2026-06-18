import { useState, useEffect } from "react";
import WebMap from "@arcgis/core/WebMap";

import RouteMap from "../components/RouteMap";
import { getORSRoute } from "../services/openRouteService";


import { getTravelMatrix }from "../services/orsMatrix";

export default function RoutePlanner() {
  const [attractions, setAttractions] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedStops, setSelectedStops] = useState([]);

  const [routePath, setRoutePath] = useState([]);

  const [optimizationInfo, setOptimizationInfo] =
    useState(null);
   

  //current Location
    const [currentLocation, setCurrentLocation] =
  useState(null);

  useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log(position);

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error(
        "LOCATION ERROR:",
        error
      );
    },
    {
      enableHighAccuracy: true,
    }
  );
}, []);

useEffect(() => {
  console.log(
    "Updated Location:",
    currentLocation
  );
}, [currentLocation]);
  // ==========================
  // Load Attractions
  // ==========================
  useEffect(() => {
    async function loadAttractions() {
      try {
        const webmap = new WebMap({
          portalItem: {
            id: "937b4e8d66fc42bda0509eb3bbcd30e7",
          },
        });

        await webmap.load();

        const groupLayer =
          webmap.layers.getItemAt(0);

        const tourismLayer =
          groupLayer.layers.find(
            (layer) =>
              layer.title ===
              "Tourism Subcounty Final"
          );

        const result =
          await tourismLayer.queryFeatures({
            where: "1=1",
            outFields: ["*"],
            returnGeometry: true,
          });

        const places =
          result.features.map((feature) => ({
            objectId:
              feature.attributes.OBJECTID,

            name:
              feature.attributes.Name,

            category:
              feature.attributes
                .Final_Category,

            geometry: feature.geometry,
          }));

        setAttractions(places);

        console.log(
          "Loaded attractions:",
          places.length
        );
      } catch (error) {
        console.error(
          "Loading attractions failed:",
          error
        );
      }
    }

    loadAttractions();
  }, []);

  // ==========================
  // Real-Time OSR Routing
  // ==========================
  useEffect(() => {
    async function buildRoute() {
      if (selectedStops.length < 2) {
        setRoutePath([]);
        setOptimizationInfo(null);
        return;
      }

      try {
       const routeData =
  await getORSRoute(selectedStops);

  console.log(
  "ORS RESPONSE:",
  routeData
);

    if (
  !routeData ||
  !routeData.features ||
  routeData.features.length === 0
) {
  return;
}

const route =
  routeData.features[0];

setRoutePath(
  route.geometry.coordinates
);

setOptimizationInfo({
  distanceKm: (
    route.properties.summary.distance /
    1000
  ).toFixed(2),

  durationMin: Math.round(
    route.properties.summary.duration /
    60
  ),
});   
      } catch (error) {
        console.error(
          "OSRM Routing Error:",
          error
        );
      }
    }

    buildRoute();
  }, [selectedStops]);

  // ==========================
  // Search Filter
  // ==========================
  const filteredAttractions =
    attractions.filter((place) =>
      place.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // ==========================
  // Add Stop
  // ==========================
  function addStop(place) {
    const exists =
      selectedStops.find(
        (s) =>
          s.objectId ===
          place.objectId
      );

    if (!exists) {
      setSelectedStops((prev) => [
        ...prev,
        place,
      ]);
    }
  }

  // ==========================
  // Remove Stop
  // ==========================
  function removeStop(objectId) {
    setSelectedStops((prev) =>
      prev.filter(
        (stop) =>
          stop.objectId !== objectId
      )
    );
  }// ==========================
// Optimize Route
// ==========================
async function optimizeRoute() {
  if (selectedStops.length < 3) {
    alert("Select at least 3 stops");
    return;
  }

  try {
    const matrix =
      await getTravelMatrix(
        selectedStops
      );

    const durations =
      matrix.durations;

    const remaining =
      [...selectedStops];

    const optimized = [];

    let currentIndex = 0;

    optimized.push(
      remaining[currentIndex]
    );

    const visited =
      new Set([currentIndex]);

    while (
      optimized.length <
      selectedStops.length
    ) {
      let nextIndex = null;
      let shortest = Infinity;

      durations[currentIndex].forEach(
        (time, index) => {
          if (
            !visited.has(index) &&
            time < shortest
          ) {
            shortest = time;
            nextIndex = index;
          }
        }
      );

      visited.add(nextIndex);

      optimized.push(
        selectedStops[nextIndex]
      );

      currentIndex = nextIndex;
    }

    setSelectedStops(
      optimized
    );

    alert(
      "Route optimized using road travel times"
    );
  } catch (error) {
    console.error(error);

    alert(
      "Optimization failed"
    );
  }
}

// ==========================
// Clear Route
// ==========================
function clearRoute() {
  setSelectedStops([]);
  setRoutePath([]);
  setOptimizationInfo(null);
}

  // ==========================
  // Clear Route
  // ==========================
  function clearRoute() {
    setSelectedStops([]);
    setRoutePath([]);
    setOptimizationInfo(null);
  }

  const totalStops =
    selectedStops.length;

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[350px_1fr] overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="bg-white border-r border-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Route Planner
          </p>

          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Plan Your Nairobi Tour
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Select attractions and
            generate an optimized
            tourism route.
          </p>
        </div>

        {/* Search */}
        <div className="p-5 border-b">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Search Attraction
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search attractions..."
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {/* Attractions */}
        <div className="p-5 border-b">
          <h2 className="font-bold text-slate-800 mb-3">
            Attractions (
            {
              filteredAttractions.length
            }
            )
          </h2>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredAttractions.map(
              (place) => (
                <button
                  key={
                    place.objectId
                  }
                  onClick={() =>
                    addStop(place)
                  }
                  className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left hover:bg-orange-50 hover:border-orange-300"
                >
                  <p className="font-semibold text-sm">
                    {place.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {place.category}
                  </p>
                </button>
              )
            )}
          </div>
        </div>

        {/* Selected Stops */}
        <div className="p-5 border-b">
          <h2 className="font-bold text-slate-800 mb-3">
            Selected Stops (
            {
              selectedStops.length
            }
            )
          </h2>

          {selectedStops.length ===
          0 ? (
            <p className="text-sm text-slate-400">
              No attractions
              selected.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedStops.map(
                (
                  stop,
                  index
                ) => (
                  <div
                    key={
                      stop.objectId
                    }
                    className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                  >
                    <p className="text-xs font-bold text-orange-600">
                      {index === 0
                        ? "🟢 START"
                        : index ===
                          selectedStops.length -
                            1
                        ? "🔴 DESTINATION"
                        : `🟠 STOP ${
                            index + 1
                          }`}
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {stop.name}
                    </p>

                    <button
                      onClick={() =>
                        removeStop(
                          stop.objectId
                        )
                      }
                      className="mt-2 text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Route Summary */}
        <div className="p-5 border-b">
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
            <p className="font-bold text-orange-900">
              Route Summary
            </p>

            <p className="text-sm text-orange-700 mt-2">
              Stops: {totalStops}
            </p>

            <p className="text-sm text-orange-700">
              Distance:{" "}
              {optimizationInfo
                ? optimizationInfo.distanceKm
                : "0"}{" "}
              km
            </p>

            <p className="text-sm text-orange-700">
              Duration:{" "}
              {optimizationInfo
                ? optimizationInfo.durationMin
                : "0"}{" "}
              min
            </p>

            <p className="text-sm text-orange-700">
              Status:{" "}
              {totalStops > 1
                ? "Ready"
                : "Waiting for stops"}
            </p>
          </div>
        </div>
       
      
        
        {/* Buttons */}
        <div className="p-5">

                   <button
  onClick={optimizeRoute}
  className="w-full mb-3 rounded-lg bg-orange-600 px-4 py-3 text-white font-semibold hover:bg-orange-700"
>
  Optimize Route
</button>
          <button
            onClick={clearRoute}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50"
          >
            Clear Route
          </button>

 
        </div>
      </aside>

      {/* Map */}
      <section className="min-h-0 h-full">

<RouteMap
  stops={selectedStops}
  routePath={routePath}
  currentLocation={currentLocation}
/>

         
      </section>
    </div>
  );
}
import { useEffect, useRef } from "react";

import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

function ArcGISMap({
  selectedCategories = [],
  selectedSubcounty = "All Subcounties",
  searchText = "",
  setResultCount,
  recommendations = [],
  onLayerReady,
}) {
  const mapDiv = useRef(null);
  const layerRef = useRef(null);
  const viewRef = useRef(null);
  const recommendLayerRef = useRef(null);

  // ── Create Map & View ────────────────────────────────────────────
  useEffect(() => {
    if (!mapDiv.current) return;

    const webmap = new WebMap({
      portalItem: {
        id: "937b4e8d66fc42bda0509eb3bbcd30e7",
      },
    });

    const view = new MapView({
      container: mapDiv.current,
      map: webmap,
    });

    viewRef.current = view;

    // GraphicsLayer for recommendation highlights — sits on top
    const recommendLayer = new GraphicsLayer({
      id: "recommend-highlights",
      title: "Recommendations",
    });
    webmap.add(recommendLayer);
    recommendLayerRef.current = recommendLayer;

    webmap.when(async () => {
      try {
        const groupLayer = webmap.layers.find(
          (layer) => layer.type === "group"
        );

        if (!groupLayer) {
          console.error("No group layer found in webmap.");
          return;
        }

        await groupLayer.load();

        if (!groupLayer.layers) {
          console.error("Group layer has no sublayers after load.");
          return;
        }

        const tourismLayer = groupLayer.layers.find(
          (layer) => layer.title === "Tourism Subcounty Final"
        );

        if (!tourismLayer) {
          console.error(
            "Tourism Subcounty Final layer not found. Available layers:",
            groupLayer.layers.map((l) => l.title)
          );
          return;
        }

        await tourismLayer.load();

        layerRef.current = tourismLayer;

        if (onLayerReady) {
          onLayerReady(tourismLayer);
        }
      } catch (err) {
        console.error("Error loading tourism layer:", err);
      }
    });

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply Map Filters ────────────────────────────────────────────
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const filters = [];

    if (selectedCategories.length > 0) {
      const cats = selectedCategories.map((cat) => `'${cat}'`).join(",");
      filters.push(`Final_Category IN (${cats})`);
    }

    if (selectedSubcounty && selectedSubcounty !== "All Subcounties") {
      const cleanSubcounty = selectedSubcounty.replace(" Sub County", "");
      filters.push(`subcounty LIKE '%${cleanSubcounty}%'`);
    }

    if (searchText.trim()) {
      filters.push(`Name LIKE '%${searchText.trim()}%'`);
    }

    const expression = filters.length > 0 ? filters.join(" AND ") : "1=1";

    layer.definitionExpression = expression;

    if (setResultCount) {
      layer
        .queryFeatureCount({ where: expression })
        .then((count) => setResultCount(count))
        .catch((err) => console.error("Count query failed:", err));
    }
  }, [selectedCategories, selectedSubcounty, searchText, setResultCount]);

  // ── Draw Recommendation Highlights + Auto-open Best Match Popup ──
  useEffect(() => {
    const rl = recommendLayerRef.current;
    const view = viewRef.current;
    if (!rl || !view) return;

    rl.removeAll();

    if (!recommendations || recommendations.length === 0) {
      // Close any open popup when results are cleared
      view.closePopup();
      return;
    }

    recommendations.forEach((place, index) => {
      if (!place.geometry) return;

      const isBest = index === 0;

      // ── Symbol ──────────────────────────────────────────────────
      // Best match: gold star pin using picture-marker SVG
      // Others: orange circle markers, shrinking by rank
      let symbol;

      if (isBest) {
        // Gold location-pin SVG for the #1 result
        const pinSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
            <!-- Pin body -->
            <ellipse cx="20" cy="18" rx="18" ry="18" fill="#EA580C" stroke="#ffffff" stroke-width="3"/>
            <!-- Star inside pin -->
            <text x="20" y="25" text-anchor="middle" font-size="18" fill="#ffffff">★</text>
            <!-- Pin tail -->
            <polygon points="20,52 8,30 32,30" fill="#EA580C"/>
            <polygon points="20,50 10,32 30,32" fill="#C2400A"/>
          </svg>
        `;
      const encoded =
  "data:image/svg+xml;base64," +
  btoa(unescape(encodeURIComponent(pinSvg)));

        symbol = {
          type: "picture-marker",
          url: encoded,
          width: "36px",
          height: "48px",
          yoffset: "24px", // lift so pin tail points to exact location
        };
      } else {
        // Smaller orange circles for results 2–5
        const size = index === 1 ? 18 : index === 2 ? 15 : 13;
        const alpha = index === 1 ? 0.9 : 0.75;
        symbol = {
          type: "simple-marker",
          color: [249, 115, 22, alpha],
          outline: { color: [255, 255, 255, 1], width: 2 },
          size,
        };
      }

      // ── Popup template ──────────────────────────────────────────
      const popupTemplate = {
        title: isBest
          ? `⭐ Best Match — {Name}`
          : `#{rank} — {Name}`,
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "Category",    label: "Category" },
              { fieldName: "Subcounty",   label: "Subcounty" },
              { fieldName: "Hours",       label: "Opening hours" },
              { fieldName: "Budget",      label: "Budget level" },
              { fieldName: "Entry",       label: "Entry" },
              { fieldName: "Age",         label: "Suitable age" },
              { fieldName: "Description", label: "About" },
              { fieldName: "Score",       label: "Match score" },
            ],
          },
        ],
        overwriteActions: true,
        actions: place.attributes?.Website
          ? [
              {
                title: "Visit Website",
                id: "visit-website",
                className: "esri-icon-link-external",
              },
            ]
          : [],
      };

      const graphic = new Graphic({
        geometry: place.geometry,
        symbol,
        attributes: {
          Name:        place.name,
          rank:        index + 1,
          Category:    place.attributes?.Final_Category    ?? "",
          Subcounty:   place.attributes?.subcounty         ?? "",
          Hours:       place.attributes?.Opening_Hours     ?? "",
          Budget:      place.attributes?.Budget_Level      ?? "",
          Entry:       place.attributes?.Entry_Category    ?? "",
          Age:         place.attributes?.Suitable_Age      ?? "",
          Description: place.attributes?.Description       ?? "",
          Website:     place.attributes?.Website           ?? "",
          Score:       `${place.score} / 52`,
        },
        popupTemplate,
      });

      rl.add(graphic);
    });

    // ── Handle website link action in popup ─────────────────────
    view.on("trigger-action", (event) => {
      if (event.action.id === "visit-website") {
        const website = view.popup.selectedFeature?.attributes?.Website;
        if (website) window.open(website, "_blank");
      }
    });

    // ── Zoom to all recommendations ──────────────────────────────
    const geometries = recommendations.map((r) => r.geometry).filter(Boolean);

    view
      .goTo(
        { target: geometries },
        { duration: 1000, easing: "ease-in-out" }
      )
      .then(() => {
        // After zoom, auto-open popup on the best match (index 0)
        const bestMatch = rl.graphics.getItemAt(0);
        if (bestMatch && bestMatch.geometry) {
          view.openPopup({
            features: [bestMatch],
            location: bestMatch.geometry,
          });
        }
      })
      .catch((err) => console.warn("goTo failed:", err));

  }, [recommendations]);

  return (
    <div
      ref={mapDiv}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default ArcGISMap;
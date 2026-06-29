import { useEffect, useRef, useState } from "react";

import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// Layer 28 on the ArtGeo_Event_Promotion_Zones service — Nairobi subcounty
// polygons with Score / MatchScore / BudgetPct fields already computed and
// styled in ArcGIS Pro (classBreaks renderer on `Score`, green ramp).
const ZONES_LAYER_URL =
  "https://services3.arcgis.com/gxbknrbmAvhTSik7/arcgis/rest/services/ArtGeo_Event_Promotion_Zones/FeatureServer/28";

export default function EventPromotionMap() {
  const mapDiv = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    let view;
    let cancelled = false;

    async function init() {
      try {
        const zonesLayer = new FeatureLayer({
          url: ZONES_LAYER_URL,
          // No renderer override here on purpose — the layer's own
          // classBreaks renderer (built in ArcGIS Pro on the `Score`
          // field) is the styling we want to reproduce as-is.
          outFields: ["subcounty", "Score", "MatchScore", "BudgetPct"],
          popupTemplate: {
            title: "{subcounty}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "Score", label: "Suitability score" },
                  { fieldName: "MatchScore", label: "Match score" },
                  { fieldName: "BudgetPct", label: "Budget allocation (%)" },
                ],
              },
            ],
          },
        });

        const map = new Map({
          basemap: "gray-vector",
          layers: [zonesLayer],
        });

        view = new MapView({
          container: mapDiv.current,
          map,
          center: [36.8219, -1.2921], // Nairobi
          zoom: 10,
        });

        await view.when();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("EventPromotionMap failed to load:", err);
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (view) view.destroy();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {status === "error" && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: "rgba(255,255,255,0.9)",
            fontSize: "0.75rem", color: "#b91c1c", textAlign: "center", padding: "1rem",
          }}
        >
          Could not load the ArtGeo_Event_Promotion_Zones map layer.
          Check the layer URL and your network connection.
        </div>
      )}
    </div>
  );
}
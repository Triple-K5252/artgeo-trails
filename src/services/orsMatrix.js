import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

const API_KEY = import.meta.env.VITE_ORS_API_KEY;

export async function getTravelMatrix(stops) {
 const locations = stops.map((stop) => {
  // Current location
  if (
    stop.geometry?.longitude &&
    stop.geometry?.latitude
  ) {
    return [
      stop.geometry.longitude,
      stop.geometry.latitude,
    ];
  }

  // ArcGIS attractions
  const point =
    webMercatorUtils.webMercatorToGeographic(
      stop.geometry
    );

  return [
    point.longitude,
    point.latitude,
  ];
});

  const response = await fetch(
    "https://api.openrouteservice.org/v2/matrix/driving-car",
    {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locations,
        metrics: ["duration"],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
  }

  return response.json();
}
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

const API_KEY = import.meta.env.VITE_ORS_API_KEY;
console.log("ORS KEY:", API_KEY);

export async function getORSRoute(stops) {
  if (stops.length < 2) return null;

  const coordinates = stops.map((stop) => {
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
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}
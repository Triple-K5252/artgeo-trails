import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

const API_KEY = import.meta.env.VITE_ORS_API_KEY;

export async function getTravelMatrix(stops) {
  const locations = stops.map((stop) => {
    const geometry = stop.geometry;

    // Geometries already in geographic coordinates (e.g. wkid 4326,
    // such as the user's current GPS location) pass through unchanged —
    // converting them again would corrupt the values.
    const isGeographic =
      geometry?.spatialReference?.wkid === 4326 ||
      geometry?.spatialReference?.isGeographic;

    const point = isGeographic
      ? geometry
      : webMercatorUtils.webMercatorToGeographic(geometry);

    return [point.longitude, point.latitude];
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
    throw new Error(await response.text());
  }

  return response.json();
}
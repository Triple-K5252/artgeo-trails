import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

const API_KEY = import.meta.env.VITE_ORS_API_KEY;

export async function getORSRoute(stops, profile = "driving-car") {
  if (stops.length < 2) return null;

  const coordinates = stops.map((stop) => {
    const geometry = stop.geometry;

    // Geometries already in geographic coordinates (e.g. wkid 4326,
    // such as the user's current GPS location) should pass through
    // unchanged — converting them again would corrupt the values.
    const isGeographic =
      geometry?.spatialReference?.wkid === 4326 ||
      geometry?.spatialReference?.isGeographic;

    const point = isGeographic
      ? geometry
      : webMercatorUtils.webMercatorToGeographic(geometry);

    return [point.longitude, point.latitude];
  });

  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        instructions: true,
        instructions_format: "text",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}
// Haversine distance between two [lng, lat] points, in meters.
function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

// Returns the shortest distance (meters) from a point to any segment
// of a route path (array of [lng, lat] coordinates).
export function distanceToRoute(point, routePath) {
  if (!routePath || routePath.length === 0) return Infinity;

  let minDist = Infinity;

  for (let i = 0; i < routePath.length; i++) {
    const dist = haversineMeters(point, routePath[i]);
    if (dist < minDist) minDist = dist;
  }

  return minDist;
}

export { haversineMeters };

// ── Turn-by-turn helpers ──────────────────────────────────────────
//
// ORS returns route.properties.segments[].steps[], where each step has:
//   - instruction: text like "Turn left onto Example Rd"
//   - distance: meters for this step
//   - duration: seconds for this step
//   - way_points: [startIndex, endIndex] into route.geometry.coordinates
//
// We flatten all segments' steps into one ordered list (multi-stop
// routes have one segment per leg) and figure out which step the user
// is currently on by finding the step whose coordinate range contains
// the closest point to the user.

// Flattens ORS segments into a single ordered steps array, each step
// annotated with the actual [lng, lat] coordinate it starts at.
export function flattenSteps(routeFeature) {
  const segments = routeFeature?.properties?.segments ?? [];
  const coordinates = routeFeature?.geometry?.coordinates ?? [];

  const steps = [];

  segments.forEach((segment) => {
    (segment.steps ?? []).forEach((step) => {
      const [startIdx] = step.way_points ?? [0, 0];
      steps.push({
        ...step,
        startCoord: coordinates[startIdx] ?? null,
      });
    });
  });

  return steps;
}

// Given the user's current [lng, lat] and the flattened steps list,
// returns the index of the step the user should currently be following.
// Walks forward from the previous index so we never jump backwards.
export function getCurrentStepIndex(point, steps, previousIndex = 0) {
  if (!steps || steps.length === 0) return 0;

  let bestIndex = previousIndex;
  let bestDist = Infinity;

  for (let i = previousIndex; i < steps.length; i++) {
    const coord = steps[i].startCoord;
    if (!coord) continue;

    const dist = haversineMeters(point, coord);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
}
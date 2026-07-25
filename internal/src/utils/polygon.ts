import type { LatLng } from "../types/index.ts";

/**
 * Ray-casting point-in-polygon test.
 * polygon is an array of [lat, lng] pairs, treated as a closed ring
 * (no need to repeat the first point at the end).
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [pLat, pLng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [iLat, iLng] = polygon[i]!;
    const [jLat, jLng] = polygon[j]!;

    const intersects =
      iLng > pLng !== jLng > pLng &&
      pLat < ((jLat - iLat) * (pLng - iLng)) / (jLng - iLng) + iLat;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Legacy-style radius check (haversine distance vs a fixed radius),
 * kept around so it can run side by side with the polygon check
 * during a city's "shadow" rollout phase.
 */
export function isPointInRadius(
  point: LatLng,
  center: LatLng,
  radiusKm: number,
): boolean {
  const R = 6371; // Earth radius in km
  const [lat1, lng1] = point;
  const [lat2, lng2] = center;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const distanceKm = 2 * R * Math.asin(Math.sqrt(a));

  return distanceKm <= radiusKm;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

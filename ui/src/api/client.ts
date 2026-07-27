import type {
  City,
  DeliveryCheckResult,
  LatLng,
  Zone,
} from "../types/index.js";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listCities: (): Promise<City[]> =>
    fetch(`${BASE}/cities`).then((r) => json(r)),

  getZonesForCity: (cityId: number): Promise<Zone[]> =>
    fetch(`${BASE}/zones/city/${cityId}`).then((r) => json(r)),

  createZone: (
    cityId: number,
    name: string,
    polygon: LatLng[],
  ): Promise<Zone> =>
    fetch(`${BASE}/zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city_id: cityId, name, polygon }),
    }).then((r) => json(r)),

  runDeliveryCheck: (
    cityId: number,
    lat: number,
    lng: number,
  ): Promise<DeliveryCheckResult> =>
    fetch(`${BASE}/delivery-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city_id: cityId, lat, lng }),
    }).then((r) => json(r)),
};

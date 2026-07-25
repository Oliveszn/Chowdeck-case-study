import * as zoneModel from "../models/zoneModel";
import type { LatLng, ZoneException } from "../types/index.js";

export async function createZone(
  cityId: number,
  name: string | null,
  polygon: LatLng[],
) {
  const id = await zoneModel.createZone(cityId, name, polygon);
  return { id, cityId, name, polygon };
}

export async function getActiveZonesForCity(cityId: number) {
  return zoneModel.getActiveZonesForCity(cityId);
}

export async function addException(
  zoneId: number,
  reason: ZoneException["reason"],
  geometry: LatLng[] | null,
  startsAt: Date,
  endsAt: Date | null,
) {
  const id = await zoneModel.createZoneException(
    zoneId,
    reason,
    geometry,
    startsAt,
    endsAt,
  );
  return { id, zoneId, reason, geometry, startsAt, endsAt };
}

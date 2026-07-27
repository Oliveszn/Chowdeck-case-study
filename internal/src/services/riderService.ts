import * as riderModel from "../models/riderModel";
import * as zoneEventModel from "../models/zoneEventModel";
import * as zoneModel from "../models/zoneModel";
import { isPointInPolygon } from "../utils/polygon";
import type { LatLng, ZoneEvent } from "../types/index";

export interface RecordLocationResult {
  currentZoneIds: number[];
  events: ZoneEvent[];
}

/**
 * Records a new rider location and detects zone entry/exit by comparing
 * zone membership at the new point against membership at the rider's
 * previous recorded point. This intentionally ignores zone_exceptions
 * (rain, etc.) — entry/exit is about physical geography, not whether
 * the zone is currently deliverable.
 */
export async function recordLocation(
  riderId: number,
  cityId: number,
  point: LatLng,
): Promise<RecordLocationResult> {
  const previous = await riderModel.getLastLocation(riderId);
  const zones = await zoneModel.getActiveZonesForCity(cityId);

  const currentZoneIds = zones
    .filter((zone) => isPointInPolygon(point, zone.polygon))
    .map((zone) => zone.id);

  const previousZoneIds = previous
    ? zones
        .filter((zone) =>
          isPointInPolygon([previous.lat, previous.lng], zone.polygon),
        )
        .map((zone) => zone.id)
    : [];

  const entered = currentZoneIds.filter((id) => !previousZoneIds.includes(id));
  const exited = previousZoneIds.filter((id) => !currentZoneIds.includes(id));

  await riderModel.saveLocation(riderId, point[0], point[1]);

  const events: ZoneEvent[] = [];

  for (const zoneId of entered) {
    const id = await zoneEventModel.createEvent(riderId, zoneId, "enter");
    events.push({
      id,
      rider_id: riderId,
      zone_id: zoneId,
      event_type: "enter",
      occurred_at: new Date(),
    });
  }

  for (const zoneId of exited) {
    const id = await zoneEventModel.createEvent(riderId, zoneId, "exit");
    events.push({
      id,
      rider_id: riderId,
      zone_id: zoneId,
      event_type: "exit",
      occurred_at: new Date(),
    });
  }

  return { currentZoneIds, events };
}

export async function getEventsForRider(riderId: number) {
  return zoneEventModel.getEventsForRider(riderId);
}

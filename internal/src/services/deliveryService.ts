import { AppError } from "../middleware/errorHandler.js";
import * as cityModel from "../models/cityModel";
import * as zoneModel from "../models/zoneModel";
import * as checkModel from "../models/deliveryCheckModel";
import { isPointInPolygon, isPointInRadius } from "../utils/polygon.js";
import type { DecisionSource, LatLng } from "../types/index.js";

interface DeliveryCheckResult {
  deliverable: boolean;
  decisionSource: DecisionSource;
  radiusResult: boolean;
  polygonResult: boolean | null;
}

/**
 * Runs the legacy radius check, the new polygon check, or both,
 * depending on the city's current rollout_status. Every call is logged
 * so /cities/:id/mismatch-rate can report real numbers.
 */
export async function runDeliveryCheck(
  cityId: number,
  point: LatLng,
): Promise<DeliveryCheckResult> {
  const city = await cityModel.getCityById(cityId);
  if (!city) throw new AppError("City not found", 404, "CITY_NOT_FOUND");

  const legacyConfig = await cityModel.getLegacyConfig(cityId);
  const radiusResult = legacyConfig
    ? isPointInRadius(
        point,
        [legacyConfig.center_lat, legacyConfig.center_lng],
        legacyConfig.radius_km,
      )
    : false;

  let polygonResult: boolean | null = null;
  if (city.rollout_status !== "radius_only") {
    polygonResult = await checkAgainstPolygons(cityId, point);
  }

  const decisionSource: DecisionSource =
    city.rollout_status === "polygon_only" ? "polygon" : "radius";

  const finalDecision =
    decisionSource === "polygon" ? polygonResult! : radiusResult;

  await checkModel.logDeliveryCheck({
    city_id: cityId,
    lat: point[0],
    lng: point[1],
    radius_result: radiusResult,
    polygon_result: polygonResult,
    final_decision: finalDecision,
    decision_source: decisionSource,
  });

  return {
    deliverable: finalDecision,
    decisionSource,
    radiusResult,
    polygonResult,
  };
}

async function checkAgainstPolygons(
  cityId: number,
  point: LatLng,
): Promise<boolean> {
  const zones = await zoneModel.getActiveZonesForCity(cityId);

  for (const zone of zones) {
    if (!isPointInPolygon(point, zone.polygon)) continue;

    // Point falls inside this zone's polygon — now check whether an
    // active exception (rain, rider shortage, etc.) carves it back out.
    const exceptions = await zoneModel.getActiveExceptionsForZone(zone.id);
    const excluded = exceptions.some(
      (ex) => ex.geometry === null || isPointInPolygon(point, ex.geometry),
    );

    if (!excluded) return true;
  }

  return false;
}

export async function getMismatchRate(cityId: number) {
  return checkModel.getMismatchRate(cityId);
}

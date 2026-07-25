import { AppError } from "../middleware/errorHandler.js";
import * as cityModel from "../models/cityModel";
import type { RolloutStatus } from "../types/index.js";

const VALID_TRANSITIONS: Record<RolloutStatus, RolloutStatus[]> = {
  radius_only: ["shadow"],
  shadow: ["polygon_only", "radius_only"], // allow rolling back out of shadow
  polygon_only: ["shadow"], // allow dropping back to shadow if something looks wrong
};

export async function createCity(name: string) {
  const id = await cityModel.createCity(name);
  return cityModel.getCityById(id);
}

export async function listCities() {
  return cityModel.listCities();
}

export async function updateRolloutStatus(cityId: number, next: RolloutStatus) {
  const city = await cityModel.getCityById(cityId);
  if (!city) throw new AppError("City not found", 404, "CITY_NOT_FOUND");

  const allowed = VALID_TRANSITIONS[city.rollout_status];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Cannot move city from ${city.rollout_status} to ${next}`,
      400,
      "INVALID_ROLLOUT_TRANSITION",
    );
  }

  await cityModel.updateRolloutStatus(cityId, next);
  return cityModel.getCityById(cityId);
}

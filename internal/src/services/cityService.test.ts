import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { City, RolloutStatus } from "../types/index.js";

// A real, in-memory fake for the city model — not a mock recorder.
// It behaves like the real thing (state persists across calls within a
// test) but with no database involved.
function createFakeCityModel() {
  const cities = new Map<number, City>();

  return {
    cities,
    async createCity(name: string) {
      const id = cities.size + 1;
      cities.set(id, {
        id,
        name,
        rollout_status: "radius_only",
        created_at: new Date(),
      });
      return id;
    },
    async getCityById(id: number) {
      return cities.get(id) ?? null;
    },
    async listCities() {
      return [...cities.values()];
    },
    async updateRolloutStatus(id: number, status: RolloutStatus) {
      const city = cities.get(id);
      if (city) city.rollout_status = status;
    },
    async getLegacyConfig() {
      return null;
    },
  };
}

let fakeCityModel: ReturnType<typeof createFakeCityModel>;

beforeEach(() => {
  fakeCityModel = createFakeCityModel();
  mock.module("../models/cityModel", () => fakeCityModel);
});

describe("cities.service rollout transitions", () => {
  test("a new city starts as radius_only", async () => {
    const { createCity } = await import("./cityService");
    const city = await createCity("Lagos");
    expect(city?.rollout_status).toBe("radius_only");
  });

  test("radius_only can move to shadow", async () => {
    const { createCity, updateRolloutStatus } =
      await import("./cityService.js");
    const city = await createCity("Lagos");
    const updated = await updateRolloutStatus(city!.id, "shadow");
    expect(updated?.rollout_status).toBe("shadow");
  });

  test("radius_only cannot skip straight to polygon_only", async () => {
    const { createCity, updateRolloutStatus } = await import("./cityService");
    const city = await createCity("Lagos");
    await expect(updateRolloutStatus(city!.id, "polygon_only")).rejects.toThrow(
      /Cannot move city from radius_only to polygon_only/,
    );
  });

  test("shadow can move forward to polygon_only", async () => {
    const { createCity, updateRolloutStatus } = await import("./cityService");
    const city = await createCity("Lagos");
    await updateRolloutStatus(city!.id, "shadow");
    const updated = await updateRolloutStatus(city!.id, "polygon_only");
    expect(updated?.rollout_status).toBe("polygon_only");
  });

  test("shadow can roll back to radius_only", async () => {
    const { createCity, updateRolloutStatus } = await import("./cityService");
    const city = await createCity("Lagos");
    await updateRolloutStatus(city!.id, "shadow");
    const updated = await updateRolloutStatus(city!.id, "radius_only");
    expect(updated?.rollout_status).toBe("radius_only");
  });

  test("polygon_only cannot jump back to radius_only directly", async () => {
    const { createCity, updateRolloutStatus } = await import("./cityService");
    const city = await createCity("Lagos");
    await updateRolloutStatus(city!.id, "shadow");
    await updateRolloutStatus(city!.id, "polygon_only");
    await expect(updateRolloutStatus(city!.id, "radius_only")).rejects.toThrow(
      /Cannot move city from polygon_only to radius_only/,
    );
  });

  test("throws for a city that doesn't exist", async () => {
    const { updateRolloutStatus } = await import("./cityService");
    await expect(updateRolloutStatus(999, "shadow")).rejects.toThrow(
      /City not found/,
    );
  });
});

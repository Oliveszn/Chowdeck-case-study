import { describe, expect, test, mock, beforeEach } from "bun:test";
import type {
  City,
  DeliveryZone,
  LegacyRadiusConfig,
  RolloutStatus,
  ZoneException,
} from "../types/index.js";

// A city center with a legacy radius that's deliberately a bit bigger
// than the polygon, so points near the edge disagree between the two
// systems — the exact scenario the mismatch-rate endpoint exists for.
const CENTER: [number, number] = [0, 0];
const LEGACY_CONFIG: LegacyRadiusConfig = {
  id: 1,
  city_id: 1,
  center_lat: CENTER[0],
  center_lng: CENTER[1],
  radius_km: 50,
};

const ZONE: DeliveryZone = {
  id: 1,
  city_id: 1,
  name: "Test Zone",
  is_active: true,
  polygon: [
    [-0.1, -0.1],
    [-0.1, 0.1],
    [0.1, 0.1],
    [0.1, -0.1],
  ],
};

const INSIDE_ZONE: [number, number] = [0, 0];
// Inside the legacy radius (50km is generous) but outside the small polygon.
const INSIDE_RADIUS_OUTSIDE_ZONE: [number, number] = [0.3, 0.3];

let currentCity: City;
const loggedChecks: any[] = [];

function makeCity(status: RolloutStatus): City {
  return {
    id: 1,
    name: "Test City",
    rollout_status: status,
    created_at: new Date(),
  };
}

beforeEach(() => {
  loggedChecks.length = 0;
  currentCity = makeCity("radius_only");

  mock.module("../models/cityModel", () => ({
    async getCityById() {
      return currentCity;
    },
    async getLegacyConfig() {
      return LEGACY_CONFIG;
    },
  }));

  mock.module("../models/zoneModel", () => ({
    async getActiveZonesForCity(): Promise<DeliveryZone[]> {
      return [ZONE];
    },
    async getActiveExceptionsForZone(): Promise<ZoneException[]> {
      return [];
    },
  }));

  mock.module("../models/deliveryCheckModel", () => ({
    async logDeliveryCheck(log: any) {
      loggedChecks.push(log);
      return loggedChecks.length;
    },
    async getMismatchRate() {
      const total = loggedChecks.length;
      const mismatches = loggedChecks.filter(
        (c) =>
          c.polygon_result !== null && c.radius_result !== c.polygon_result,
      ).length;
      return {
        total_checks: total,
        mismatches,
        mismatch_rate: total === 0 ? 0 : mismatches / total,
      };
    },
  }));
});

describe("deliveryCheck.service rollout behavior", () => {
  test("radius_only city never computes a polygon result", async () => {
    currentCity = makeCity("radius_only");
    const { runDeliveryCheck } = await import("./deliveryService");

    const result = await runDeliveryCheck(1, INSIDE_ZONE);

    expect(result.decisionSource).toBe("radius");
    expect(result.polygonResult).toBeNull();
    expect(result.deliverable).toBe(result.radiusResult);
  });

  test("shadow city computes both but still decides on radius", async () => {
    currentCity = makeCity("shadow");
    const { runDeliveryCheck } = await import("./deliveryService");

    const result = await runDeliveryCheck(1, INSIDE_RADIUS_OUTSIDE_ZONE);

    expect(result.decisionSource).toBe("radius");
    expect(result.radiusResult).toBe(true); // inside the generous legacy radius
    expect(result.polygonResult).toBe(false); // outside the small polygon
    expect(result.deliverable).toBe(true); // radius still wins in shadow mode
  });

  test("shadow mode logs a mismatch when radius and polygon disagree", async () => {
    currentCity = makeCity("shadow");
    const { runDeliveryCheck, getMismatchRate } =
      await import("./deliveryService");

    await runDeliveryCheck(1, INSIDE_RADIUS_OUTSIDE_ZONE); // disagreement
    await runDeliveryCheck(1, INSIDE_ZONE); // agreement (both true)

    const stats = await getMismatchRate(1);
    expect(stats.total_checks).toBe(2);
    expect(stats.mismatches).toBe(1);
    expect(stats.mismatch_rate).toBe(0.5);
  });

  test("polygon_only city decides on the polygon result", async () => {
    currentCity = makeCity("polygon_only");
    const { runDeliveryCheck } = await import("./deliveryService");

    const result = await runDeliveryCheck(1, INSIDE_RADIUS_OUTSIDE_ZONE);

    expect(result.decisionSource).toBe("polygon");
    expect(result.deliverable).toBe(false); // outside the polygon, so not deliverable
  });

  test("throws for a city that doesn't exist", async () => {
    mock.module("../models/city.model.js", () => ({
      async getCityById() {
        return null;
      },
      async getLegacyConfig() {
        return null;
      },
    }));
    const { runDeliveryCheck } = await import("./deliveryService");
    await expect(runDeliveryCheck(999, INSIDE_ZONE)).rejects.toThrow(
      /City not found/,
    );
  });
});

describe("deliveryCheck.service zone exceptions", () => {
  test("an active whole-zone exception excludes an otherwise-inside point", async () => {
    currentCity = makeCity("polygon_only");
    mock.module("../models/zone.model.js", () => ({
      async getActiveZonesForCity(): Promise<DeliveryZone[]> {
        return [ZONE];
      },
      async getActiveExceptionsForZone(): Promise<ZoneException[]> {
        return [
          {
            id: 1,
            zone_id: ZONE.id,
            reason: "weather",
            geometry: null, // null = applies to the whole zone
            starts_at: new Date(),
            ends_at: null,
          },
        ];
      },
    }));

    const { runDeliveryCheck } = await import("./deliveryService");
    const result = await runDeliveryCheck(1, INSIDE_ZONE);

    expect(result.polygonResult).toBe(false);
    expect(result.deliverable).toBe(false);
  });
});

import { describe, expect, test, mock, beforeEach } from "bun:test";
import type {
  DeliveryZone,
  LatLng,
  ZoneEvent,
  ZoneEventType,
} from "../types/index.js";

// Two non-overlapping square zones, easy to reason about by hand.
const ZONE_A: DeliveryZone = {
  id: 1,
  city_id: 1,
  name: "Zone A",
  is_active: true,
  polygon: [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
  ],
};

const ZONE_B: DeliveryZone = {
  id: 2,
  city_id: 1,
  name: "Zone B",
  is_active: true,
  polygon: [
    [20, 20],
    [20, 30],
    [30, 30],
    [30, 20],
  ],
};

const INSIDE_A: LatLng = [5, 5];
const INSIDE_B: LatLng = [25, 25];
const OUTSIDE_BOTH: LatLng = [100, 100];

function createFakeRiderModel() {
  const locations = new Map<number, LatLng>();
  return {
    async saveLocation(riderId: number, lat: number, lng: number) {
      locations.set(riderId, [lat, lng]);
      return 1;
    },
    async getLastLocation(riderId: number) {
      const loc = locations.get(riderId);
      if (!loc) return null;
      return {
        id: 1,
        rider_id: riderId,
        lat: loc[0],
        lng: loc[1],
        recorded_at: new Date(),
      };
    },
  };
}

function createFakeZoneModel() {
  return {
    async getActiveZonesForCity(): Promise<DeliveryZone[]> {
      return [ZONE_A, ZONE_B];
    },
  };
}

function createFakeZoneEventModel() {
  const events: ZoneEvent[] = [];
  return {
    events,
    async createEvent(
      riderId: number,
      zoneId: number,
      eventType: ZoneEventType,
    ) {
      const id = events.length + 1;
      events.push({
        id,
        rider_id: riderId,
        zone_id: zoneId,
        event_type: eventType,
        occurred_at: new Date(),
      });
      return id;
    },
    async getEventsForRider(riderId: number) {
      return events.filter((e) => e.rider_id === riderId);
    },
  };
}

let fakeRiderModel: ReturnType<typeof createFakeRiderModel>;
let fakeZoneEventModel: ReturnType<typeof createFakeZoneEventModel>;

beforeEach(() => {
  fakeRiderModel = createFakeRiderModel();
  fakeZoneEventModel = createFakeZoneEventModel();
  mock.module("../models/riderModel", () => fakeRiderModel);
  mock.module("../models/zoneModel", () => createFakeZoneModel());
  mock.module("../models/zoneEventModel", () => fakeZoneEventModel);
});

describe("riders.service entry/exit detection", () => {
  test("first ping inside a zone produces an enter event, no prior zones", async () => {
    const { recordLocation } = await import("./riderService");
    const result = await recordLocation(1, 1, INSIDE_A);

    expect(result.currentZoneIds).toEqual([ZONE_A.id]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      zone_id: ZONE_A.id,
      event_type: "enter",
    });
  });

  test("moving from one zone straight into another fires exit + enter", async () => {
    const { recordLocation } = await import("./riderService");
    await recordLocation(1, 1, INSIDE_A);
    const result = await recordLocation(1, 1, INSIDE_B);

    expect(result.currentZoneIds).toEqual([ZONE_B.id]);
    const types = result.events
      .map((e) => `${e.zone_id}:${e.event_type}`)
      .sort();
    expect(types).toEqual([`${ZONE_A.id}:exit`, `${ZONE_B.id}:enter`]);
  });

  test("moving from a zone to nowhere fires only an exit event", async () => {
    const { recordLocation } = await import("./riderService");
    await recordLocation(1, 1, INSIDE_A);
    const result = await recordLocation(1, 1, OUTSIDE_BOTH);

    expect(result.currentZoneIds).toEqual([]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      zone_id: ZONE_A.id,
      event_type: "exit",
    });
  });

  test("staying inside the same zone produces no events", async () => {
    const { recordLocation } = await import("./riderService");
    await recordLocation(1, 1, INSIDE_A);
    const result = await recordLocation(1, 1, [6, 6]); // still inside Zone A

    expect(result.currentZoneIds).toEqual([ZONE_A.id]);
    expect(result.events).toHaveLength(0);
  });

  test("different riders are tracked independently", async () => {
    const { recordLocation } = await import("./riderService");
    await recordLocation(1, 1, INSIDE_A);
    // Rider 2's first ping should be treated as having no prior zones,
    // even though rider 1 is currently inside Zone A.
    const result = await recordLocation(2, 1, OUTSIDE_BOTH);

    expect(result.events).toHaveLength(0);
  });
});

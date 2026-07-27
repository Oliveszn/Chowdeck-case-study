import { describe, expect, test } from "bun:test";
import { isPointInPolygon, isPointInRadius } from "./polygon.js";
import type { LatLng } from "../types/index.js";

// A simple 10x10 square, easy to reason about by hand.
const SQUARE: LatLng[] = [
  [0, 0],
  [0, 10],
  [10, 10],
  [10, 0],
];

describe("isPointInPolygon", () => {
  test("returns true for a point clearly inside the polygon", () => {
    expect(isPointInPolygon([5, 5], SQUARE)).toBe(true);
  });

  test("returns false for a point clearly outside the polygon", () => {
    expect(isPointInPolygon([20, 20], SQUARE)).toBe(false);
  });

  test("returns false for a point outside on only one axis", () => {
    expect(isPointInPolygon([5, 20], SQUARE)).toBe(false);
    expect(isPointInPolygon([20, 5], SQUARE)).toBe(false);
  });

  test("returns false for an empty polygon", () => {
    expect(isPointInPolygon([5, 5], [])).toBe(false);
  });

  test("handles a non-square, irregular polygon", () => {
    const triangle: LatLng[] = [
      [0, 0],
      [0, 10],
      [10, 0],
    ];
    // Inside the triangle (below the hypotenuse).
    expect(isPointInPolygon([2, 2], triangle)).toBe(true);
    // Outside the triangle (above the hypotenuse, still inside bounding box).
    expect(isPointInPolygon([8, 8], triangle)).toBe(false);
  });
});

describe("isPointInRadius", () => {
  const center: LatLng = [6.5244, 3.3792]; // Lagos

  test("returns true for a point at the center", () => {
    expect(isPointInRadius(center, center, 5)).toBe(true);
  });

  test("returns true for a point within the radius", () => {
    // Roughly 1km north of center.
    const nearby: LatLng = [6.534, 3.3792];
    expect(isPointInRadius(nearby, center, 5)).toBe(true);
  });

  test("returns false for a point well outside the radius", () => {
    // Abeokuta, roughly 80km from Lagos center.
    const farAway: LatLng = [7.1475, 3.3619];
    expect(isPointInRadius(farAway, center, 5)).toBe(false);
  });
});

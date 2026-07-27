import "dotenv/config";
import { pool } from "../config/db.js";

// Rough centers just demo/testing purposes, not surveyed data
const CITIES = [
  { name: "Lagos", center: [6.5244, 3.3792] as [number, number], radiusKm: 15 },
  { name: "Ogun", center: [7.1608, 3.3488] as [number, number], radiusKm: 25 },
  {
    name: "Abeokuta",
    center: [7.1475, 3.3619] as [number, number],
    radiusKm: 12,
  },
];

// an irregular polygon around the Lagos center so that some addresses near the old radius edge fall outside the new polygon (or vice versa)
const LAGOS_POLYGON: [number, number][] = [
  [6.605, 3.32],
  [6.6, 3.42],
  [6.55, 3.45],
  [6.48, 3.42],
  [6.44, 3.36],
  [6.47, 3.3],
  [6.53, 3.28],
];

async function seed() {
  console.log("Seeding cities...");

  for (const city of CITIES) {
    // Idempotentcy: clear out any existing row with the same name first
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM cities WHERE name = ?",
      [city.name],
    );

    let cityId: number;

    if (existing.length > 0) {
      cityId = existing[0].id;
      console.log(`  ${city.name} already exists (id=${cityId}), reusing it`);
    } else {
      const [result] = await pool.query<any>(
        "INSERT INTO cities (name) VALUES (?)",
        [city.name],
      );
      cityId = result.insertId;
      console.log(`  created ${city.name} (id=${cityId})`);
    }

    // Replace any existing legacy config for this city so re-running the seed script doesn't pile up duplicate rows
    await pool.query("DELETE FROM legacy_radius_configs WHERE city_id = ?", [
      cityId,
    ]);
    await pool.query(
      "INSERT INTO legacy_radius_configs (city_id, center_lat, center_lng, radius_km) VALUES (?, ?, ?, ?)",
      [cityId, city.center[0], city.center[1], city.radiusKm],
    );

    if (city.name === "Lagos") {
      // Put Lagos into shadow mode and give it a real polygon so both checks actually run and can be compared
      await pool.query(
        "UPDATE cities SET rollout_status = 'shadow' WHERE id = ?",
        [cityId],
      );

      const [existingZones] = await pool.query<any[]>(
        "SELECT id FROM delivery_zones WHERE city_id = ?",
        [cityId],
      );
      if (existingZones.length === 0) {
        await pool.query(
          "INSERT INTO delivery_zones (city_id, name, polygon) VALUES (?, ?, ?)",
          [cityId, "Lagos Mainland Coverage", JSON.stringify(LAGOS_POLYGON)],
        );
        console.log(
          "    added Lagos polygon zone, set rollout_status = shadow",
        );
      }
    }
  }

  console.log("Done.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

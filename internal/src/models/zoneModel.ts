import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { DeliveryZone, LatLng, ZoneException } from "../types/index";

export async function createZone(
  cityId: number,
  name: string | null,
  polygon: LatLng[],
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO delivery_zones (city_id, name, polygon) VALUES (?, ?, ?)",
    [cityId, name, JSON.stringify(polygon)],
  );
  return result.insertId;
}

export async function getActiveZonesForCity(
  cityId: number,
): Promise<DeliveryZone[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM delivery_zones WHERE city_id = ? AND is_active = true",
    [cityId],
  );
  return (rows as any[]).map((row) => ({
    ...row,
    polygon:
      typeof row.polygon === "string" ? JSON.parse(row.polygon) : row.polygon,
  })) as DeliveryZone[];
}

export async function createZoneException(
  zoneId: number,
  reason: ZoneException["reason"],
  geometry: LatLng[] | null,
  startsAt: Date,
  endsAt: Date | null,
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO zone_exceptions (zone_id, reason, geometry, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      zoneId,
      reason,
      geometry ? JSON.stringify(geometry) : null,
      startsAt,
      endsAt,
    ],
  );
  return result.insertId;
}

export async function getActiveExceptionsForZone(
  zoneId: number,
  at: Date = new Date(),
): Promise<ZoneException[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM zone_exceptions
     WHERE zone_id = ? AND starts_at <= ? AND (ends_at IS NULL OR ends_at >= ?)`,
    [zoneId, at, at],
  );
  return (rows as any[]).map((row) => ({
    ...row,
    geometry: row.geometry
      ? typeof row.geometry === "string"
        ? JSON.parse(row.geometry)
        : row.geometry
      : null,
  })) as ZoneException[];
}

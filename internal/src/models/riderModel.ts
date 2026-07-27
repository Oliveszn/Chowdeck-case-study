import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";
import type { RiderLocation } from "../types/index.js";

export async function saveLocation(
  riderId: number,
  lat: number,
  lng: number,
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO rider_locations (rider_id, lat, lng) VALUES (?, ?, ?)",
    [riderId, lat, lng],
  );
  return result.insertId;
}

/**
 * The location recorded immediately before this one used to diff zone
 * membership and figure out which zones were entered/exited.
 */
export async function getLastLocation(
  riderId: number,
): Promise<RiderLocation | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM rider_locations WHERE rider_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 1",
    [riderId],
  );
  return (rows[0] as RiderLocation) ?? null;
}

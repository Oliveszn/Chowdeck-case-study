import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";
import type { ZoneEvent, ZoneEventType } from "../types/index.js";

export async function createEvent(
  riderId: number,
  zoneId: number,
  eventType: ZoneEventType,
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO zone_events (rider_id, zone_id, event_type) VALUES (?, ?, ?)",
    [riderId, zoneId, eventType],
  );
  return result.insertId;
}

export async function getEventsForRider(
  riderId: number,
  limit = 50,
): Promise<ZoneEvent[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM zone_events
     WHERE rider_id = ?
     ORDER BY occurred_at DESC, id DESC
     LIMIT ?`,
    [riderId, limit],
  );
  return rows as ZoneEvent[];
}

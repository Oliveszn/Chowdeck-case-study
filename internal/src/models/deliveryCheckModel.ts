import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { DeliveryCheckLog } from "../types/index";

export async function logDeliveryCheck(log: DeliveryCheckLog): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO delivery_checks
      (city_id, lat, lng, radius_result, polygon_result, final_decision, decision_source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      log.city_id,
      log.lat,
      log.lng,
      log.radius_result,
      log.polygon_result,
      log.final_decision,
      log.decision_source,
    ],
  );
  return result.insertId;
}

export interface MismatchStats {
  total_checks: number;
  mismatches: number;
  mismatch_rate: number;
}

export async function getMismatchRate(cityId: number): Promise<MismatchStats> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total_checks,
       SUM(CASE WHEN radius_result != polygon_result THEN 1 ELSE 0 END) AS mismatches
     FROM delivery_checks
     WHERE city_id = ? AND polygon_result IS NOT NULL`,
    [cityId],
  );

  const row = rows[0] as { total_checks: number; mismatches: number };
  const total = Number(row?.total_checks ?? 0);
  const mismatches = Number(row?.mismatches ?? 0);

  return {
    total_checks: total,
    mismatches,
    mismatch_rate: total === 0 ? 0 : mismatches / total,
  };
}

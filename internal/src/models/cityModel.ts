import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import type { City, LegacyRadiusConfig, RolloutStatus } from "../types/index";

export async function createCity(name: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO cities (name) VALUES (?)",
    [name],
  );
  return result.insertId;
}

export async function getCityById(id: number): Promise<City | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM cities WHERE id = ?",
    [id],
  );
  return (rows[0] as City) ?? null;
}

export async function listCities(): Promise<City[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM cities");
  return rows as City[];
}

export async function updateRolloutStatus(
  id: number,
  status: RolloutStatus,
): Promise<void> {
  await pool.query("UPDATE cities SET rollout_status = ? WHERE id = ?", [
    status,
    id,
  ]);
}

export async function getLegacyConfig(
  cityId: number,
): Promise<LegacyRadiusConfig | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM legacy_radius_configs WHERE city_id = ? LIMIT 1",
    [cityId],
  );
  return (rows[0] as LegacyRadiusConfig) ?? null;
}

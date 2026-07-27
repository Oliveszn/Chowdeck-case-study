// import mysql from "mysql2/promise";

// export const pool = mysql.createPool({
//   host: process.env.DB_HOST ?? "localhost",
//   port: Number(process.env.DB_PORT ?? 3306),
//   user: process.env.DB_USER ?? "root",
//   password: process.env.DB_PASSWORD ?? "",
//   database: process.env.DB_NAME ?? "chowdeck_geofence",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    minVersion: "TLSv1.2",
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function assertDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

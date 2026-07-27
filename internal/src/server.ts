import "dotenv/config";
import { createApp } from "./app.js";
import { assertDbConnection } from "./config/db.js";

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  await assertDbConnection();
  console.log("Database connection OK");

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`chowdeck-geofence listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

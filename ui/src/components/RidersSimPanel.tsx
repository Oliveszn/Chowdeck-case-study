import { useState } from "react";
import { api } from "../api/client.js";
import type { LatLng } from "../types/index.js";

// Built for the seeded Lagos polygon
const DEMO_PATH: LatLng[] = [
  [6.4, 3.2],
  [6.45, 3.27],
  [6.5, 3.34],
  [6.53, 3.4],
  [6.58, 3.44],
  [6.65, 3.5],
];

const STEP_DELAY_MS = 900;
const DEMO_RIDER_ID = 1;

interface LogEntry {
  id: number;
  label: string;
  type: "enter" | "exit";
}

interface Props {
  cityId: number | null;
  onPositionUpdate: (pos: LatLng | null) => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function RiderSimPanel({ cityId, onPositionUpdate }: Props) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  async function runSimulation() {
    if (!cityId || running) return;
    setRunning(true);
    setLog([]);

    for (const point of DEMO_PATH) {
      onPositionUpdate(point);
      try {
        const result = await api.recordRiderLocation(
          DEMO_RIDER_ID,
          cityId,
          point[0],
          point[1],
        );
        if (result.events.length > 0) {
          setLog((prev) => [
            ...result.events.map((e) => ({
              id: e.id,
              label: `zone ${e.zone_id} — ${e.event_type}`,
              type: e.event_type,
            })),
            ...prev,
          ]);
        }
      } catch (err) {
        setLog((prev) => [
          { id: Date.now(), label: (err as Error).message, type: "exit" },
          ...prev,
        ]);
      }
      await sleep(STEP_DELAY_MS);
    }

    setRunning(false);
  }

  return (
    <div className="section">
      <label className="section-label">Rider entry/exit simulation</label>
      <button onClick={runSimulation} disabled={!cityId || running}>
        {running ? "Simulating..." : "Simulate rider walk"}
      </button>

      {log.length > 0 && (
        <div className="result-panel">
          {log.map((entry) => (
            <div
              key={entry.id}
              className={`result-row ${entry.type === "exit" ? "mismatch" : ""}`}
            >
              <span>{entry.type === "enter" ? "→ enter" : "→ exit"}</span>
              <span>{entry.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

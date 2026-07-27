import type { Zone } from "../types/index.js";

export function ZoneList({ zones }: { zones: Zone[] }) {
  return (
    <div className="section">
      <label className="section-label">Zones ({zones.length})</label>
      {zones.length === 0 ? (
        <div className="empty-state">No zones yet — draw one on the map.</div>
      ) : (
        <div className="zone-list">
          {zones.map((zone) => (
            <div key={zone.id} className="zone-item">
              <span>{zone.name ?? `Zone ${zone.id}`}</span>
              <span className="zone-item-points">
                {zone.polygon.length} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

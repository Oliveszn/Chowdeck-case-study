import { useEffect, useState } from "react";
import { api } from "./api/client";
import { CitySelector } from "./components/CitySelector";
import { RolloutBadge } from "./components/RolloutBadge";
import { MapView } from "./components/MapView";
import { TestAddressPanel } from "./components/TestAddressPanel";
import { ZoneList } from "./components/ZoneList";
import { RiderSimPanel } from "./components/RidersSimPanel";
import type { City, DeliveryCheckResult, LatLng, Zone } from "./types/index";

export default function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pendingPolygon, setPendingPolygon] = useState<LatLng[] | null>(null);
  const [zoneName, setZoneName] = useState("");

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [testMarker, setTestMarker] = useState<LatLng | null>(null);
  const [riderPosition, setRiderPosition] = useState<LatLng | null>(null);
  const [checkResult, setCheckResult] = useState<DeliveryCheckResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCities()
      .then(setCities)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (selectedCityId == null) return;
    api
      .getZonesForCity(selectedCityId)
      .then(setZones)
      .catch((e) => setError(e.message));
  }, [selectedCityId]);

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;

  function handleMapClick(clickedLat: number, clickedLng: number) {
    setLat(clickedLat.toFixed(6));
    setLng(clickedLng.toFixed(6));
    setTestMarker([clickedLat, clickedLng]);
    setCheckResult(null);
  }

  async function handleSaveZone() {
    if (!selectedCityId || !pendingPolygon) return;
    try {
      const zone = await api.createZone(
        selectedCityId,
        zoneName || `Zone ${zones.length + 1}`,
        pendingPolygon,
      );
      setZones((prev) => [...prev, zone]);
      setPendingPolygon(null);
      setZoneName("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleRunCheck() {
    if (!selectedCityId || !lat || !lng) return;
    try {
      const result = await api.runDeliveryCheck(
        selectedCityId,
        Number(lat),
        Number(lng),
      );
      setCheckResult(result);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-name">Chowdeck Geofence Ops</span>
          <span className="brand-sub">radius → polygon migration console</span>
        </div>

        <CitySelector
          cities={cities}
          selectedId={selectedCityId}
          onChange={(id) => {
            setSelectedCityId(id);
            setCheckResult(null);
            setTestMarker(null);
          }}
        />

        {selectedCity && (
          <div className="section">
            <label className="section-label">Rollout status</label>
            <RolloutBadge status={selectedCity.rollout_status} />
          </div>
        )}

        {pendingPolygon && (
          <div className="section">
            <label className="section-label">Save drawn polygon</label>
            <input
              placeholder="Zone name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
            />
            <button onClick={handleSaveZone} disabled={!selectedCityId}>
              Save zone ({pendingPolygon.length} pts)
            </button>
          </div>
        )}

        {selectedCity && (
          <TestAddressPanel
            lat={lat}
            lng={lng}
            onLatChange={setLat}
            onLngChange={setLng}
            onRunCheck={handleRunCheck}
            result={checkResult}
            disabled={!selectedCityId || !lat || !lng}
          />
        )}

        {selectedCity && <ZoneList zones={zones} />}

        {selectedCity && (
          <RiderSimPanel
            cityId={selectedCityId}
            onPositionUpdate={setRiderPosition}
          />
        )}

        {error && <div className="result-panel mismatch">{error}</div>}
      </aside>

      <MapView
        zones={zones}
        onPolygonDrawn={setPendingPolygon}
        onMapClick={handleMapClick}
        testMarker={testMarker}
        riderPosition={riderPosition}
      />
    </div>
  );
}

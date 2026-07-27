import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import type { LatLng, Zone } from "../types/index.js";

// Default view centered on Lagos, Nigeria
const DEFAULT_CENTER: LatLng = [6.5244, 3.3792];
const DEFAULT_ZOOM = 12;

interface Props {
  zones: Zone[];
  onPolygonDrawn: (polygon: LatLng[]) => void;
  onMapClick: (lat: number, lng: number) => void;
  testMarker: LatLng | null;
  riderPosition?: LatLng | null;
}

const riderIcon = L.divIcon({
  className: "rider-marker-icon",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#d97706;border:2px solid white;box-shadow:0 0 0 2px #d97706;"></div>',
  iconSize: [14, 14],
});

export function MapView({
  zones,
  onPolygonDrawn,
  onMapClick,
  testMarker,
  riderPosition,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  const testMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  // Initialize the map once
  useEffect(() => {
    const map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const zoneLayer = L.layerGroup().addTo(map);
    zoneLayerRef.current = zoneLayer;

    const drawnItems = new L.FeatureGroup().addTo(map);
    drawnLayerRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        // Only polygons are relevant here, disable everything else
        marker: false,
        circle: false,
        circlemarker: false,
        polyline: false,
        rectangle: false,
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer as L.Polygon;
      drawnItems.addLayer(layer);

      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const polygon: LatLng[] = latlngs.map((p) => [p.lat, p.lng]);
      onPolygonDrawn(polygon);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render saved zones whenever they change
  useEffect(() => {
    const layer = zoneLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const zone of zones) {
      L.polygon(
        zone.polygon.map(([lat, lng]) => [lat, lng] as [number, number]),
        { color: "#2563eb", weight: 2, fillOpacity: 0.08 },
      )
        .bindTooltip(zone.name ?? `Zone ${zone.id}`)
        .addTo(layer);
    }
  }, [zones]);

  // Show/update the test-address marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (testMarkerRef.current) {
      testMarkerRef.current.remove();
      testMarkerRef.current = null;
    }

    if (testMarker) {
      testMarkerRef.current = L.marker(testMarker, {
        title: "Test address",
      }).addTo(map);
    }
  }, [testMarker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!riderPosition) {
      riderMarkerRef.current?.remove();
      riderMarkerRef.current = null;
      return;
    }

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng(riderPosition);
    } else {
      riderMarkerRef.current = L.marker(riderPosition, {
        icon: riderIcon,
        title: "Simulated rider",
      }).addTo(map);
    }
  }, [riderPosition]);

  return (
    <div className="map-pane">
      <div id="map" />
      <div className="map-hint">
        Draw a polygon to define a zone · click anywhere to set a test address
      </div>
    </div>
  );
}

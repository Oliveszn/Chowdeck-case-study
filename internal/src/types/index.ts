export type LatLng = [number, number]; // [lat, lng]

export type RolloutStatus = "radius_only" | "shadow" | "polygon_only";

export interface City {
  id: number;
  name: string;
  rollout_status: RolloutStatus;
  created_at: Date;
}

export interface LegacyRadiusConfig {
  id: number;
  city_id: number;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

export interface DeliveryZone {
  id: number;
  city_id: number;
  name: string | null;
  polygon: LatLng[];
  is_active: boolean;
}

export type ExceptionReason = "weather" | "rider_shortage" | "time_restriction";

export interface ZoneException {
  id: number;
  zone_id: number;
  reason: ExceptionReason;
  geometry: LatLng[] | null; // null = applies to the whole zone
  starts_at: Date;
  ends_at: Date | null;
}

export type DecisionSource = "radius" | "polygon";

export interface DeliveryCheckLog {
  city_id: number;
  lat: number;
  lng: number;
  radius_result: boolean;
  polygon_result: boolean | null;
  final_decision: boolean;
  decision_source: DecisionSource;
}

export interface RiderLocation {
  id: number;
  rider_id: number;
  lat: number;
  lng: number;
  recorded_at: Date;
}

export type ZoneEventType = "enter" | "exit";

export interface ZoneEvent {
  id: number;
  rider_id: number;
  zone_id: number;
  event_type: ZoneEventType;
  occurred_at: Date;
}

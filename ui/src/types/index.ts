export type RolloutStatus = "radius_only" | "shadow" | "polygon_only";

export interface City {
  id: number;
  name: string;
  rollout_status: RolloutStatus;
}

export type LatLng = [number, number]; // [lat, lng]

export interface Zone {
  id: number;
  city_id: number;
  name: string | null;
  polygon: LatLng[];
  is_active: boolean;
}

export interface DeliveryCheckResult {
  deliverable: boolean;
  decisionSource: "radius" | "polygon";
  radiusResult: boolean;
  polygonResult: boolean | null;
}

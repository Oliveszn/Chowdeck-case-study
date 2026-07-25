import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as zonesService from "../services/zoneService";

const latLng = z.tuple([z.number(), z.number()]);

const createZoneSchema = z.object({
  city_id: z.number(),
  name: z.string().nullable().optional(),
  polygon: z.array(latLng).min(3), // a polygon needs at least 3 points
});

const createExceptionSchema = z.object({
  reason: z.enum(["weather", "rider_shortage", "time_restriction"]),
  geometry: z.array(latLng).nullable().optional(),
  starts_at: z.coerce.date(),
  ends_at: z.coerce.date().nullable().optional(),
});

export async function createZone(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { city_id, name, polygon } = createZoneSchema.parse(req.body);
    const zone = await zonesService.createZone(city_id, name ?? null, polygon);
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
}

export async function getActiveZonesForCity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cityId = Number(req.params.cityId);
    const zones = await zonesService.getActiveZonesForCity(cityId);
    res.json(zones);
  } catch (err) {
    next(err);
  }
}

export async function addException(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const zoneId = Number(req.params.zoneId);
    const { reason, geometry, starts_at, ends_at } =
      createExceptionSchema.parse(req.body);
    const exception = await zonesService.addException(
      zoneId,
      reason,
      geometry ?? null,
      starts_at,
      ends_at ?? null,
    );
    res.status(201).json(exception);
  } catch (err) {
    next(err);
  }
}

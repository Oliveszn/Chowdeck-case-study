import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as ridersService from "../services/riderService";

const locationSchema = z.object({
  city_id: z.number(),
  lat: z.number(),
  lng: z.number(),
});

export async function recordLocation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const riderId = Number(req.params.id);
    const { city_id, lat, lng } = locationSchema.parse(req.body);
    const result = await ridersService.recordLocation(riderId, city_id, [
      lat,
      lng,
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEvents(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const riderId = Number(req.params.id);
    const events = await ridersService.getEventsForRider(riderId);
    res.json(events);
  } catch (err) {
    next(err);
  }
}

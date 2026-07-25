import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as deliveryCheckService from "../services/deliveryService";

const checkSchema = z.object({
  city_id: z.number(),
  lat: z.number(),
  lng: z.number(),
});

export async function runCheck(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { city_id, lat, lng } = checkSchema.parse(req.body);
    const result = await deliveryCheckService.runDeliveryCheck(city_id, [
      lat,
      lng,
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function mismatchRate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cityId = Number(req.params.cityId);
    const stats = await deliveryCheckService.getMismatchRate(cityId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

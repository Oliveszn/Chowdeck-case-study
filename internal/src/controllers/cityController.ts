import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as citiesService from "../services/cityService";

const createCitySchema = z.object({
  name: z.string().min(1),
});

const rolloutStatusSchema = z.object({
  rollout_status: z.enum(["radius_only", "shadow", "polygon_only"]),
});

export async function createCity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name } = createCitySchema.parse(req.body);
    const city = await citiesService.createCity(name);
    res.status(201).json(city);
  } catch (err) {
    next(err);
  }
}

export async function listCities(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cities = await citiesService.listCities();
    res.json(cities);
  } catch (err) {
    next(err);
  }
}

export async function updateRolloutStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { rollout_status } = rolloutStatusSchema.parse(req.body);
    const cityId = Number(req.params.id);
    const city = await citiesService.updateRolloutStatus(
      cityId,
      rollout_status,
    );
    res.json(city);
  } catch (err) {
    next(err);
  }
}

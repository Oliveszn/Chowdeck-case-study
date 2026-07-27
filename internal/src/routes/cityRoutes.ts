import { Router } from "express";
import * as citiesController from "../controllers/cityController";

export const citiesRouter = Router();

citiesRouter.post("/", citiesController.createCity);
citiesRouter.get("/", citiesController.listCities);
citiesRouter.patch("/:id/rollout-status", citiesController.updateRolloutStatus);

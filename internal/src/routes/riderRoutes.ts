import { Router } from "express";
import * as ridersController from "../controllers/riderController";

export const ridersRouter = Router();

ridersRouter.post("/:id/location", ridersController.recordLocation);
ridersRouter.get("/:id/events", ridersController.getEvents);

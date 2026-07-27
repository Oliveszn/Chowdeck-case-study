import { Router } from "express";
import * as zonesController from "../controllers/zoneController";

export const zonesRouter = Router();

zonesRouter.post("/", zonesController.createZone);
zonesRouter.get("/city/:cityId", zonesController.getActiveZonesForCity);
zonesRouter.post("/:zoneId/exceptions", zonesController.addException);

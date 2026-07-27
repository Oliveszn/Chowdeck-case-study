import { Router } from "express";
import { citiesRouter } from "./cityRoutes";
import { zonesRouter } from "./zoneRoutes";
import { deliveryCheckRouter } from "./deliveryRoutes";
import { ridersRouter } from "./riderRoutes";

export const router = Router();

router.use("/cities", citiesRouter);
router.use("/zones", zonesRouter);
router.use("/delivery-check", deliveryCheckRouter);
router.use("/riders", ridersRouter);

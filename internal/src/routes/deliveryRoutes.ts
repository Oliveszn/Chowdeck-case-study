import { Router } from "express";
import * as deliveryCheckController from "../controllers/deliveryController";

export const deliveryCheckRouter = Router();

deliveryCheckRouter.post("/", deliveryCheckController.runCheck);
deliveryCheckRouter.get(
  "/mismatch-rate/:cityId",
  deliveryCheckController.mismatchRate,
);

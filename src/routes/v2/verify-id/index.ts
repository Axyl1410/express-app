import express, { Router } from "express";
import verifyIdMiddleware from "../../../middleware/verify-id.middleware";
import verifyPhoneMiddleware from "../../../middleware/verify-phone.middleware";
import { verifyIdAndPhoneService } from "./services/combined.service";
import { verifyIdService } from "./services/id.service";

const verifyIdRouter: Router = express.Router();

verifyIdRouter.get("/", (_req, res) => {
  res.json({ message: "please provide an ID" });
});

verifyIdRouter.get("/:id", verifyIdMiddleware, verifyIdService);

verifyIdRouter.get("/:id/lv2", (_req, res) => {
  res.json({ message: "please provide an phone" });
});

verifyIdRouter.get(
  "/:id/lv2/:phone",
  verifyIdMiddleware,
  verifyPhoneMiddleware,
  verifyIdAndPhoneService
);

export default verifyIdRouter;

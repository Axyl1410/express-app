import express, { type Request, type Response, type Router } from "express";
import { sendSuccess } from "@/lib/api-response-helper";
import AuthMiddleware from "@/middleware/auth.middleware";

const v1: Router = express.Router();

v1.get("/ping", (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      timestamp: new Date().toISOString(),
    },
    "pong"
  );
});

v1.get("/me", AuthMiddleware, (req, res) => {
  sendSuccess(res, { session: req.session }, "User session");
});

export default v1;

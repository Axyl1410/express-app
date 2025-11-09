import express, { type Request, type Response, type Router } from "express";
import { sendSuccess } from "@/lib/api-response-helper";

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

export default v1;

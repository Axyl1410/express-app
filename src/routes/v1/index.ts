import express, { type Request, type Response, type Router } from "express";
import { sendSuccess } from "@/lib/api-response-helper";
import AuthMiddleware from "@/middleware/auth.middleware";
import cartRouter from "./cart";
import productRouter from "./product";

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

// Product routes
v1.use("/products", productRouter);

// Cart routes
v1.use("/cart", cartRouter);

export default v1;

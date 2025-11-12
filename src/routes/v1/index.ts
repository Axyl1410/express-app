import express, { type Request, type Response, type Router } from "express";
import { asyncHandler, sendSuccess } from "@/lib/api-response-helper";
import { getCache, setCache } from "@/lib/cache.helper";
import prisma from "@/lib/prisma";
import AuthMiddleware from "@/middleware/auth.middleware";
import type { ProductType } from "@/types/product";
import cartRouter from "./cart";

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

v1.get(
  "/products",
  asyncHandler(async (_req: Request, res: Response) => {
    const cached = await getCache<ProductType[]>("products");

    if (cached) {
      sendSuccess(res, cached, "Products retrieved from cache");
      return;
    }

    const products: ProductType[] = await prisma.product.findMany();

    await setCache("products", products);

    sendSuccess(res, products, "Products retrieved from database");
  })
);

// Cart routes
v1.use("/cart", cartRouter);

export default v1;

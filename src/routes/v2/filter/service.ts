import type { Request, Response } from "express";

export const filterService = (req: Request, res: Response) => {
  const productId = req.query.productId;
  const cateId = req.query.cateId;

  res.json({ productId, cateId });
};

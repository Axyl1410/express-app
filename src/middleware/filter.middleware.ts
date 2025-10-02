import { NextFunction, Request, Response } from "express";

const filterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const productId = req.query.productId;
  const cateId = req.query.cateId;

  if (
    !isNaN(Number(productId)) ||
    (!isNaN(Number(cateId)) && Number(cateId) > 5 && Number(cateId) < 15)
  ) {
    return res.status(400).json({ message: "Bad Request" });
  }

  next();
};

export default filterMiddleware;

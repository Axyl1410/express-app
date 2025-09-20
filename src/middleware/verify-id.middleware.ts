import { NextFunction, Request, Response } from "express";

const verifyIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  if (id?.length !== 13) {
    res.status(400).json({ message: "ID must be 13 characters long" });
    return;
  }

  next();
};

export default verifyIdMiddleware;

import { NextFunction, Request, Response } from "express";

const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.query?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

export default userMiddleware;

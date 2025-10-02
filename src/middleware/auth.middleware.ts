import { NextFunction, Request, Response } from "express";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const username = "abc";
  const password = "123";

  if (req.query.username !== username || req.query.password !== password) {
    res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

export default authMiddleware;

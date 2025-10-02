import type { NextFunction, Request, Response } from "express";

const WorkMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const currentHour = new Date().getHours();
  if (req.path === "/work" && (currentHour < 8 || currentHour >= 17)) {
    return res
      .status(403)
      .json({ message: "Chỉ được truy cập /work từ 8h đến 17h" });
  }
  next();
};

export default WorkMiddleware;

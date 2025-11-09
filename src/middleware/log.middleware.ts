import logger from "@/lib/logger";
import type { NextFunction, Request, Response } from "express";

const logMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  logger.info(
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    },
    "Request received",
  );

  next();
};

export default logMiddleware;

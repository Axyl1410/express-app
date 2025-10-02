import type { NextFunction, Request, Response } from "express";

const logMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  console.log(`Request received at ${new Date().toISOString()}`);
  next();
};

export default logMiddleware;

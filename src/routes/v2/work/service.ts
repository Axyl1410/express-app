import { Request, Response } from "express";

export const getWorkService = (_req: Request, res: Response) => {
  res.json({ message: "Work service" });
};

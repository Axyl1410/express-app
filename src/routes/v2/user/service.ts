import { Request, Response } from "express";

export const getUserService = (_req: Request, res: Response) => {
  res.json({ message: "User service" });
};

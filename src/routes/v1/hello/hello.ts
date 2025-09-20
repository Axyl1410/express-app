import { Request, Response } from "express";

export const helloService = (_req: Request, res: Response) => {
  res.json({ message: "Hello, World!" });
};

import { Request, Response } from "express";

export const greetService = (req: Request, res: Response) => {
  const name = req.query.name?.toString().trim() || "Guest";

  res.json({ message: `Hello, ${name}!` });
};

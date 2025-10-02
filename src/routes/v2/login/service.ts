import type { Request, Response } from "express";

export const getLoginService = (req: Request, res: Response) => {
  const username = req.query.username;
  const password = req.query.password;

  res.json({ username, password });
};

import { Request, Response } from "express";

const isOdd = require("is-odd");

export const checkOddEven = (_req: Request, res: Response) => {
  const number = isOdd(2);

  res.json({ number });
};

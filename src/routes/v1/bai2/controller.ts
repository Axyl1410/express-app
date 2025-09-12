import { Request, Response } from "express";

const createIpsum = require("corporate-ipsum");

export const getLoremIpsum = (_req: Request, res: Response) => {
  const text = createIpsum();

  res.json({ text });
};

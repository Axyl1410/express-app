import { Request, Response } from "express";
import * as emoji from "node-emoji";

export const getEmoji = (_req: Request, res: Response) => {
  const coffee = emoji.emojify(":coffee:");

  res.json({ text: "coffee " + coffee });
};

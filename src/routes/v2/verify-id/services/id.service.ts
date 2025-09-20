import { Request, Response } from "express";

export const verifyIdService = (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `ID ${id} is valid`,
    id,
    level: 1,
  });
};

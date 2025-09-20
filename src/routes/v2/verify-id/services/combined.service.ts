import { Request, Response } from "express";

export const verifyIdAndPhoneService = (req: Request, res: Response) => {
  const { id, phone } = req.params;
  res.json({
    message: `ID ${id} and phone number ${phone} are valid`,
    id,
    phone,
    level: 2,
  });
};

import { Request, Response } from "express";

export const verifyPhoneService = (req: Request, res: Response) => {
  const { phone } = req.params;
  res.json({
    message: `Phone number ${phone} is valid`,
    phone,
    level: 1,
  });
};

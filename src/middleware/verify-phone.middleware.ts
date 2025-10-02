import { NextFunction, Request, Response } from "express";

const verifyPhoneMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const phone = req.params.phone;

  if (phone?.length !== 12 || !phone?.toString().startsWith("0")) {
    res.status(400).json({
      message: "Phone number must be 12 characters long and start with 0",
    });
  }

  next();
};

export default verifyPhoneMiddleware;

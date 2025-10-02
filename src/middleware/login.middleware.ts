import type { NextFunction, Request, Response } from "express";
import { patternPassword, patternUsername } from "../utils";

const LoginMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const username = req.query?.username;
  const password = req.query?.password;

  if (
    !patternUsername.test(String(username)) ||
    !patternPassword.test(String(password))
  ) {
    return res
      .status(400)
      .json({ message: "Invalid username or password format" });
  }

  next();
};

export default LoginMiddleware;

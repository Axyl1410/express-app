import type { NextFunction, Request, Response } from "express";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma-client";

const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["x-auth-token"];

  const session = await prisma.session.findFirst({
    where: {
      token: token as string,
    },
  });

  if (!session) {
    logger.warn(
      {
        path: req.path,
        method: req.method,
        ip: req.ip,
        hasToken: !!token,
      },
      "Unauthorized: Invalid or expired token",
    );
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }

  next();
};

export default AuthMiddleware;

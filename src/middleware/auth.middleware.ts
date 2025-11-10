import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "@/lib/auth";
import logger from "@/lib/logger";

const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      logger.warn(
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
        },
        "Unauthorized: Invalid or expired token"
      );

      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }

    // Attach session and user to request for downstream use
    req.session = session;
    req.user = session.user;

    next();
  } catch (error) {
    logger.error(
      {
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : String(error),
      },
      "Authentication error"
    );

    return res
      .status(500)
      .json({ message: "Internal server error during authentication" });
  }
};

export default AuthMiddleware;

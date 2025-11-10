import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { sendError } from "@/lib/api-response-helper";
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

      return sendError(res, "Unauthorized: Invalid or expired token", 401);
    }

    // Attach session and user to request for downstream use
    req.session = {
      session: session.session,
      user: session.user,
    };

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

    return sendError(res, "Internal server error during authentication", 500);
  }
};

export default AuthMiddleware;

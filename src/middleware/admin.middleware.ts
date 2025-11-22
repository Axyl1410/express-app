import type { NextFunction, Request, Response } from "express";
import { sendError } from "@/lib/api-response-helper";
import logger from "@/lib/logger";
import AuthMiddleware from "./auth.middleware";

/**
 * Admin Middleware
 * Requires user to be authenticated AND have admin role or be in adminUserIds
 * Uses AuthMiddleware first to ensure user is authenticated
 */
const AdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // First, ensure user is authenticated using AuthMiddleware
  // We call it manually to check auth, then check admin status
  return AuthMiddleware(req, res, () => {
    try {
      // At this point, user is authenticated (AuthMiddleware passed)
      // Now check if user is admin
      const user = req.session?.user;

      if (!user) {
        return sendError(res, "User session not found", 401);
      }

      // Check role
      const hasAdminRole = user.role === "admin";

      // Check if user ID is in adminUserIds from config
      // Note: Better Auth admin plugin stores adminUserIds in plugin config
      // For now, we'll check role primarily and allow env-based admin IDs
      const adminUserIds =
        process.env.ADMIN_USER_IDS?.split(",").filter(Boolean) ?? [];
      const isInAdminIds = adminUserIds.includes(user.id);

      const isAdmin = hasAdminRole || isInAdminIds;

      if (!isAdmin) {
        logger.warn(
          {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userId: user.id,
            userRole: user.role,
          },
          "Forbidden: Admin access required"
        );

        return sendError(res, "Forbidden: Admin access required", 403);
      }

      next();
    } catch (error) {
      logger.error(
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
          error: error instanceof Error ? error.message : String(error),
        },
        "Admin authentication error"
      );

      return sendError(res, "Internal server error during authentication", 500);
    }
  });
};

export default AdminMiddleware;

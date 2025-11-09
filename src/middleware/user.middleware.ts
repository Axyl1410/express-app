import type { NextFunction, Request, Response } from "express";

// Validation middleware for user creation
export const validateUserCreate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      message: "Name is required and must be a non-empty string",
    });
  }

  if (!email || email.trim().length === 0) {
    return res.status(400).json({
      message: "Email is required and must be a non-empty string",
    });
  }

  if (phone !== undefined && phone.trim().length === 0) {
    return res.status(400).json({
      message: "Phone must be a non-empty string if provided",
    });
  }

  next();
};

// Validation middleware for user update
export const validateUserUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, phone } = req.body;

  if (name !== undefined && name.trim().length === 0) {
    return res.status(400).json({
      message: "Name must be a non-empty string",
    });
  }

  if (email !== undefined && (typeof email !== "string" || email.trim().length === 0)) {
      return res.status(400).json({
        message: "Email must be a non-empty string",
      });
    }

  if (
    phone !== undefined &&
    (typeof phone !== "string" || phone.trim().length === 0)
  ) {
    return res.status(400).json({
      message: "Phone must be a non-empty string if provided",
    });
  }

  next();
};

import type { NextFunction, Request, Response } from "express";

export const validateTodoCreate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { task, dueDate, status } = req.body;

  if (!task || typeof task !== "string" || task.trim().length === 0) {
    return res.status(400).json({
      message: "Task is required and must be a non-empty string",
    });
  }

  if (!dueDate) {
    return res.status(400).json({
      message: "Due date is required and must be a string",
    });
  }

  if (typeof status !== "boolean") {
    return res.status(400).json({
      message: "Status is required and must be a boolean",
    });
  }

  next();
};

// Validation middleware for todo update
export const validateTodoUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { task, dueDate, status } = req.body;

  if (task !== undefined && task.trim().length === 0) {
    return res.status(400).json({
      message: "Task must be a non-empty string",
    });
  }

  if (dueDate !== undefined) {
    return res.status(400).json({
      message: "Due date must be a string",
    });
  }

  if (status !== undefined && typeof status !== "boolean") {
    return res.status(400).json({
      message: "Status must be a boolean",
    });
  }

  next();
};

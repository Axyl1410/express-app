import {
  sendError,
  sendErrorFromException,
  sendSuccess,
  sendSuccessNoData,
} from "@/lib/api-response-helper";
import logger from "@/lib/logger";
import AuthMiddleware from "@/middleware/auth.middleware";
import type { UserInterface } from "@/types/user";
import express, { type Request, type Response, type Router } from "express";
import { deleteUser, getUsers, updateUser } from "./service";

const userRouter: Router = express.Router();

function handleUserError(
  error: unknown,
  res: Response,
  userId: string,
  email?: string,
): void {
  if (error instanceof Error) {
    if (error.message === "User not found") {
      logger.warn({ userId }, "User not found");
      sendError(res, error.message, 404);
      return;
    }
    if (error.message === "Email already exists") {
      logger.warn({ userId, email }, "Email already exists");
      sendError(res, error.message, 400);
      return;
    }
  }
  logger.error({ error, userId }, "Error processing user request");
  sendErrorFromException(res, error instanceof Error ? error : String(error), 500);
}

userRouter.get("/", AuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await getUsers();
    sendSuccess(res, users, "Users retrieved successfully");
  } catch (error) {
    logger.error(error);
    sendErrorFromException(res, error instanceof Error ? error : String(error), 500);
  }
});

userRouter.put("/:id", AuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { name, email, phone, password } = req.body;

    const updateData: Partial<Omit<UserInterface, "id" | "active">> = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }
    if (password !== undefined) {
      updateData.password = password;
    }

    const updatedUser = await updateUser(id, updateData);

    sendSuccess(res, updatedUser, "User updated successfully");
  } catch (error) {
    handleUserError(error, res, id, req.body.email);
  }
});

userRouter.delete(
  "/:id",
  AuthMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await deleteUser(id);

      sendSuccessNoData(res, "User deactivated successfully");
    } catch (error) {
      handleUserError(error, res, id);
    }
  }
);

export default userRouter;

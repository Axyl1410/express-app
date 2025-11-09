import express, { type Request, type Response, type Router } from "express";
import logger from "@/lib/logger";
import AuthMiddleware from "@/middleware/auth.middleware";
import type { UserInterface } from "@/types/user";
import { deleteUser, getUsers, updateUser } from "./service";

const userRouter: Router = express.Router();

userRouter.get("/", AuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
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

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        logger.warn({ userId: id }, "User not found");
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Email already exists") {
        logger.warn({ userId: id, email: req.body.email }, "Email already exists");
        return res.status(400).json({ message: error.message });
      }
    }
    logger.error({ error, userId: id }, "Error updating user");
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.delete(
  "/:id",
  AuthMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await deleteUser(id);

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        logger.warn({ userId: id }, "User not found");
        return res.status(404).json({ message: error.message });
      }
      logger.error({ error, userId: id }, "Error deleting user");
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default userRouter;

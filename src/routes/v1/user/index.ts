import logger from "@/lib/logger";
import AuthMiddleware from "@/middleware/auth.middleware";
import type { UserInterface } from "@/types/user";
import express, { type Request, type Response, type Router } from "express";
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
  try {
    const { id } = req.params;
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
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Email already exists") {
        return res.status(400).json({ message: error.message });
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.delete(
  "/:id",
  AuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await deleteUser(id);

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default userRouter;

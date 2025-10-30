import express, { type Request, type Response, type Router } from "express";
import {
  validateUserCreate,
  validateUserUpdate,
} from "../../../middleware/user.middleware";
import type { UserInterface } from "../../../types/user";

const userRouter: Router = express.Router();

const users: UserInterface[] = [];

userRouter.get("/", (_req: Request, res: Response) => {
  res.json({ users });
});

userRouter.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find((user) => user.id === id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user });
});

userRouter.post("/", validateUserCreate, (req: Request, res: Response) => {
  const { name, email, phone } = req.body;
  const newUser: UserInterface = {
    id: crypto.randomUUID(),
    name,
    email,
    phone,
  };
  users.push(newUser);
  res.status(201).json({ message: "User created", user: newUser });
});

userRouter.put("/:id", validateUserUpdate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  const user = users.find((user) => user.id === id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;

  res.json({ message: "User updated", user });
});

userRouter.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find((user) => user.id === id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  users.splice(users.indexOf(user), 1);
  res.json({ message: "User deleted", user });
});

export default userRouter;

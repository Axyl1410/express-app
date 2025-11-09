import { randomUUID } from "node:crypto";
import express, { type Request, type Response, type Router } from "express";
import logger from "@/lib/logger";
import prisma from "@/prisma-client";
import userRouter from "./user";

const v1: Router = express.Router();

v1.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Hello, World!" });
});

v1.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findFirst({
      where: { email },
    });

    if (userExists) {
      logger.warn({ email }, "Registration attempt with existing email");
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
      data: { name, email, password },
    });

    if (user) {
      logger.info({ userId: user.id, email }, "User registered successfully");
      res.json({ message: "User created successfully" });
    } else {
      logger.error({ email }, "Failed to create user");
      return res.status(400).json({ message: "Failed to create user" });
    }
  } catch (error) {
    logger.error({ error, email: req.body.email }, "Error during registration");
    res.status(500).json({ message: "Internal server error" });
  }
});

v1.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (!userExists) {
      logger.warn({ email }, "Login attempt with non-existent user");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordValid = password === userExists.password;

    if (!passwordValid) {
      logger.warn({ userId: userExists.id, email }, "Login attempt with invalid password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if user is active
    if (!userExists.active) {
      logger.warn({ userId: userExists.id, email }, "Login attempt with inactive account");
      return res.status(403).json({ message: "User account is inactive" });
    }

    // Generate token
    const token = randomUUID();

    // Delete expired sessions for this user
    await prisma.session.deleteMany({
      where: {
        userId: userExists.id,
        expiresAt: { lt: new Date() },
      },
    });

    // Create new session (expires in 15 minutes)
    await prisma.session.create({
      data: {
        token,
        userId: userExists.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    logger.info({ userId: userExists.id, email }, "User logged in successfully");
    res.set("x-auth-token", token);
    res.json({ message: "Login successful", token });
  } catch (error) {
    logger.error({ error, email: req.body.email }, "Error during login");
    res.status(500).json({ message: "Internal server error" });
  }
});

// User routes
v1.use("/users", userRouter);

export default v1;

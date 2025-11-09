import { randomUUID } from "node:crypto";
import express, { type Request, type Response, type Router } from "express";
import {
	sendError,
	sendErrorFromException,
	sendSuccess,
	sendSuccessNoData,
} from "@/lib/api-response-helper";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma-client";
import userRouter from "./user";

const v1: Router = express.Router();

v1.get("/", (_req: Request, res: Response) => {
	sendSuccess(res, { message: "Hello, World!" }, "Welcome to API v1");
});

v1.post("/register", async (req: Request, res: Response) => {
	try {
		const { name, email, password } = req.body;

		const userExists = await prisma.user.findFirst({
			where: { email },
		});

		if (userExists) {
			logger.warn({ email }, "Registration attempt with existing email");
			return sendError(res, "User already exists", 400);
		}

		const user = await prisma.user.create({
			data: { name, email, password },
		});

		if (user) {
			logger.info({ userId: user.id, email }, "User registered successfully");
			sendSuccessNoData(res, "User created successfully", 201);
		} else {
			logger.error({ email }, "Failed to create user");
			return sendError(res, "Failed to create user", 400);
		}
	} catch (error) {
		logger.error({ error, email: req.body.email }, "Error during registration");
		sendErrorFromException(
			res,
			error instanceof Error ? error : String(error),
			500
		);
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
			return sendError(res, "Invalid username or password", 401);
		}

		const passwordValid = password === userExists.password;

		if (!passwordValid) {
			logger.warn(
				{ userId: userExists.id, email },
				"Login attempt with invalid password"
			);
			return sendError(res, "Invalid username or password", 401);
		}

		// Check if user is active
		if (!userExists.active) {
			logger.warn(
				{ userId: userExists.id, email },
				"Login attempt with inactive account"
			);
			return sendError(res, "User account is inactive", 403);
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

		logger.info(
			{ userId: userExists.id, email },
			"User logged in successfully"
		);
		res.set("x-auth-token", token);
		sendSuccess(res, "Login successful");
	} catch (error) {
		logger.error({ error, email: req.body.email }, "Error during login");
		sendErrorFromException(
			res,
			error instanceof Error ? error : String(error),
			500
		);
	}
});

// User routes
v1.use("/users", userRouter);

export default v1;

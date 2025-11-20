import { apiReference } from "@scalar/express-api-reference";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { sendSuccess } from "@/lib/api-response-helper";
import { auth } from "./lib/auth";
import errorMiddleware from "./middleware/error.middleware";
import logMiddleware from "./middleware/log.middleware";

import v1 from "./routes/v1";

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

export const CreateServer = () => {
  const app = express();

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app
    .use(cors(corsOptions))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(logMiddleware);

  app.get(
    "/docs",
    apiReference({
      pageTitle: "API Documentation",
      sources: [
        // Better Auth schema generation endpoint
        { url: "/api/auth/open-api/generate-schema", title: "Auth" },
      ]
    })
  );

  app.get("/", (_req: Request, res: Response) => {
    sendSuccess(res, { message: "Hello, World!" }, "Welcome to API");
  });

  app.get("/health", (_req: Request, res: Response) => {
    sendSuccess(
      res,
      { timestamp: new Date().toISOString() },
      "Server is healthy"
    );
  });

  app.use(express.static("public"));

  app.use("/api/v1", v1);

  // Error handling middleware must be last
  app.use(errorMiddleware);

  return app;
};

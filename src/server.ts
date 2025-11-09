import { sendSuccess } from "@/lib/api-response-helper";
import cors from "cors";
import express, { type Request, type Response } from "express";
import logMiddleware from "./middleware/log.middleware";
import v1 from "./routes/v1";
import v2 from "./routes/v2";

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

export const CreateServer = () => {
  const app = express();

  app
    .use(cors(corsOptions))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(logMiddleware);

  app.get("/", (_req: Request, res: Response) => {
    sendSuccess(res, { message: "Hello, World!" }, "Welcome to API");
  });

  app.get("/health", (_req: Request, res: Response) => {
    sendSuccess(
      res,
      { timestamp: new Date().toISOString() },
      "Server is healthy",
    );
  });

  app.use(express.static("public"));

  app.use("/v1", v1);
  app.use("/v2", v2);

  return app;
};

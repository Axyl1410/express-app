import express, { Request, Response } from "express";
import logMiddleware from "./middleware/log.middleware";
import v1 from "./routes/v1";

const cors = require("cors");

export const CreateServer = () => {
  const app = express();

  app.use(cors()).use(logMiddleware);

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello, World!");
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timeStamp: new Date().toISOString() });
  });

  app.use("/v1", v1);

  return app;
};

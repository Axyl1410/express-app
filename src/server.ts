import express, { Request, Response } from "express";
import v1 from "./routes/v1";

export const CreateServer = () => {
  const app = express();

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello, World!");
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timeStamp: new Date().toISOString() });
  });

  app.use("/v1", v1);

  return app;
};

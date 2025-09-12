import express, { Request, Response } from "express";

export const CreateServer = () => {
  const app = express();

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello, World!");
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timeStamp: new Date().toISOString() });
  });

  return app;
};

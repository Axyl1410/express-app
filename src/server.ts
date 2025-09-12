import express, { Request, Response } from "express";

export const CreateServer = () => {
  const app = express();

  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true });
  });

  return app;
};

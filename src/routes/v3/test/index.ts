import express, { type Request, type Response, type Router } from "express";

const testRouter: Router = express.Router();

testRouter.get("/", (req: Request, res: Response) => {
  const key = req.headers["x-api-key"];

  res.json(key);
});

export default testRouter;

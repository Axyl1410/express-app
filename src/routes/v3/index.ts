import express, { type Request, type Response, type Router } from "express";
import todoRouter from "./todo";
import userRouter from "./user";
import testRouter from "./test";

const v3: Router = express.Router();

v3.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Hello, World!" });
});

v3.use("/todo", todoRouter);
v3.use("/user", userRouter);
v3.use("/test", testRouter);

export default v3;

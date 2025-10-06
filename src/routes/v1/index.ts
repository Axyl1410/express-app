import express, { type Router } from "express";
import chatRouter from "./chat";

const v1: Router = express.Router();

v1.use("/chat", chatRouter);

export default v1;

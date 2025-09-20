import express, { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import greet from "./greet";
import hello from "./hello";

const v1: Router = express.Router();

v1.use(authMiddleware);
v1.use("/hello", hello);
v1.use("/greet", greet);

export default v1;

import express, { Router } from "express";
import verifyIdRouter from "./verify-id";

const v2: Router = express.Router();

v2.use("/verify-id", verifyIdRouter);

export default v2;

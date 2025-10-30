import express, { type Router } from "express";
import { getUserService } from "./service";

const userRouter: Router = express.Router();

userRouter.get("/", getUserService);

export default userRouter;

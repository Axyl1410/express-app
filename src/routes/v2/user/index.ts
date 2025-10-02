import express, { Router } from "express";
import userMiddleware from "../../../middleware/user.middleware";
import { getUserService } from "./service";

const userRouter: Router = express.Router();

userRouter.use(userMiddleware);
userRouter.get("/", getUserService);

export default userRouter;

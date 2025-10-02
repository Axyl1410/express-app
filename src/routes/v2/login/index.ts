import express, { type Router } from "express";
import LoginMiddleware from "../../../middleware/login.middleware";
import { getLoginService } from "./service";

const loginRouter: Router = express.Router();

loginRouter.use(LoginMiddleware);
loginRouter.get("/", getLoginService);

export default loginRouter;

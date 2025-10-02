import express, { Router } from "express";
import WorkMiddleware from "../../../middleware/work.middleware";
import { getWorkService } from "./service";

const workRouter: Router = express.Router();

workRouter.use(WorkMiddleware);
workRouter.get("/", getWorkService);

export default workRouter;

import express, { type Router } from "express";
import filterMiddleware from "../../../middleware/filter.middleware";
import { filterService } from "./service";

const filterRouter: Router = express.Router();

filterRouter.use(filterMiddleware);
filterRouter.get("/", filterService);

export default filterRouter;

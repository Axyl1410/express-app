import express, { Router } from "express";
import { helloService } from "./hello";

const router: Router = express.Router();

router.get("/", helloService);

export default router;

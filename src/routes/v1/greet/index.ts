import express, { Router } from "express";
import { greetService } from "./greet";

const router: Router = express.Router();

router.get("/", greetService);

export default router;

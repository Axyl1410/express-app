import express, { Router } from "express";
import { checkOddEven } from "./controller";

const bai4: Router = express.Router();

bai4.use("/", checkOddEven);

export default bai4;

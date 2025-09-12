import express, { Router } from "express";
import { getEmoji } from "./controller";

const bai3: Router = express.Router();

bai3.get("/", getEmoji);

export default bai3;

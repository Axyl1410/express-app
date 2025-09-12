import express, { Router } from "express";
import { getLoremIpsum } from "./controller";

const bai2: Router = express.Router();

bai2.get("/", getLoremIpsum);

export default bai2;

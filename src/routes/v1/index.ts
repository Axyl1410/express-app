import express, { Router } from "express";
import bai2 from "./bai2";
import bai3 from "./bai3";
import bai4 from "./bai4";

const v1: Router = express.Router();

v1.use("/bai2", bai2);
v1.use("/bai3", bai3);
v1.use("/bai4", bai4);

export default v1;

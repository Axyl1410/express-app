import express, { Router } from "express";
import filter from "./filter";
import login from "./login";
import user from "./user";
import workRouter from "./work";

const v2: Router = express.Router();

v2.use("/work", workRouter);
v2.use("/user", user);
v2.use("/login", login);
v2.use("/filter", filter);

export default v2;

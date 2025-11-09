import express, { type Request, type Response, type Router } from "express";
import { sendSuccess } from "@/lib/api-response-helper";

const v2: Router = express.Router();

v2.get("/ping", (_req: Request, res: Response) => {
	sendSuccess(
		res,
		{
			timestamp: new Date().toISOString(),
		},
		"pong"
	);
});

export default v2;

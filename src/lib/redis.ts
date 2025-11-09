import { createClient } from "redis";
import { assertValue } from "./utils";

const REDIS_USERNAME = assertValue(
	process.env.REDIS_USERNAME,
	"REDIS_USERNAME is not set"
);

const REDIS_PASSWORD = assertValue(
	process.env.REDIS_PASSWORD,
	"REDIS_PASSWORD is not set"
);

const REDIS_HOST = assertValue(process.env.REDIS_HOST, "REDIS_HOST is not set");

const REDIS_PORT = assertValue(
	Number(process.env.REDIS_PORT),
	"REDIS_PORT is not set"
);

export const RedisClient = createClient({
	username: REDIS_USERNAME,
	password: REDIS_PASSWORD,
	socket: {
		host: REDIS_HOST,
		port: REDIS_PORT,
	},
});

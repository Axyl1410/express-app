import logger from "@/lib/logger";
import { config } from "./config";
import { CreateServer } from "./server";

const server = CreateServer();

server.listen(config.port, () => {
  logger.info(
    { port: config.port },
    `Server is running at http://localhost:${config.port}`
  );
});

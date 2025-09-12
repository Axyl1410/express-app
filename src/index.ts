import config from "./config";
import { CreateServer } from "./server";

const server = CreateServer();

server.listen(config.port, () => {
  console.log(`[server]: Server is running at http://localhost:${config.port}`);
});

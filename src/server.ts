import express, { type Request, type Response } from "express";
import { createServer } from "http";
import logMiddleware from "./middleware/log.middleware";
import { initSocketIO } from "./realtime";
import v1 from "./routes/v1";
import v2 from "./routes/v2";
import v3 from "./routes/v3";

const cors = require("cors");

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

export const CreateServer = () => {
  const app = express();

  app
    .use(cors(corsOptions))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(logMiddleware);

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello, World!");
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timeStamp: new Date().toISOString() });
  });

  app.use(express.static("public"));

  app.use("/v1", v1);
  app.use("/v2", v2);
  app.use("/v3", v3);

  const httpServer = createServer(app);
  const io = initSocketIO(httpServer);

  io.on("connection", (socket) => {
    socket.on("chat:join", (chatId: string) => {
      if (chatId) socket.join(`chat:${chatId}`);
    });
    socket.on("chat:leave", (chatId: string) => {
      if (chatId) socket.leave(`chat:${chatId}`);
    });
    socket.on(
      "chat:typing",
      (chatId: string, payload: { userId: string; typing: boolean }) => {
        if (chatId) socket.to(`chat:${chatId}`).emit("chat:typing", payload);
      }
    );
  });

  return httpServer;
};

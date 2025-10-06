import express, { type Router } from "express";
import {
  createMessageController,
  createPrivateChatController,
  listChatsController,
  listMessagesController,
  typingController,
} from "./controller";

const chatRouter: Router = express.Router();

// Create a private chat between two users (idempotent)
chatRouter.post("/", createPrivateChatController);

// List chats for a user (simple: membership.userId = query.userId)
chatRouter.get("/", listChatsController);

// Get messages in a chat
chatRouter.get("/:chatId/messages", listMessagesController);

// Send a message
chatRouter.post("/:chatId/messages", createMessageController);

// Typing via REST (optional helper) – mirror socket event
chatRouter.post("/:chatId/typing", typingController);

export default chatRouter;

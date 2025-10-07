import type { Request, Response } from "express";
import { getIO } from "../../../realtime";
import {
  createMessage,
  createPrivateChat,
  ensureUsersExist,
  findExistingPrivateChat,
  listChats,
  listMessages,
} from "./service";
import {
  createMessageBodySchema,
  createMessageParamsSchema,
  createPrivateChatSchema,
  isZodBadRequestError,
  listChatsQuerySchema,
  listMessagesParamsSchema,
  listMessagesQuerySchema,
  parseOr400,
  respondBadRequest,
  roomForChat,
  typingBodySchema,
  typingParamsSchema,
} from "./validation";

export async function createPrivateChatController(req: Request, res: Response) {
  try {
    const { userId, otherUserId, name } = parseOr400(
      createPrivateChatSchema,
      req.body
    );
    if (userId === otherUserId) {
      return respondBadRequest(res, "Cannot create private chat with yourself");
    }
    const ok = await ensureUsersExist(userId, otherUserId);
    if (!ok) {
      return res
        .status(404)
        .json({ ok: false, message: "One or both users not found" });
    }
    const existed = await findExistingPrivateChat(userId, otherUserId);
    if (existed) {
      return res.json({ ok: true, existed: true, data: existed });
    }
    const chat = await createPrivateChat(userId, otherUserId, name);
    const io = getIO();
    if (io) {
      io.to(roomForChat(chat?.id as string)).emit("chat:created", { chat });
    }
    return res.status(201).json({ ok: true, existed: false, data: chat });
  } catch (e) {
    if (isZodBadRequestError(e)) return respondBadRequest(res, e.message);
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function listChatsController(req: Request, res: Response) {
  try {
    const { userId } = parseOr400(listChatsQuerySchema, req.query);
    const chats = await listChats(userId);
    return res.json({ ok: true, data: chats });
  } catch (e) {
    if (isZodBadRequestError(e)) return respondBadRequest(res, e.message);
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function listMessagesController(req: Request, res: Response) {
  try {
    const { chatId } = parseOr400(listMessagesParamsSchema, req.params);
    const { cursor, limit } = parseOr400(listMessagesQuerySchema, req.query);
    const take = Math.min(limit || 30, 100);
    const messages = await listMessages(chatId, cursor, take);
    return res.json({ ok: true, data: messages });
  } catch (e) {
    if (isZodBadRequestError(e)) return respondBadRequest(res, e.message);
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function createMessageController(req: Request, res: Response) {
  try {
    const { chatId } = parseOr400(createMessageParamsSchema, req.params);
    const { senderId, content } = parseOr400(createMessageBodySchema, req.body);
    const message = await createMessage(chatId, senderId, content);
    const io = getIO();
    if (io) {
      io.to(roomForChat(chatId)).emit("chat:new-message", { chatId, message });
    }
    return res.status(201).json({ ok: true, data: message });
  } catch (e) {
    if (isZodBadRequestError(e)) return respondBadRequest(res, e.message);
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export function typingController(req: Request, res: Response) {
  try {
    const { chatId } = parseOr400(typingParamsSchema, req.params);
    const { userId, typing } = parseOr400(typingBodySchema, req.body);
    const io = getIO();
    if (io) {
      io.to(roomForChat(chatId)).emit("chat:typing", { userId, typing });
    }
    return res.json({ ok: true });
  } catch (e) {
    if (isZodBadRequestError(e)) return respondBadRequest(res, e.message);
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

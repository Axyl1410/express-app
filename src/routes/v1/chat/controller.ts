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

export async function createPrivateChatController(req: Request, res: Response) {
  try {
    const { userId, otherUserId, name } = req.body as {
      userId: string;
      otherUserId: string;
      name?: string;
    };
    if (!userId || !otherUserId)
      return res
        .status(400)
        .json({ ok: false, message: "userId and otherUserId required" });
    if (userId === otherUserId)
      return res.status(400).json({
        ok: false,
        message: "Cannot create private chat with yourself",
      });
    const ok = await ensureUsersExist(userId, otherUserId);
    if (!ok)
      return res
        .status(404)
        .json({ ok: false, message: "One or both users not found" });
    const existed = await findExistingPrivateChat(userId, otherUserId);
    if (existed) return res.json({ ok: true, existed: true, data: existed });
    const chat = await createPrivateChat(userId, otherUserId, name);
    const io = getIO();
    if (io) {
      io.to(`chat:${chat?.id}`).emit("chat:created", { chat: chat });
    }
    return res.status(201).json({ ok: true, existed: false, data: chat });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function listChatsController(req: Request, res: Response) {
  try {
    const { userId } = req.query as { userId?: string };
    const chats = await listChats(userId);
    return res.json({ ok: true, data: chats });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function listMessagesController(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const take = Math.min(Number(limit) || 30, 100);
    const messages = await listMessages(chatId, cursor, take);
    return res.json({ ok: true, data: messages });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export async function createMessageController(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    const { senderId, content, repliedToId } = req.body as {
      senderId: string;
      content: string;
      repliedToId?: string;
    };
    if (!senderId || !content)
      return res
        .status(400)
        .json({ ok: false, message: "senderId and content required" });
    const message = await createMessage(chatId, senderId, content, repliedToId);
    const io = getIO();
    if (io)
      io.to(`chat:${chatId}`).emit("chat:new-message", { chatId, message });
    return res.status(201).json({ ok: true, data: message });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, message: (e as Error).message || "Failed" });
  }
}

export function typingController(req: Request, res: Response) {
  const { chatId } = req.params;
  const { userId, typing } = req.body as { userId: string; typing: boolean };
  const io = getIO();
  if (io) io.to(`chat:${chatId}`).emit("chat:typing", { userId, typing });
  return res.json({ ok: true });
}

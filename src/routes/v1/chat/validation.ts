import type { Response } from "express";
import { z } from "zod";

// ---- Reusable helpers ----
export function respondBadRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

export type ZodBadRequestError = { __zod: true; message: string };
export function isZodBadRequestError(err: unknown): err is ZodBadRequestError {
  return typeof err === "object" && err !== null && "__zod" in err;
}

export function parseOr400<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw {
      __zod: true,
      message: parsed.error.issues[0]?.message || "Invalid input",
    } satisfies ZodBadRequestError;
  }
  return parsed.data;
}

export function roomForChat(chatId: string) {
  return `chat:${chatId}`;
}

// ---- Schemas ----
export const createPrivateChatSchema = z.object({
  userId: z.string().min(1),
  otherUserId: z.string().min(1),
  name: z.string().min(1).optional(),
});

export const listChatsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
});

export const listMessagesParamsSchema = z.object({
  chatId: z.string().min(1),
});
export const listMessagesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Number(v))
    .optional(),
});

export const createMessageParamsSchema = z.object({
  chatId: z.string().min(1),
});
export const createMessageBodySchema = z.object({
  senderId: z.string().min(1),
  content: z.string().min(1),
});

export const typingParamsSchema = z.object({
  chatId: z.string().min(1),
});
export const typingBodySchema = z.object({
  userId: z.string().min(1),
  typing: z.boolean(),
});

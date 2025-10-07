import { ConversationType } from "@prisma/client";
import prisma from "../../../prisma-client";

export async function ensureUsersExist(
  userId: string,
  otherUserId: string
): Promise<boolean> {
  const users = await prisma.user.findMany({
    where: { id: { in: [userId, otherUserId] } },
    select: { id: true },
  });
  return users.length === 2;
}

export async function findExistingPrivateChat(
  userId: string,
  otherUserId: string
) {
  return await prisma.conversation.findFirst({
    where: {
      type: ConversationType.PRIVATE,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: { participants: { include: { user: true } } },
  });
}

export async function createPrivateChat(
  userId: string,
  otherUserId: string,
  name?: string
) {
  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.PRIVATE,
      name: name || null,
    },
  });
  await Promise.all([
    prisma.conversationParticipant.upsert({
      where: {
        userId_conversationId: { conversationId: conversation.id, userId },
      },
      update: {},
      create: { conversationId: conversation.id, userId },
    }),
    prisma.conversationParticipant.upsert({
      where: {
        userId_conversationId: {
          conversationId: conversation.id,
          userId: otherUserId,
        },
      },
      update: {},
      create: { conversationId: conversation.id, userId: otherUserId },
    }),
  ]);
  return prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: { participants: { include: { user: true } } },
  });
}

export async function listChats(userId?: string) {
  return await prisma.conversation.findMany({
    where: userId ? { participants: { some: { userId } } } : {},
    orderBy: { updatedAt: "desc" },
    include: { participants: { include: { user: true } } },
    take: 50,
  });
}

export async function listMessages(
  conversationId: string,
  cursor?: string,
  take: number = 30
) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { sender: true },
  });
}

export async function createMessage(
  conversationId: string,
  senderId: string,
  content?: string
) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content ?? null,
    },
    include: { sender: true },
  });
  return message;
}

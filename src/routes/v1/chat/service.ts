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
  return prisma.chat.findFirst({
    where: {
      type: "private",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: { lastMessage: true, members: true },
  });
}

export async function createPrivateChat(
  userId: string,
  otherUserId: string,
  name?: string
) {
  const chat = await prisma.chat.create({
    data: { type: "private", name: name || null },
  });
  await Promise.all([
    prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId } },
      update: {},
      create: { chatId: chat.id, userId },
    }),
    prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId: otherUserId } },
      update: {},
      create: { chatId: chat.id, userId: otherUserId },
    }),
  ]);
  return prisma.chat.findUnique({
    where: { id: chat.id },
    include: { members: true, lastMessage: true },
  });
}

export async function listChats(userId?: string) {
  return prisma.chat.findMany({
    where: userId ? { members: { some: { userId } } } : {},
    orderBy: { updatedAt: "desc" },
    include: { lastMessage: true, members: true },
    take: 50,
  });
}

export async function listMessages(
  chatId: string,
  cursor?: string,
  take: number = 30
) {
  return prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { sender: true, repliedTo: true },
  });
}

export async function createMessage(
  chatId: string,
  senderId: string,
  content: string,
  repliedToId?: string
) {
  const message = await prisma.message.create({
    data: { chatId, senderId, content, repliedToId: repliedToId || null },
    include: { sender: true, repliedTo: true },
  });
  await prisma.chat.update({
    where: { id: chatId },
    data: { lastMessageId: message.id, updatedAt: new Date() },
  });
  return message;
}

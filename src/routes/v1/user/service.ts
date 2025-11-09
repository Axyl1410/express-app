import prisma from "@/lib/prisma-client";
import { RedisClient } from "@/lib/redis";
import type { UserInterface } from "@/types/user";

export const getUsers = async () => {
  const cacheKey = "users";

  if (!RedisClient.isOpen) {
    await RedisClient.connect();
  }

  const cached = await RedisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const users = await prisma.user.findMany();
  await RedisClient.setEx(cacheKey, 60, JSON.stringify(users));

  return users;
};

export const updateUser = async (
  id: string,
  data: Partial<Omit<UserInterface, "id" | "active">>
) => {
  // Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { id },
  });

  if (!userExists) {
    throw new Error("User not found");
  }

  // Check if email is being changed and if it's already taken
  if (data.email && data.email !== userExists.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Email already exists");
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: {
      name: true,
      email: true,
      phone: true,
      password: true,
    },
  });

  // Invalidate cache AFTER successful DB update to avoid race conditions
  try {
    if (!RedisClient.isOpen) {
      await RedisClient.connect();
    }
    await RedisClient.del("users");
  } catch (_) {
    // Swallow cache errors; cache will naturally expire
  }

  return updatedUser;
};

export const deleteUser = async (id: string) => {
  // Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { id },
  });

  if (!userExists) {
    throw new Error("User not found");
  }

  // Set user as inactive
  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  // Delete all sessions for this user
  await prisma.session.deleteMany({
    where: { userId: id },
  });

  // Invalidate cache AFTER successful DB changes
  try {
    if (!RedisClient.isOpen) {
      await RedisClient.connect();
    }
    await RedisClient.del("users");
  } catch (_) {
    // Swallow cache errors; cache will naturally expire
  }

  return { message: "User deactivated successfully" };
};

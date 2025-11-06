import { RedisClient } from "../../../lib/redis";
import prisma from "../../../prisma-client";
import type { UserInterface } from "../../../types/user";

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

  // Invalidate cache
  if (!RedisClient.isOpen) {
    await RedisClient.connect();
  }
  await RedisClient.del("users");

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

  // Invalidate cache
  if (!RedisClient.isOpen) {
    await RedisClient.connect();
  }
  await RedisClient.del("users");

  // Set user as inactive
  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  // Delete all sessions for this user
  await prisma.session.deleteMany({
    where: { userId: id },
  });

  return { message: "User deactivated successfully" };
};

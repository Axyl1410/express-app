/**
 * Redis Cache Helper
 *
 * Provides utility functions for caching data in Redis with automatic
 * connection management and JSON serialization/deserialization.
 */

import logger from "@/lib/logger";
import { RedisClient } from "./redis";

/**
 * Ensure Redis connection is open
 * @throws Error if connection fails
 */
async function ensureConnection(): Promise<void> {
  if (!RedisClient.isOpen) {
    await RedisClient.connect();
    logger.debug("Redis connection established");
  }
}

/**
 * Set cache data with optional TTL (Time To Live)
 * @param key - Cache key
 * @param data - Data to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 60)
 * @throws Error if cache operation fails
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl = 60
): Promise<void> {
  try {
    await ensureConnection();

    const serialized = JSON.stringify(data);
    await RedisClient.setEx(key, ttl, serialized);

    logger.debug({ key, ttl }, "Cache set successfully");
  } catch (error) {
    logger.error({ error, key }, "Failed to set cache");
    throw new Error(
      `Failed to set cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get cached data by key
 * @param key - Cache key
 * @returns Parsed data or null if not found
 * @throws Error if cache operation fails
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    await ensureConnection();

    const cached = await RedisClient.get(key);

    if (!cached) {
      logger.debug({ key }, "Cache miss");
      return null;
    }

    const parsed = JSON.parse(cached) as T;
    logger.debug({ key }, "Cache hit");
    return parsed;
  } catch (error) {
    logger.error({ error, key }, "Failed to get cache");
    throw new Error(
      `Failed to get cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete cache by key
 * @param key - Cache key to delete
 * @throws Error if cache operation fails
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await ensureConnection();

    await RedisClient.del(key);
    logger.debug({ key }, "Cache deleted successfully");
  } catch (error) {
    logger.error({ error, key }, "Failed to delete cache");
    throw new Error(
      `Failed to delete cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete multiple cache keys
 * @param keys - Array of cache keys to delete
 * @throws Error if cache operation fails
 */
export async function deleteCacheMultiple(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  try {
    await ensureConnection();

    await RedisClient.del(keys);
    logger.debug(
      { keys, count: keys.length },
      "Multiple cache keys deleted successfully"
    );
  } catch (error) {
    logger.error({ error, keys }, "Failed to delete multiple cache keys");
    throw new Error(
      `Failed to delete multiple cache keys: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if cache key exists
 * @param key - Cache key to check
 * @returns true if key exists, false otherwise
 * @throws Error if cache operation fails
 */
export async function existsCache(key: string): Promise<boolean> {
  try {
    await ensureConnection();

    const exists = await RedisClient.exists(key);
    return exists > 0;
  } catch (error) {
    logger.error({ error, key }, "Failed to check cache existence");
    throw new Error(
      `Failed to check cache existence: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get cache TTL (Time To Live) in seconds
 * @param key - Cache key
 * @returns TTL in seconds, -1 if key has no expiration, -2 if key doesn't exist
 * @throws Error if cache operation fails
 */
export async function getCacheTTL(key: string): Promise<number> {
  try {
    await ensureConnection();

    const ttl = await RedisClient.ttl(key);
    return ttl;
  } catch (error) {
    logger.error({ error, key }, "Failed to get cache TTL");
    throw new Error(
      `Failed to get cache TTL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 * Redis is optional - if connection fails, caching will be disabled
 */
export function getRedis(): Redis | null {
  if (redis) {
    return redis;
  }

  // Redis is optional for development
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not configured - caching disabled');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('[Redis] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      reconnectOnError: (err) => {
        console.error('[Redis] Connection error:', err.message);
        return true;
      },
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });

    redis.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    return redis;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    return null;
  }
}

/**
 * Cache helper with automatic JSON serialization
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[Redis] Failed to get key "${key}":`, error);
    return null;
  }
}

/**
 * Set cache with TTL (in seconds)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = 300 // 5 minutes default
): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const serialized = JSON.stringify(value);
    await client.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to set key "${key}":`, error);
    return false;
  }
}

/**
 * Delete cache key(s)
 */
export async function cacheDel(...keys: string[]): Promise<boolean> {
  const client = getRedis();
  if (!client || keys.length === 0) return false;

  try {
    await client.del(...keys);
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to delete keys:`, error);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to delete pattern "${pattern}":`, error);
    return false;
  }
}

/**
 * Cache wrapper for functions
 * Usage: const result = await withCache('key', ttl, () => expensiveOperation());
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await cacheSet(key, result, ttl);
  return result;
}

/**
 * Generate cache key for user-specific data
 */
export function userCacheKey(userId: number, suffix: string): string {
  return `user:${userId}:${suffix}`;
}

/**
 * Generate cache key for farm-specific data
 */
export function farmCacheKey(farmId: number, suffix: string): string {
  return `farm:${farmId}:${suffix}`;
}

/**
 * Invalidate all user-related cache
 */
export async function invalidateUserCache(userId: number): Promise<boolean> {
  return cacheDelPattern(`user:${userId}:*`);
}

/**
 * Invalidate all farm-related cache
 */
export async function invalidateFarmCache(farmId: number): Promise<boolean> {
  return cacheDelPattern(`farm:${farmId}:*`);
}

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('[Redis] REDIS_URL not set, Redis caching disabled.')
    return null
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    })

    client.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })

    return client
  } catch (err) {
    console.error('[Redis] Failed to create client:', err)
    return null
  }
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : (globalForRedis.redis = createRedisClient())

export async function redisGet(key: string): Promise<string | null> {
  if (!redis) return null
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds = 3600
): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, value, 'EX', ttlSeconds)
  } catch {
    // silently fail
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // silently fail
  }
}

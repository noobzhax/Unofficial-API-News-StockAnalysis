/**
 * Simple in-memory TTL cache for serverless functions.
 * Each Vercel instance has its own cache — not shared across instances.
 */
const store = new Map()

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheSet(key, value, ttlSeconds = 300) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
    cachedAt: new Date().toISOString()
  })
}

export function cacheGetMeta(key) {
  const entry = store.get(key)
  if (!entry) return null
  return { cachedAt: entry.cachedAt, expiresAt: new Date(entry.expiresAt).toISOString() }
}

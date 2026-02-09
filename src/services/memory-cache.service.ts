const cache = new Map<string, { data: any; expires: number }>();

export function getCache(key: string) {
  const item = cache.get(key);
  if (!item || Date.now() > item.expires) return null;
  return item.data;
}

export function setCache(key: string, data: any, ttlMs: number) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs
  });
}

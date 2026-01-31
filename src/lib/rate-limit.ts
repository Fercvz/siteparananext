type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(limit - entry.count, 0),
    resetAt: entry.resetAt,
  };
}

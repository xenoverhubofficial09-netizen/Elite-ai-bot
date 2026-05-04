/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per user ID.
 *
 * Configured via environment variables:
 *   RATE_LIMIT_MAX_REQUESTS  — max requests per window (default: 5)
 *   RATE_LIMIT_WINDOW_MS     — window size in ms (default: 60000 = 1 minute)
 */

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 5;
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;

/** @type {Map<string, number[]>} userId → array of request timestamps */
const requestLog = new Map();

/**
 * Checks whether a user is within the allowed rate limit.
 *
 * @param {string} userId - Discord user ID.
 * @returns {{ allowed: boolean, retryAfterSeconds?: number }}
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing timestamps, filter out expired ones
  const timestamps = (requestLog.get(userId) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);

  // Schedule cleanup to avoid memory leaks
  setTimeout(() => {
    const current = requestLog.get(userId);
    if (current) {
      const pruned = current.filter((t) => t > Date.now() - WINDOW_MS);
      if (pruned.length === 0) {
        requestLog.delete(userId);
      } else {
        requestLog.set(userId, pruned);
      }
    }
  }, WINDOW_MS);

  return { allowed: true };
}

module.exports = { checkRateLimit };

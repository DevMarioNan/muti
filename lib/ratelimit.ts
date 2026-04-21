import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Rate limiter for auth endpoints: 10 requests per minute per IP
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
})

// Rate limiter for webhook endpoints
export const webhookRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:webhook",
})

export interface RateLimitInfo {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function checkRateLimit(
  ratelimit: Ratelimit,
  identifier: string
): Promise<RateLimitInfo> {
  const result = await ratelimit.limit(identifier)
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

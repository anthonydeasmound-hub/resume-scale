import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    // Allow 20 AI requests per 60-second window per user
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "ratelimit:ai",
  });
}

/**
 * Check rate limit for a user. Returns null if allowed, or a NextResponse if blocked.
 * Gracefully skips if Upstash is not configured.
 */
export async function checkRateLimit(
  userEmail: string
): Promise<NextResponse | null> {
  if (!ratelimit) {
    // Upstash not configured — allow all requests
    return null;
  }

  const { success, remaining, reset } = await ratelimit.limit(userEmail);

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  }

  return null;
}

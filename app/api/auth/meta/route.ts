import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { authRateLimiter, checkRateLimit } from "@/lib/ratelimit"

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous"
  const { success, remaining, limit } = await checkRateLimit(authRateLimiter, ip)

  if (!success) {
    console.warn(`Rate limit exceeded for IP: ${ip}`)
  } else {
    console.log(`Rate limit: ${remaining}/${limit} remaining for IP: ${ip}`)
  }

  const clientId = process.env.INSTAGRAM_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Instagram OAuth not configured" },
      { status: 500 }
    )
  }

  // Generate cryptographically secure state parameter to prevent CSRF
  const state = randomBytes(32).toString("hex")

  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
    "instagram_business_manage_insights",
  ].join(",")

  const authUrl = new URL("https://api.instagram.com/oauth/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", scopes)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("state", state)

  const response = NextResponse.json({ url: authUrl.toString() })

  // Store state in cookie for validation on callback
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  return response
}
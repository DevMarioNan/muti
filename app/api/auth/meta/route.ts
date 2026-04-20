import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.INSTAGRAM_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Instagram OAuth not configured" },
      { status: 500 }
    )
  }

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

  return NextResponse.json({ url: authUrl.toString() })
}
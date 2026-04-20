import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorReason = searchParams.get("error_reason")

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=${errorReason || error}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=missing_code`)
  }

  // Exchange code for access token
  const tokenUrl = "https://api.instagram.com/oauth/access_token"
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: process.env.META_REDIRECT_URI!,
    code,
  })

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  const data = await response.json()

  if (data.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=${data.error.message}`
    )
  }

  // TODO: Store the access token and user info in the database
  // For now, just redirect to dashboard with the token info
  const token = data.access_token
  const instagramUserId = data.user_id

  // Redirect to dashboard where user can complete onboarding
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?instagram_connected=true&ig_user_id=${instagramUserId}&token=${token}`
  )
}
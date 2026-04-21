import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/auth"
import { cookies } from "next/headers"
import { encryptToken } from "@/lib/crypto"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorReason = searchParams.get("error_reason")
  const state = searchParams.get("state")

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=${errorReason || error}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=missing_code`)
  }

  // Validate state parameter to prevent CSRF attacks
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?reason=invalid_state`
    )
  }

  // Clear the state cookie after validation
  cookieStore.delete("oauth_state")

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

  // Get Instagram user info to get username
  let instagramUsername: string | undefined
  let profilePictureUrl: string | undefined

  try {
    const userInfoUrl = new URL("https://graph.instagram.com/me")
    userInfoUrl.searchParams.set("fields", "username,profile_picture_url")
    userInfoUrl.searchParams.set("access_token", data.access_token)

    const userInfoResponse = await fetch(userInfoUrl.toString())
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      instagramUsername = userInfo.username
      profilePictureUrl = userInfo.profile_picture_url
    }
  } catch {
    // Continue without username/picture
  }

  // Encrypt the access token before storing
  const encryptedToken = encryptToken(data.access_token)

  // Sign in with NextAuth using credentials (includes storing encrypted token in DB via authorize)
  const redirectUrl = new URL("/dashboard", request.url)
  redirectUrl.searchParams.set("instagram_connected", "true")

  await signIn("credentials", {
    instagramToken: encryptedToken,
    instagramUserId: data.user_id,
    instagramUsername,
    profilePictureUrl,
    redirectTo: redirectUrl.toString(),
  })

  // This won't be reached if signIn redirects
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
}
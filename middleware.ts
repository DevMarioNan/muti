import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const isLoggedIn = !!token
  const { pathname } = req.nextUrl

  // Protect /dashboard and its subpaths
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // API routes that need protection
  if (pathname.startsWith("/api/stripe") && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/stripe/:path*"],
}